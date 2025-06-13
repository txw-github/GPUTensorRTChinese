import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Activity, Cpu, Zap, HardDrive, Thermometer, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import type { SystemMetrics } from "@shared/schema";

export function PerformanceMonitor() {
  const { data: metrics, isLoading } = useQuery<SystemMetrics>({
    queryKey: ['/api/system/metrics'],
    refetchInterval: 2000,
  });

  if (isLoading || !metrics) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-4 w-32"></div>
        <div className="skeleton h-6 w-full"></div>
        <div className="skeleton h-6 w-full"></div>
        <div className="skeleton h-6 w-full"></div>
      </div>
    );
  }

  const gpuUsageColor = metrics.gpuUtilization && metrics.gpuUtilization > 80 ? 'bg-red-500' : 
                       metrics.gpuUtilization && metrics.gpuUtilization > 60 ? 'bg-yellow-500' : 'bg-green-500';
  
  const vramUsagePercent = metrics.vramUsage ? (metrics.vramUsage / 8192) * 100 : 0; // RTX 3060 Ti has 8GB VRAM
  const vramColor = vramUsagePercent > 85 ? 'bg-red-500' : 
                   vramUsagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500';

  const tempColor = (metrics.temperature || 45) > 75 ? 'bg-red-500' :
                   (metrics.temperature || 45) > 65 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="space-y-6">
      {/* RTX 3060 Ti Status Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900">RTX 3060 Ti 8GB</h3>
              <p className="text-sm text-green-700">专业级AI加速卡</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {metrics.tensorrtStatus ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                <CheckCircle className="w-3 h-3 mr-1" />
                TensorRT
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                <AlertTriangle className="w-3 h-3 mr-1" />
                优化中
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                <Cpu className="h-3 w-3 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">GPU使用率</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{metrics.gpuUtilization || 0}%</span>
          </div>
          <div className="relative">
            <Progress 
              value={metrics.gpuUtilization || 0} 
              className="h-3 bg-gray-200"
            />
            <div className="absolute inset-0 h-3 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${gpuUsageColor}`}
                style={{ width: `${metrics.gpuUtilization || 0}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>空闲</span>
            <span>中等</span>
            <span>高负载</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                <HardDrive className="h-3 w-3 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">显存占用</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{metrics.vramUsage || 0}MB / 8192MB</span>
          </div>
          <div className="relative">
            <Progress 
              value={vramUsagePercent} 
              className="h-3 bg-gray-200"
            />
            <div className="absolute inset-0 h-3 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${vramColor}`}
                style={{ width: `${vramUsagePercent}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0GB</span>
            <span>4GB</span>
            <span>8GB</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                <Thermometer className="h-3 w-3 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">GPU温度</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{metrics.temperature || 45}°C</span>
          </div>
          <div className="relative">
            <Progress 
              value={(metrics.temperature || 45) / 90 * 100} 
              className="h-3 bg-gray-200"
            />
            <div className="absolute inset-0 h-3 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${tempColor}`}
                style={{ width: `${(metrics.temperature || 45) / 90 * 100}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>20°C</span>
            <span>65°C</span>
            <span>90°C</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">活跃任务</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{metrics.activeJobs || 0}</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">运行时间</span>
              </div>
              <span className="text-2xl font-bold text-green-600">
                {Math.floor((Date.now() - (metrics.timestamp ? new Date(metrics.timestamp).getTime() : Date.now())) / 60000)}m
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">性能优化建议</h4>
        <div className="space-y-1 text-sm text-blue-800">
          {vramUsagePercent > 85 && (
            <p>• 显存使用率过高，建议关闭其他GPU应用程序</p>
          )}
          {(metrics.temperature || 45) > 75 && (
            <p>• GPU温度较高，请检查机箱散热</p>
          )}
          {(metrics.gpuUtilization || 0) < 20 && (metrics.activeJobs || 0) > 0 && (
            <p>• GPU使用率较低，可以尝试启用TensorRT加速</p>
          )}
          {(metrics.activeJobs || 0) === 0 && (
            <p>• 系统空闲中，可以开始新的转录任务</p>
          )}
        </div>
      </div>
    </div>
  );
}
