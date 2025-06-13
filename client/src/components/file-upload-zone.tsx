import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileVideo, X, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';

interface FileUploadZoneProps {
  onUploadComplete?: (jobId: number) => void;
  selectedModel?: string;
  tensorrtEnabled?: boolean;
}

export function FileUploadZone({ onUploadComplete, selectedModel = 'whisper-large-v3', tensorrtEnabled = true }: FileUploadZoneProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', selectedModel);
      formData.append('language', 'zh');
      formData.append('tensorrt_enabled', tensorrtEnabled.toString());
      formData.append('gpu_optimization', 'true');

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      const response = await apiRequest('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      return response;
    },
    onSuccess: (data) => {
      console.log('Upload successful:', data);
      if (onUploadComplete && data.job_id) {
        onUploadComplete(data.job_id);
      }
      setTimeout(() => setUploadProgress(0), 1000);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      setUploadProgress(0);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setUploadProgress(0);
      uploadMutation.mutate(file);
    }
  }, [uploadMutation, selectedModel, tensorrtEnabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.m4v', '.webm'],
      'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg']
    },
    maxSize: 10 * 1024 * 1024 * 1024, // 10GB
    multiple: false
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full upload-zone glass border-white/20">
      <CardContent className="p-8">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-500
            ${isDragActive 
              ? 'border-blue-400 bg-blue-500/10 scale-[1.02] shadow-2xl' 
              : 'border-white/30 hover:border-blue-400/70 hover:bg-white/5'
            }
            ${uploadMutation.isPending ? 'pointer-events-none opacity-75' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {!uploadedFile ? (
            <>
              <div className="mx-auto w-28 h-28 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
                <Upload className="w-14 h-14 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {isDragActive ? '释放开始上传' : '上传视频文件'}
              </h3>
              <p className="text-blue-200 text-lg mb-6">
                拖拽文件到此处或点击选择 • 支持所有主流格式
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20">MP4</Badge>
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20">AVI</Badge>
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20">MKV</Badge>
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20">MOV</Badge>
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20">WMV</Badge>
              </div>
              <div className="flex items-center justify-center space-x-4 text-sm text-blue-300">
                <span>最大 10GB</span>
                <span>•</span>
                <span>支持 4K</span>
                {tensorrtEnabled && (
                  <>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Zap className="w-4 h-4" />
                      <span>TensorRT 加速</span>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FileVideo className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white text-lg">{uploadedFile.name}</p>
                  <p className="text-blue-200">
                    {formatFileSize(uploadedFile.size)}
                  </p>
                </div>
              </div>
              
              {uploadMutation.isPending && (
                <div className="space-y-3">
                  <Progress value={uploadProgress} className="w-full h-3 bg-white/20" />
                  <p className="text-blue-200 font-mono">
                    正在上传... {Math.round(uploadProgress)}%
                  </p>
                  <p className="text-xs text-blue-300">
                    使用 {selectedModel} 模型 • GPU 加速处理
                  </p>
                </div>
              )}
              
              {uploadMutation.isSuccess && (
                <div className="flex items-center justify-center space-x-3 text-green-400">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-bold text-lg">上传成功！开始转录...</span>
                </div>
              )}
              
              {uploadMutation.isError && (
                <div className="flex items-center justify-center space-x-3 text-red-400">
                  <AlertCircle className="w-6 h-6" />
                  <span className="font-medium">上传失败，请检查文件并重试</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {uploadedFile && !uploadMutation.isPending && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setUploadedFile(null);
                setUploadProgress(0);
                uploadMutation.reset();
              }}
              className="glass-light text-white border-white/30 hover:bg-white/20"
            >
              <X className="w-4 h-4 mr-2" />
              重新选择文件
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}