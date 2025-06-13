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

      // Update upload progress
      setUploadingFiles(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, progress: 50, status: 'uploading' }
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
    <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <CloudUpload className="h-4 w-4 text-white" />
          </div>
          视频文件上传
        </CardTitle>
        <p className="text-gray-600">支持中文电视剧、电影、综艺等各类视频格式</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragActive 
              ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-blue-50 scale-105' 
              : 'border-gray-300 hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50 hover:scale-105'
          }`}
        >
          <input {...getInputProps()} />
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mb-6">
            <CloudUpload className="text-purple-600" size={36} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {isDragActive ? "松开鼠标完成上传" : "拖拽视频文件到此处"}
          </h3>
          <p className="text-lg text-gray-600 mb-6">或点击此区域选择文件</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-md mx-auto">
            <div className="bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200">
              <span className="text-sm font-medium text-gray-700">MP4</span>
            </div>
            <div className="bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200">
              <span className="text-sm font-medium text-gray-700">MKV</span>
            </div>
            <div className="bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200">
              <span className="text-sm font-medium text-gray-700">AVI</span>
            </div>
            <div className="bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200">
              <span className="text-sm font-medium text-gray-700">MOV</span>
            </div>
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 px-3 py-2 rounded-lg border border-purple-200">
              <span className="text-sm font-bold text-purple-700">4K/8K</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Info size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-900">上传说明</p>
                <p className="text-sm text-blue-700">最大文件: 10GB | 推荐: 1080p-4K视频</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (input) input.click();
              }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus size={16} className="mr-2" />
              选择文件
            </Button>
          </div>
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
