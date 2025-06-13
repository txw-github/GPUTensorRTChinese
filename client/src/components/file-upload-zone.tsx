import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CloudUpload, Plus, Info } from "lucide-react";
import type { ChineseSettings } from "@shared/schema";

interface FileUploadZoneProps {
  settings: ChineseSettings;
  selectedModel: string;
  tensorrtEnabled: boolean;
  gpuOptimization: boolean;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  jobId?: number;
}

export function FileUploadZone({ settings, selectedModel, tensorrtEnabled, gpuOptimization }: FileUploadZoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('settings', JSON.stringify(settings));
      formData.append('model', selectedModel);
      formData.append('tensorrtEnabled', tensorrtEnabled.toString());
      formData.append('gpuOptimization', gpuOptimization.toString());
      formData.append('outputFormats', 'srt,vtt,txt');
      formData.append('language', 'zh');

      // Simulate upload progress
      setUploadingFiles(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, progress: 50 }
            : f
        )
      );

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data, file) => {
      setUploadingFiles(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, status: 'completed', jobId: data.id, progress: 100 }
            : f
        )
      );
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded and queued for processing.`,
      });
    },
    onError: (error, file) => {
      setUploadingFiles(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, status: 'error' }
            : f
        )
      );
      toast({
        title: "Upload Failed",
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: "destructive",
      });
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      const validTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
      const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a supported video format.`,
          variant: "destructive",
        });
        return false;
      }
      
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds the 10GB limit.`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length > 0) {
      const newFiles = validFiles.map(file => ({
        file,
        progress: 0,
        status: 'uploading' as const
      }));
      
      setUploadingFiles(prev => [...prev, ...newFiles]);
      
      validFiles.forEach(file => {
        uploadMutation.mutate(file);
      });
    }
  }, [uploadMutation, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.mkv']
    },
    multiple: true
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearCompletedFiles = () => {
    setUploadingFiles(prev => prev.filter(f => f.status !== 'completed'));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Videos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 hover:border-primary hover:bg-primary/5'
          }`}
        >
          <input {...getInputProps()} />
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CloudUpload className="text-primary" size={24} />
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? "Drop video files here..." : "Drop video files here"}
          </p>
          <p className="text-sm text-gray-500 mb-4">or click to browse</p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
            <span className="bg-gray-100 px-2 py-1 rounded">MP4</span>
            <span className="bg-gray-100 px-2 py-1 rounded">AVI</span>
            <span className="bg-gray-100 px-2 py-1 rounded">MOV</span>
            <span className="bg-gray-100 px-2 py-1 rounded">MKV</span>
            <span className="bg-gray-100 px-2 py-1 rounded">Up to 4K</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Info size={16} />
            <span>Maximum file size: 10GB per video</span>
          </div>
          <Button onClick={() => document.querySelector('input[type="file"]')?.click()}>
            <Plus size={16} className="mr-2" />
            Add Files
          </Button>
        </div>

        {/* Upload Progress */}
        {uploadingFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">File Upload Progress</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearCompletedFiles}
                disabled={uploadingFiles.filter(f => f.status === 'completed').length === 0}
              >
                Clear Completed
              </Button>
            </div>
            {uploadingFiles.map((item, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{item.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(item.file.size)}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'uploading' ? 'bg-blue-100 text-blue-600' :
                    item.status === 'completed' ? 'bg-green-100 text-green-600' :
                    item.status === 'error' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {item.status === 'uploading' ? 'Uploading...' :
                     item.status === 'completed' ? 'Ready for Processing' :
                     item.status === 'error' ? 'Failed' : 'Processing'}
                  </div>
                </div>
                {(item.status === 'uploading' || item.status === 'processing') && (
                  <Progress value={item.progress} className="h-2" />
                )}
                {item.status === 'completed' && item.jobId && (
                  <p className="text-xs text-green-600 mt-1">
                    Job ID: {item.jobId} - Ready to start transcription
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
