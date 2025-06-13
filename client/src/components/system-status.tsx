import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import type { SystemMetrics } from "@shared/schema";

interface SystemStatusProps {
  detailed?: boolean;
}

export function SystemStatus({ detailed = false }: SystemStatusProps) {
  const { data: metrics, refetch, isLoading } = useQuery<SystemMetrics>({
    queryKey: ['/api/system/metrics'],
    refetchInterval: 5000,
  });

  if (!detailed) {
    // Simple status badge for header
    return (
      <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
        RTX 3060 Ti
      </Badge>
    );
  }

  const systemComponents = [
    {
      name: "CUDA Runtime",
      status: "active",
      version: "12.1"
    },
    {
      name: "TensorRT",
      status: "active",
      version: "8.6.1"
    },
    {
      name: "Chinese NLP",
      status: "active",
      version: "Ready"
    },
    {
      name: "GPU Memory",
      status: "active",
      version: "8GB Available"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {systemComponents.map((component, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                component.status === 'active' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-700">{component.name}</span>
            </div>
            <span className="text-xs font-mono text-gray-500">{component.version}</span>
          </div>
        ))}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw size={14} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
