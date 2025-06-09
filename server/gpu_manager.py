"""
GPU Resource Manager for Video Transcription
Monitors GPU utilization, memory usage, and manages transcription queue
"""

import os
import time
import threading
import subprocess
import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
import psutil
import GPUtil
from queue import Queue, PriorityQueue
import logging

logger = logging.getLogger(__name__)


@dataclass
class GPUStats:
    gpu_id: int
    name: str
    utilization: float  # 0-100
    memory_used: float  # MB
    memory_total: float  # MB
    memory_free: float  # MB
    temperature: float  # Celsius
    power_draw: float   # Watts
    driver_version: str


@dataclass
class SystemStats:
    gpus: List[GPUStats]
    cpu_usage: float
    ram_usage: float
    ram_total: float
    active_jobs: int
    queue_length: int
    tensorrt_available: bool
    cuda_version: str


class GPUMonitor:
    """Monitor GPU statistics and system resources"""
    
    def __init__(self, update_interval: float = 2.0):
        self.update_interval = update_interval
        self.is_monitoring = False
        self.stats_history: List[SystemStats] = []
        self.max_history = 1000
        self.current_stats: Optional[SystemStats] = None
        self._monitor_thread: Optional[threading.Thread] = None
        
    def start_monitoring(self):
        """Start continuous GPU monitoring"""
        if self.is_monitoring:
            return
            
        self.is_monitoring = True
        self._monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self._monitor_thread.start()
        logger.info("GPU monitoring started")
    
    def stop_monitoring(self):
        """Stop GPU monitoring"""
        self.is_monitoring = False
        if self._monitor_thread:
            self._monitor_thread.join(timeout=5.0)
        logger.info("GPU monitoring stopped")
    
    def _monitor_loop(self):
        """Main monitoring loop"""
        while self.is_monitoring:
            try:
                stats = self._collect_stats()
                self.current_stats = stats
                
                # Add to history
                self.stats_history.append(stats)
                if len(self.stats_history) > self.max_history:
                    self.stats_history.pop(0)
                
                time.sleep(self.update_interval)
                
            except Exception as e:
                logger.error(f"Error in GPU monitoring: {e}")
                time.sleep(self.update_interval)
    
    def _collect_stats(self) -> SystemStats:
        """Collect current system and GPU statistics"""
        # Get GPU stats
        gpu_stats = []
        try:
            gpus = GPUtil.getGPUs()
            for gpu in gpus:
                gpu_stat = GPUStats(
                    gpu_id=gpu.id,
                    name=gpu.name,
                    utilization=gpu.load * 100,
                    memory_used=gpu.memoryUsed,
                    memory_total=gpu.memoryTotal,
                    memory_free=gpu.memoryFree,
                    temperature=gpu.temperature,
                    power_draw=getattr(gpu, 'powerDraw', 0),
                    driver_version=getattr(gpu, 'driver', 'Unknown')
                )
                gpu_stats.append(gpu_stat)
        except Exception as e:
            logger.error(f"Error collecting GPU stats: {e}")
            # Fallback to nvidia-smi if GPUtil fails
            gpu_stats = self._get_gpu_stats_nvidia_smi()
        
        # Get system stats
        cpu_usage = psutil.cpu_percent(interval=None)
        memory = psutil.virtual_memory()
        ram_usage = memory.used / (1024**3)  # GB
        ram_total = memory.total / (1024**3)  # GB
        
        # Check CUDA and TensorRT availability
        cuda_version = self._get_cuda_version()
        tensorrt_available = self._check_tensorrt_availability()
        
        return SystemStats(
            gpus=gpu_stats,
            cpu_usage=cpu_usage,
            ram_usage=ram_usage,
            ram_total=ram_total,
            active_jobs=0,  # Will be updated by job manager
            queue_length=0,  # Will be updated by job manager
            tensorrt_available=tensorrt_available,
            cuda_version=cuda_version
        )
    
    def _get_gpu_stats_nvidia_smi(self) -> List[GPUStats]:
        """Fallback method using nvidia-smi"""
        try:
            cmd = [
                "nvidia-smi",
                "--query-gpu=index,name,utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw,driver_version",
                "--format=csv,noheader,nounits"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            if result.returncode != 0:
                return []
            
            gpu_stats = []
            for line in result.stdout.strip().split('\n'):
                if not line.strip():
                    continue
                    
                parts = [p.strip() for p in line.split(',')]
                if len(parts) >= 8:
                    try:
                        gpu_stat = GPUStats(
                            gpu_id=int(parts[0]),
                            name=parts[1],
                            utilization=float(parts[2]),
                            memory_used=float(parts[3]),
                            memory_total=float(parts[4]),
                            memory_free=float(parts[4]) - float(parts[3]),
                            temperature=float(parts[5]),
                            power_draw=float(parts[6]) if parts[6] != '[Not Supported]' else 0,
                            driver_version=parts[7]
                        )
                        gpu_stats.append(gpu_stat)
                    except (ValueError, IndexError) as e:
                        logger.error(f"Error parsing nvidia-smi output: {e}")
                        continue
            
            return gpu_stats
            
        except Exception as e:
            logger.error(f"Error running nvidia-smi: {e}")
            return []
    
    def _get_cuda_version(self) -> str:
        """Get CUDA version"""
        try:
            result = subprocess.run(
                ["nvcc", "--version"], 
                capture_output=True, text=True, timeout=5
            )
            if result.returncode == 0:
                output = result.stdout
                for line in output.split('\n'):
                    if 'release' in line:
                        # Extract version from line like "Cuda compilation tools, release 12.1, V12.1.105"
                        parts = line.split('release')
                        if len(parts) > 1:
                            version = parts[1].split(',')[0].strip()
                            return version
            return "Unknown"
        except Exception:
            return "Unknown"
    
    def _check_tensorrt_availability(self) -> bool:
        """Check if TensorRT is available"""
        try:
            import tensorrt as trt
            return True
        except ImportError:
            return False
    
    def get_current_stats(self) -> Optional[SystemStats]:
        """Get current system statistics"""
        return self.current_stats
    
    def get_stats_history(self, limit: int = 100) -> List[SystemStats]:
        """Get historical statistics"""
        return self.stats_history[-limit:]
    
    def get_best_gpu(self) -> Optional[int]:
        """Get the GPU with lowest utilization for new jobs"""
        if not self.current_stats or not self.current_stats.gpus:
            return None
        
        best_gpu = None
        lowest_utilization = float('inf')
        
        for gpu in self.current_stats.gpus:
            if gpu.utilization < lowest_utilization:
                lowest_utilization = gpu.utilization
                best_gpu = gpu.gpu_id
        
        return best_gpu


@dataclass
class TranscriptionJob:
    job_id: int
    video_path: str
    priority: int = 1  # Lower number = higher priority
    gpu_id: Optional[int] = None
    created_at: float = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = time.time()
    
    def __lt__(self, other):
        # For priority queue ordering
        return (self.priority, self.created_at) < (other.priority, other.created_at)


class GPUJobManager:
    """Manage transcription jobs across multiple GPUs"""
    
    def __init__(self, gpu_monitor: GPUMonitor, max_concurrent_jobs: int = 2):
        self.gpu_monitor = gpu_monitor
        self.max_concurrent_jobs = max_concurrent_jobs
        self.job_queue: PriorityQueue = PriorityQueue()
        self.active_jobs: Dict[int, TranscriptionJob] = {}
        self.completed_jobs: List[int] = []
        self.is_processing = False
        self._worker_thread: Optional[threading.Thread] = None
        
    def start_processing(self):
        """Start job processing"""
        if self.is_processing:
            return
            
        self.is_processing = True
        self._worker_thread = threading.Thread(target=self._process_jobs, daemon=True)
        self._worker_thread.start()
        logger.info("GPU job manager started")
    
    def stop_processing(self):
        """Stop job processing"""
        self.is_processing = False
        if self._worker_thread:
            self._worker_thread.join(timeout=5.0)
        logger.info("GPU job manager stopped")
    
    def add_job(self, job: TranscriptionJob) -> bool:
        """Add a job to the processing queue"""
        try:
            self.job_queue.put(job)
            logger.info(f"Added job {job.job_id} to queue")
            return True
        except Exception as e:
            logger.error(f"Error adding job to queue: {e}")
            return False
    
    def get_queue_status(self) -> Dict:
        """Get current queue status"""
        return {
            "queue_length": self.job_queue.qsize(),
            "active_jobs": len(self.active_jobs),
            "completed_jobs": len(self.completed_jobs),
            "max_concurrent": self.max_concurrent_jobs
        }
    
    def _process_jobs(self):
        """Main job processing loop"""
        while self.is_processing:
            try:
                # Check if we can start new jobs
                if len(self.active_jobs) < self.max_concurrent_jobs and not self.job_queue.empty():
                    try:
                        job = self.job_queue.get_nowait()
                        self._start_job(job)
                    except:
                        pass  # Queue was empty
                
                # Check for completed jobs
                self._check_completed_jobs()
                
                # Update GPU monitor with current job counts
                if self.gpu_monitor.current_stats:
                    self.gpu_monitor.current_stats.active_jobs = len(self.active_jobs)
                    self.gpu_monitor.current_stats.queue_length = self.job_queue.qsize()
                
                time.sleep(1.0)
                
            except Exception as e:
                logger.error(f"Error in job processing loop: {e}")
                time.sleep(1.0)
    
    def _start_job(self, job: TranscriptionJob):
        """Start processing a job"""
        # Assign GPU
        if job.gpu_id is None:
            job.gpu_id = self.gpu_monitor.get_best_gpu()
        
        if job.gpu_id is None:
            logger.warning(f"No GPU available for job {job.job_id}, using CPU")
        
        self.active_jobs[job.job_id] = job
        logger.info(f"Started job {job.job_id} on GPU {job.gpu_id}")
        
        # In a real implementation, you would start the transcription process here
        # For now, we'll simulate by marking it as active
    
    def _check_completed_jobs(self):
        """Check for completed jobs and clean up"""
        # In a real implementation, you would check job status
        # For simulation, we'll just move jobs to completed after some time
        current_time = time.time()
        completed_job_ids = []
        
        for job_id, job in self.active_jobs.items():
            # Simulate job completion after 60 seconds
            if current_time - job.created_at > 60:
                completed_job_ids.append(job_id)
        
        for job_id in completed_job_ids:
            self.completed_jobs.append(job_id)
            del self.active_jobs[job_id]
            logger.info(f"Job {job_id} completed")
    
    def cancel_job(self, job_id: int) -> bool:
        """Cancel a job"""
        if job_id in self.active_jobs:
            del self.active_jobs[job_id]
            logger.info(f"Cancelled active job {job_id}")
            return True
        
        # Try to remove from queue (more complex, would need custom queue implementation)
        logger.warning(f"Cannot cancel job {job_id} - not found or not implemented for queued jobs")
        return False


class GPUResourceManager:
    """Main GPU resource management class"""
    
    def __init__(self, max_concurrent_jobs: int = 2, monitoring_interval: float = 2.0):
        self.monitor = GPUMonitor(monitoring_interval)
        self.job_manager = GPUJobManager(self.monitor, max_concurrent_jobs)
        
    def start(self):
        """Start GPU monitoring and job processing"""
        self.monitor.start_monitoring()
        self.job_manager.start_processing()
        logger.info("GPU Resource Manager started")
    
    def stop(self):
        """Stop all GPU management processes"""
        self.job_manager.stop_processing()
        self.monitor.stop_monitoring()
        logger.info("GPU Resource Manager stopped")
    
    def get_system_status(self) -> Dict:
        """Get comprehensive system status"""
        stats = self.monitor.get_current_stats()
        queue_status = self.job_manager.get_queue_status()
        
        if not stats:
            return {
                "error": "GPU monitoring not available",
                "gpus": [],
                "queue": queue_status
            }
        
        return {
            "gpus": [asdict(gpu) for gpu in stats.gpus],
            "cpu_usage": stats.cpu_usage,
            "ram_usage": stats.ram_usage,
            "ram_total": stats.ram_total,
            "cuda_version": stats.cuda_version,
            "tensorrt_available": stats.tensorrt_available,
            "queue": queue_status,
            "timestamp": time.time()
        }
    
    def add_transcription_job(self, job_id: int, video_path: str, priority: int = 1) -> bool:
        """Add a new transcription job"""
        job = TranscriptionJob(
            job_id=job_id,
            video_path=video_path,
            priority=priority
        )
        return self.job_manager.add_job(job)
    
    def cancel_job(self, job_id: int) -> bool:
        """Cancel a transcription job"""
        return self.job_manager.cancel_job(job_id)
    
    def get_optimal_settings(self) -> Dict:
        """Get optimal transcription settings based on current GPU status"""
        stats = self.monitor.get_current_stats()
        
        if not stats or not stats.gpus:
            return {
                "use_gpu": False,
                "use_tensorrt": False,
                "batch_size": 1,
                "precision": "fp32"
            }
        
        best_gpu = self.monitor.get_best_gpu()
        gpu_stats = next((gpu for gpu in stats.gpus if gpu.gpu_id == best_gpu), None)
        
        if not gpu_stats:
            return {
                "use_gpu": False,
                "use_tensorrt": False,
                "batch_size": 1,
                "precision": "fp32"
            }
        
        # Determine optimal settings based on GPU capabilities
        use_tensorrt = stats.tensorrt_available and gpu_stats.memory_free > 4000  # 4GB free
        precision = "fp16" if gpu_stats.memory_free > 6000 else "fp32"
        batch_size = min(4, max(1, int(gpu_stats.memory_free / 2000)))  # Rough estimate
        
        return {
            "use_gpu": True,
            "use_tensorrt": use_tensorrt,
            "batch_size": batch_size,
            "precision": precision,
            "gpu_id": best_gpu,
            "memory_available": gpu_stats.memory_free
        }


# Global instance
gpu_manager = GPUResourceManager()

# Auto-start on import
try:
    gpu_manager.start()
except Exception as e:
    logger.error(f"Failed to start GPU manager: {e}")


if __name__ == "__main__":
    # Test GPU monitoring
    import signal
    import sys
    
    def signal_handler(sig, frame):
        print("\nStopping GPU manager...")
        gpu_manager.stop()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    print("Starting GPU Resource Manager...")
    gpu_manager.start()
    
    try:
        while True:
            status = gpu_manager.get_system_status()
            print(f"\nSystem Status: {json.dumps(status, indent=2)}")
            time.sleep(5)
    except KeyboardInterrupt:
        pass
    finally:
        gpu_manager.stop()
