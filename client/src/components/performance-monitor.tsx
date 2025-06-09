import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import type { SystemMetrics } from "@shared/schema";

export function PerformanceMonitor() {
  const [localMetrics, setLocalMetrics] = useState({
    gpuUtilization: 87,
    vramUsage: 6200, // in MB
    speedup: 2.4,
    accuracy: 94.2
  });

  const { data: systemMetrics } = useQuery<SystemMetrics>({
    queryKey: ['/api/system/metrics'],
    refetchInterval: 2000,
  });

  useEffect(() => {
    // Simulate real-time updates for demonstration
    const interval = setInterval(() => {
      setLocalMetrics(prev => ({
        ...prev,
        gpuUtilization: Math.floor(Math.random() * 20) + 70, // 70-90%
        vramUsage: Math.floor(Math.random() * 2000) + 5000, // 5-7GB
        speedup: (Math.random() * 1 + 2).toFixed(1), // 2.0-3.0x
        accuracy: (Math.random() * 5 + 92).toFixed(1), // 92-97%
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatVram = (mb: number) => {
    const gb = mb / 1024;
    return `${gb.toFixed(1)}/8 GB`;
  };

  const vramPercentage = (localMetrics.vramUsage / 8192) * 100; // 8GB = 8192MB

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Monitor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">GPU Utilization</span>
            <span className="text-sm font-mono text-primary">{localMetrics.gpuUtilization}%</span>
          </div>
          <Progress value={localMetrics.gpuUtilization} className="h-2" />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">VRAM Usage</span>
            <span className="text-sm font-mono text-warning-600">
              {formatVram(localMetrics.vramUsage)}
            </span>
          </div>
          <Progress 
            value={vramPercentage} 
            className="h-2"
            style={{
              '--tw-bg-yellow-500': 'hsl(43, 96%, 56%)'
            } as React.CSSProperties}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">TensorRT Acceleration</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-mono text-green-600">Active</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">2.3x speedup vs CPU-only</p>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 font-mono">{localMetrics.speedup}x</p>
              <p className="text-xs text-gray-500">Real-time Speed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 font-mono">{localMetrics.accuracy}%</p>
              <p className="text-xs text-gray-500">Accuracy Rate</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
