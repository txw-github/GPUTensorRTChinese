import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Video, 
  Pause, 
  Play, 
  X, 
  Download, 
  FileText, 
  FileCode, 
  File, 
  Clock,
  CheckCircle,
  Cpu
} from "lucide-react";
import type { TranscriptionJob } from "@shared/schema";

export function ProcessingQueue() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery<TranscriptionJob[]>({
    queryKey: ['/api/jobs'],
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  const startJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await apiRequest('POST', `/api/jobs/${jobId}/start`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: "Processing Started",
        description: "The transcription job has been started.",
      });
    },
    onError: () => {
      toast({
        title: "Start Failed",
        description: "Failed to start the transcription job.",
        variant: "destructive",
      });
    }
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      await apiRequest('DELETE', `/api/jobs/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: "Job Deleted",
        description: "The transcription job has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the transcription job.",
        variant: "destructive",
      });
    }
  });

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (job: TranscriptionJob) => {
    switch (job.status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-500">
            <Clock size={12} className="mr-1" />
            Queued
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-600">
            <Cpu size={12} className="mr-1" />
            Processing
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-600">
            <CheckCircle size={12} className="mr-1" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <X size={12} className="mr-1" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  const downloadFile = async (jobId: number, format: string, filename: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/download/${format}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the file.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Processing Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Processing Queue</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              <Pause size={12} className="mr-1" />
              Pause All
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Play size={12} className="mr-1" />
              Start Batch
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Video size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No videos in queue</p>
            <p className="text-sm">Upload videos to start transcription</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`border rounded-lg p-4 ${
                  job.status === 'processing' 
                    ? 'bg-blue-50 border-blue-200' 
                    : job.status === 'completed'
                    ? 'bg-green-50 border-green-200'
                    : job.status === 'failed'
                    ? 'bg-red-50 border-red-200'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      job.status === 'completed' ? 'bg-green-500' :
                      job.status === 'processing' ? 'bg-blue-500' :
                      job.status === 'failed' ? 'bg-red-500' :
                      'bg-gray-100'
                    }`}>
                      {job.status === 'completed' ? (
                        <CheckCircle className="text-white" size={16} />
                      ) : (
                        <Video className={job.status === 'pending' ? 'text-gray-400' : 'text-white'} size={16} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{job.filename}</p>
                      <p className="text-sm text-gray-500 font-mono">
                        {formatFileSize(job.fileSize)} • {job.resolution} • {formatDuration(job.duration)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(job)}
                    {job.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startJobMutation.mutate(job.id)}
                        disabled={startJobMutation.isPending}
                      >
                        <Play size={12} />
                      </Button>
                    )}
                    {job.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadFile(job.id, 'srt', job.filename)}
                      >
                        <Download size={12} />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteJobMutation.mutate(job.id)}
                      disabled={deleteJobMutation.isPending}
                    >
                      <X size={12} />
                    </Button>
                  </div>
                </div>

                {job.status === 'processing' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Audio Extraction & Analysis</span>
                      <span className="font-mono text-blue-600">{job.progress || 0}%</span>
                    </div>
                    <Progress value={job.progress || 0} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>ETA: Calculating...</span>
                      <span className="font-mono">GPU: {job.gpuUtilization || 0}%</span>
                    </div>
                  </div>
                )}

                {job.status === 'completed' && job.outputFormats && (
                  <div className="flex space-x-2 mt-3">
                    {job.outputFormats.includes('srt') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(job.id, 'srt', job.filename)}
                      >
                        <FileText size={12} className="mr-1" />
                        SRT
                      </Button>
                    )}
                    {job.outputFormats.includes('vtt') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(job.id, 'vtt', job.filename)}
                      >
                        <FileCode size={12} className="mr-1" />
                        VTT
                      </Button>
                    )}
                    {job.outputFormats.includes('txt') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(job.id, 'txt', job.filename)}
                      >
                        <File size={12} className="mr-1" />
                        TXT
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
