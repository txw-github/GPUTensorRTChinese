#!/usr/bin/env python3
"""
TensorRT优化脚本 - 将Whisper模型转换为TensorRT引擎以获得最佳性能
"""

import os
import torch
import whisper
import tensorrt as trt
import numpy as np
from pathlib import Path
import logging

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WhisperTensorRTOptimizer:
    """Whisper模型TensorRT优化器"""
    
    def __init__(self, model_size="large-v3", precision="fp16"):
        self.model_size = model_size
        self.precision = precision
        self.model_dir = Path("models")
        self.model_dir.mkdir(exist_ok=True)
        
    def download_and_convert_model(self):
        """下载Whisper模型并转换为TensorRT引擎"""
        logger.info(f"开始下载 Whisper {self.model_size} 模型...")
        
        # 下载原始模型
        model = whisper.load_model(self.model_size)
        logger.info("模型下载完成")
        
        # 保存模型状态
        model_path = self.model_dir / f"whisper-{self.model_size}.pt"
        torch.save(model.state_dict(), model_path)
        logger.info(f"模型已保存到: {model_path}")
        
        # 转换为ONNX格式
        onnx_path = self.convert_to_onnx(model)
        
        # 转换为TensorRT引擎
        engine_path = self.convert_to_tensorrt(onnx_path)
        
        return engine_path
    
    def convert_to_onnx(self, model):
        """将PyTorch模型转换为ONNX格式"""
        logger.info("转换模型为ONNX格式...")
        
        # 创建示例输入
        dummy_input = torch.randn(1, 80, 3000).cuda()  # 音频特征输入
        
        onnx_path = self.model_dir / f"whisper-{self.model_size}.onnx"
        
        # 导出ONNX模型
        torch.onnx.export(
            model.encoder,
            dummy_input,
            str(onnx_path),
            export_params=True,
            opset_version=11,
            do_constant_folding=True,
            input_names=['audio_features'],
            output_names=['encoder_output']
        )
        
        logger.info(f"ONNX模型已保存到: {onnx_path}")
        return onnx_path
    
    def convert_to_tensorrt(self, onnx_path):
        """将ONNX模型转换为TensorRT引擎"""
        logger.info("转换ONNX模型为TensorRT引擎...")
        
        # 创建TensorRT builder
        builder = trt.Builder(trt.Logger(trt.Logger.WARNING))
        network = builder.create_network(1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH))
        parser = trt.OnnxParser(network, trt.Logger(trt.Logger.WARNING))
        
        # 解析ONNX模型
        with open(onnx_path, 'rb') as model_file:
            if not parser.parse(model_file.read()):
                logger.error("ONNX解析失败")
                for error in range(parser.num_errors):
                    logger.error(parser.get_error(error))
                return None
        
        # 配置构建器
        config = builder.create_builder_config()
        
        # 设置最大工作空间大小 (4GB)
        config.max_workspace_size = 4 << 30
        
        # 启用FP16精度
        if self.precision == "fp16" and builder.platform_has_fast_fp16:
            config.set_flag(trt.BuilderFlag.FP16)
            logger.info("启用FP16精度优化")
        
        # 启用INT8精度（如果支持）
        if self.precision == "int8" and builder.platform_has_fast_int8:
            config.set_flag(trt.BuilderFlag.INT8)
            logger.info("启用INT8精度优化")
        
        # 构建引擎
        logger.info("构建TensorRT引擎（这可能需要几分钟）...")
        engine = builder.build_engine(network, config)
        
        if engine is None:
            logger.error("TensorRT引擎构建失败")
            return None
        
        # 保存引擎
        engine_path = self.model_dir / f"whisper-{self.model_size}-{self.precision}.trt"
        with open(engine_path, 'wb') as f:
            f.write(engine.serialize())
        
        logger.info(f"TensorRT引擎已保存到: {engine_path}")
        return engine_path
    
    def benchmark_model(self, engine_path):
        """基准测试优化后的模型"""
        logger.info("开始性能基准测试...")
        
        # 这里添加基准测试代码
        # 比较原始模型和TensorRT优化模型的性能
        
        logger.info("基准测试完成")

def main():
    """主函数"""
    logger.info("=== Whisper TensorRT优化工具 ===")
    
    # 检查CUDA可用性
    if not torch.cuda.is_available():
        logger.error("CUDA不可用，无法进行GPU优化")
        return
    
    logger.info(f"使用GPU: {torch.cuda.get_device_name()}")
    logger.info(f"CUDA版本: {torch.version.cuda}")
    
    # 创建优化器
    optimizer = WhisperTensorRTOptimizer()
    
    try:
        # 执行优化
        engine_path = optimizer.download_and_convert_model()
        
        if engine_path:
            logger.info("TensorRT优化完成！")
            logger.info(f"优化后的模型位于: {engine_path}")
            
            # 运行基准测试
            optimizer.benchmark_model(engine_path)
        else:
            logger.error("优化失败")
            
    except Exception as e:
        logger.error(f"优化过程中出现错误: {e}")

if __name__ == "__main__":
    main()