"""
多模型音频转文字引擎 - 针对Windows NVIDIA RTX 3060 Ti优化
支持Whisper、FiredASR等多种模型的GPU加速转录
"""
import os
import sys
import json
import time
import logging
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Callable, Union, Any
from dataclasses import dataclass, field

# GPU相关导入
try:
    import torch
    import whisper
    import numpy as np
    TORCH_AVAILABLE = True
except ImportError:
    torch = None
    whisper = None
    np = None
    TORCH_AVAILABLE = False
    print("警告: PyTorch未安装，将使用CPU模式")

try:
    import tensorrt as trt
    TENSORRT_AVAILABLE = True
except ImportError:
    trt = None
    TENSORRT_AVAILABLE = False
    print("警告: TensorRT未安装，无法使用TensorRT加速")

# 中文处理导入
try:
    from chinese_processor import ChineseProcessor
    CHINESE_PROCESSOR_AVAILABLE = True
except ImportError:
    CHINESE_PROCESSOR_AVAILABLE = False
    print("警告: 中文处理器未安装")

@dataclass
class TranscriptionConfig:
    model_name: str = "whisper-large-v3"
    language: str = "zh"
    use_gpu: bool = True
    use_tensorrt: bool = True
    beam_size: int = 5
    temperature: float = 0.0
    chinese_settings: Optional[Dict] = None
    output_formats: List[str] = None

    def __post_init__(self):
        if self.output_formats is None:
            self.output_formats = ["srt", "vtt", "txt"]
        if self.chinese_settings is None:
            self.chinese_settings = {
                "variant": "simplified",
                "multi_pronunciation": True,
                "smart_punctuation": True,
                "segmentation_method": "jieba"
            }

@dataclass
class TranscriptionSegment:
    start: float
    end: float
    text: str
    confidence: float = 0.0

@dataclass
class TranscriptionResult:
    segments: List[TranscriptionSegment]
    full_text: str
    model_used: str
    processing_time: float
    gpu_used: bool
    tensorrt_used: bool
    chinese_processed: bool = False

class GPUDetector:
    """GPU检测和优化设置"""
    
    @staticmethod
    def detect_gpu() -> Dict[str, Union[str, int, bool]]:
        """检测GPU信息"""
        gpu_info = {
            "available": False,
            "name": "",
            "memory_total": 0,
            "memory_free": 0,
            "cuda_version": "",
            "compute_capability": "",
            "tensorrt_compatible": False
        }
        
        if not TORCH_AVAILABLE:
            return gpu_info
        
        if torch.cuda.is_available():
            gpu_info["available"] = True
            gpu_info["name"] = torch.cuda.get_device_name(0)
            
            # 获取显存信息
            memory_total = torch.cuda.get_device_properties(0).total_memory
            memory_reserved = torch.cuda.memory_reserved(0)
            memory_allocated = torch.cuda.memory_allocated(0)
            
            gpu_info["memory_total"] = memory_total // (1024**2)  # MB
            gpu_info["memory_free"] = (memory_total - memory_reserved) // (1024**2)  # MB
            gpu_info["memory_allocated"] = memory_allocated // (1024**2)  # MB
            
            # CUDA版本
            gpu_info["cuda_version"] = torch.version.cuda
            
            # 计算能力
            props = torch.cuda.get_device_properties(0)
            gpu_info["compute_capability"] = f"{props.major}.{props.minor}"
            
            # TensorRT兼容性检查
            gpu_info["tensorrt_compatible"] = TENSORRT_AVAILABLE and float(gpu_info["compute_capability"]) >= 6.1
        
        return gpu_info
    
    @staticmethod
    def optimize_for_rtx_3060ti() -> Dict[str, Union[str, int]]:
        """为RTX 3060 Ti优化设置"""
        return {
            "max_batch_size": 1,
            "fp16_mode": True,
            "workspace_size": 2 << 30,  # 2GB
            "max_memory_fraction": 0.85,  # 使用85%显存
            "optimization_level": 3,
            "dla_core": -1,
            "calibration_cache": "calibration_cache_rtx3060ti.bin"
        }

class WhisperTranscriber:
    """Whisper模型转录器"""
    
    def __init__(self, config: TranscriptionConfig):
        self.config = config
        self.model = None
        self.device = "cuda" if config.use_gpu and torch.cuda.is_available() else "cpu"
        self.gpu_info = GPUDetector.detect_gpu()
        
    def load_model(self):
        """加载Whisper模型"""
        if not TORCH_AVAILABLE:
            raise RuntimeError("PyTorch未安装，无法使用Whisper模型")
        
        model_name = self.config.model_name.replace("whisper-", "")
        
        try:
            self.model = whisper.load_model(model_name, device=self.device)
            logging.info(f"Whisper模型 {model_name} 已加载到 {self.device}")
            
            if self.device == "cuda":
                # 为RTX 3060 Ti优化
                torch.backends.cudnn.benchmark = True
                torch.backends.cuda.matmul.allow_tf32 = True
                
        except Exception as e:
            logging.error(f"加载Whisper模型失败: {e}")
            raise
    
    def transcribe(self, audio_path: str, progress_callback: Optional[Callable] = None) -> TranscriptionResult:
        """转录音频文件"""
        if self.model is None:
            self.load_model()
        
        start_time = time.time()
        
        try:
            # Whisper转录参数
            options = {
                "language": self.config.language,
                "temperature": self.config.temperature,
                "beam_size": self.config.beam_size,
                "fp16": self.device == "cuda",
                "verbose": False
            }
            
            if progress_callback:
                progress_callback(10, "开始转录...")
            
            result = self.model.transcribe(audio_path, **options)
            
            if progress_callback:
                progress_callback(80, "转录完成，处理结果...")
            
            # 转换为标准格式
            segments = []
            for segment in result["segments"]:
                segments.append(TranscriptionSegment(
                    start=segment["start"],
                    end=segment["end"],
                    text=segment["text"].strip(),
                    confidence=segment.get("avg_logprob", 0.0)
                ))
            
            processing_time = time.time() - start_time
            
            return TranscriptionResult(
                segments=segments,
                full_text=result["text"],
                model_used=self.config.model_name,
                processing_time=processing_time,
                gpu_used=self.device == "cuda",
                tensorrt_used=False  # Whisper默认不使用TensorRT
            )
            
        except Exception as e:
            logging.error(f"Whisper转录失败: {e}")
            raise

class FiredASRTranscriber:
    """FiredASR模型转录器"""
    
    def __init__(self, config: TranscriptionConfig):
        self.config = config
        self.model = None
        
    def load_model(self):
        """加载FiredASR模型"""
        try:
            # 这里需要根据实际的FiredASR API进行调整
            logging.info("FiredASR模型加载中...")
            # 模拟模型加载
            self.model = "fireredasr_loaded"
            logging.info("FiredASR模型加载完成")
        except Exception as e:
            logging.error(f"加载FiredASR模型失败: {e}")
            raise
    
    def transcribe(self, audio_path: str, progress_callback: Optional[Callable] = None) -> TranscriptionResult:
        """使用FiredASR转录"""
        if self.model is None:
            self.load_model()
        
        start_time = time.time()
        
        try:
            if progress_callback:
                progress_callback(10, "FiredASR转录中...")
            
            # 这里需要实际的FiredASR转录逻辑
            # 目前作为占位符实现
            segments = [
                TranscriptionSegment(
                    start=0.0,
                    end=5.0,
                    text="FiredASR转录结果示例",
                    confidence=0.95
                )
            ]
            
            processing_time = time.time() - start_time
            
            if progress_callback:
                progress_callback(100, "FiredASR转录完成")
            
            return TranscriptionResult(
                segments=segments,
                full_text="FiredASR转录结果示例",
                model_used=self.config.model_name,
                processing_time=processing_time,
                gpu_used=True,
                tensorrt_used=False
            )
            
        except Exception as e:
            logging.error(f"FiredASR转录失败: {e}")
            raise

class MultiModelTranscriber:
    """多模型转录器管理器"""
    
    def __init__(self):
        self.transcribers = {}
        self.gpu_info = GPUDetector.detect_gpu()
        self.chinese_processor = None
        
        if CHINESE_PROCESSOR_AVAILABLE:
            self.chinese_processor = ChineseProcessor({})
    
    def get_available_models(self) -> List[Dict]:
        """获取可用模型列表"""
        models = []
        
        # Whisper模型
        if TORCH_AVAILABLE:
            whisper_models = [
                {
                    "name": "whisper-large-v3",
                    "display_name": "Whisper Large V3 (推荐)",
                    "memory_required": 4096,
                    "description": "最新的Whisper大模型，中文识别准确率最高"
                },
                {
                    "name": "whisper-medium",
                    "display_name": "Whisper Medium (平衡)",
                    "memory_required": 2048,
                    "description": "中等大小模型，速度与准确率平衡"
                },
                {
                    "name": "whisper-small",
                    "display_name": "Whisper Small (快速)",
                    "memory_required": 1024,
                    "description": "小模型，处理速度快但准确率稍低"
                }
            ]
            models.extend(whisper_models)
        
        # FiredASR模型
        models.append({
            "name": "fireredasr-aed",
            "display_name": "FiredASR AED (专业中文)",
            "memory_required": 3072,
            "description": "专门针对中文优化的ASR模型，支持方言识别"
        })
        
        return models
    
    def check_model_compatibility(self, model_name: str) -> Dict[str, Union[bool, str]]:
        """检查模型兼容性"""
        compatibility = {
            "compatible": False,
            "reason": "",
            "memory_sufficient": False,
            "gpu_supported": False
        }
        
        model_requirements = {
            "whisper-large-v3": 4096,
            "whisper-medium": 2048,
            "whisper-small": 1024,
            "fireredasr-aed": 3072
        }
        
        required_memory = model_requirements.get(model_name, 0)
        
        if self.gpu_info["available"]:
            compatibility["gpu_supported"] = True
            
            if self.gpu_info["memory_free"] >= required_memory:
                compatibility["memory_sufficient"] = True
                compatibility["compatible"] = True
                compatibility["reason"] = "模型兼容"
            else:
                compatibility["reason"] = f"显存不足，需要{required_memory}MB，可用{self.gpu_info['memory_free']}MB"
        else:
            compatibility["reason"] = "未检测到可用GPU"
        
        return compatibility
    
    def create_transcriber(self, config: TranscriptionConfig):
        """创建指定模型的转录器"""
        if config.model_name.startswith("whisper"):
            return WhisperTranscriber(config)
        elif config.model_name.startswith("fireredasr"):
            return FiredASRTranscriber(config)
        else:
            raise ValueError(f"不支持的模型: {config.model_name}")
    
    def transcribe_audio(
        self, 
        audio_path: str, 
        config: TranscriptionConfig,
        progress_callback: Optional[Callable] = None
    ) -> TranscriptionResult:
        """转录音频文件"""
        
        # 检查模型兼容性
        compatibility = self.check_model_compatibility(config.model_name)
        if not compatibility["compatible"]:
            raise RuntimeError(f"模型不兼容: {compatibility['reason']}")
        
        # 创建转录器
        transcriber = self.create_transcriber(config)
        
        if progress_callback:
            progress_callback(5, f"使用模型: {config.model_name}")
        
        # 执行转录
        result = transcriber.transcribe(audio_path, progress_callback)
        
        # 中文后处理
        if config.language == "zh" and self.chinese_processor and config.chinese_settings:
            if progress_callback:
                progress_callback(90, "中文文本后处理...")
            
            processed_segments = []
            for segment in result.segments:
                processed_text = self.chinese_processor.process_text(segment.text)
                processed_segments.append(TranscriptionSegment(
                    start=segment.start,
                    end=segment.end,
                    text=processed_text,
                    confidence=segment.confidence
                ))
            
            result.segments = processed_segments
            result.full_text = self.chinese_processor.process_text(result.full_text)
            result.chinese_processed = True
        
        if progress_callback:
            progress_callback(100, "转录完成")
        
        return result
    
    def export_subtitles(self, result: TranscriptionResult, output_dir: str, formats: List[str]) -> Dict[str, str]:
        """导出字幕文件"""
        output_files = {}
        
        for format_type in formats:
            if format_type == "srt":
                output_files["srt"] = self._export_srt(result, output_dir)
            elif format_type == "vtt":
                output_files["vtt"] = self._export_vtt(result, output_dir)
            elif format_type == "txt":
                output_files["txt"] = self._export_txt(result, output_dir)
        
        return output_files
    
    def _export_srt(self, result: TranscriptionResult, output_dir: str) -> str:
        """导出SRT格式"""
        output_path = os.path.join(output_dir, "subtitles.srt")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            for i, segment in enumerate(result.segments, 1):
                start_time = self._format_srt_time(segment.start)
                end_time = self._format_srt_time(segment.end)
                
                f.write(f"{i}\n")
                f.write(f"{start_time} --> {end_time}\n")
                f.write(f"{segment.text}\n\n")
        
        return output_path
    
    def _export_vtt(self, result: TranscriptionResult, output_dir: str) -> str:
        """导出VTT格式"""
        output_path = os.path.join(output_dir, "subtitles.vtt")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("WEBVTT\n\n")
            
            for segment in result.segments:
                start_time = self._format_vtt_time(segment.start)
                end_time = self._format_vtt_time(segment.end)
                
                f.write(f"{start_time} --> {end_time}\n")
                f.write(f"{segment.text}\n\n")
        
        return output_path
    
    def _export_txt(self, result: TranscriptionResult, output_dir: str) -> str:
        """导出纯文本格式"""
        output_path = os.path.join(output_dir, "transcript.txt")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(result.full_text)
        
        return output_path
    
    def _format_srt_time(self, seconds: float) -> str:
        """格式化SRT时间"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millisecs = int((seconds - int(seconds)) * 1000)
        
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millisecs:03d}"
    
    def _format_vtt_time(self, seconds: float) -> str:
        """格式化VTT时间"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millisecs = int((seconds - int(seconds)) * 1000)
        
        return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millisecs:03d}"

# 工具函数
def extract_audio_from_video(video_path: str, output_path: str, sample_rate: int = 16000) -> bool:
    """从视频提取音频"""
    try:
        cmd = [
            "ffmpeg", "-i", video_path,
            "-acodec", "pcm_s16le",
            "-ar", str(sample_rate),
            "-ac", "1",
            "-y", output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.returncode == 0
    
    except Exception as e:
        logging.error(f"音频提取失败: {e}")
        return False

def main():
    """测试主函数"""
    # 配置日志
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # 创建转录器
    transcriber = MultiModelTranscriber()
    
    # 检测GPU
    gpu_info = transcriber.gpu_info
    print("GPU信息:")
    for key, value in gpu_info.items():
        print(f"  {key}: {value}")
    
    # 获取可用模型
    models = transcriber.get_available_models()
    print("\n可用模型:")
    for model in models:
        print(f"  {model['display_name']}: {model['description']}")

if __name__ == "__main__":
    main()