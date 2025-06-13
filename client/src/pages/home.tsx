import { useState } from "react";
import { FileUploadZone } from "@/components/file-upload-zone";
import { ProcessingQueue } from "@/components/processing-queue";
import { RealtimeResults } from "@/components/realtime-results";
import { ChineseSettings } from "@/components/chinese-settings";
import { PerformanceMonitor } from "@/components/performance-monitor";
import { SystemStatus } from "@/components/system-status";
import { Settings, Video, Cpu, Zap, Monitor, Upload, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChineseSettings as ChineseSettingsType, ModelConfig } from "@shared/schema";
import { AVAILABLE_MODELS } from "@shared/schema";

export default function Home() {
  const [chineseSettings, setChineseSettings] = useState<ChineseSettingsType>({
    variant: 'simplified',
    multiPronunciation: true,
    smartPunctuation: true,
    segmentationMethod: 'jieba'
  });

  const [selectedModel, setSelectedModel] = useState("whisper-large-v3");
  const [tensorrtEnabled, setTensorrtEnabled] = useState(true);
  const [gpuOptimization, setGpuOptimization] = useState(true);

  const getModelInfo = (modelName: string): ModelConfig | undefined => {
    return AVAILABLE_MODELS.find(model => model.name === modelName);
  };

  const currentModel = getModelInfo(selectedModel);

  return (
    <div className="min-h-screen gradient-animation">
      {/* 现代化导航栏 */}
      <header className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Video className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AI 视频转录</h1>
                <p className="text-xs text-blue-200">RTX 3060 Ti 专业版</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <SystemStatus />
              <Button variant="ghost" size="sm" className="glass-light text-white hover:bg-white/20">
                <Settings size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧 - 上传和设置 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 文件上传区域 */}
            <FileUploadZone 
              selectedModel={selectedModel}
              tensorrtEnabled={tensorrtEnabled}
              onUploadComplete={(jobId) => {
                console.log('上传完成，任务ID:', jobId);
              }}
            />
            
            {/* 模型选择和设置 */}
            <Card className="glass border-white/20">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  转录设置
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-white font-medium">AI 模型选择</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="glass-light border-white/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass border-white/20">
                        {AVAILABLE_MODELS.map((model) => (
                          <SelectItem key={model.name} value={model.name} className="text-white">
                            <div className="flex flex-col">
                              <span className="font-medium">{model.displayName}</span>
                              <span className="text-xs text-muted-foreground">{model.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {currentModel && (
                      <div className="text-xs text-blue-200 space-y-1">
                        <p>显存需求: {currentModel.gpuMemoryRequired}MB</p>
                        <p>TensorRT: {currentModel.tensorrtSupport ? '支持' : '不支持'}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-white font-medium">TensorRT 加速</Label>
                      <Switch 
                        checked={tensorrtEnabled} 
                        onCheckedChange={setTensorrtEnabled}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white font-medium">GPU 优化</Label>
                      <Switch 
                        checked={gpuOptimization} 
                        onCheckedChange={setGpuOptimization}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 右侧 - 系统状态和队列 */}
          <div className="space-y-6">
            {/* 系统状态 */}
            <PerformanceMonitor />
            
            {/* 处理队列 */}
            <ProcessingQueue />
          </div>
        </div>
        
        {/* 底部功能区域 */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 实时结果 */}
          <RealtimeResults />
          
          {/* 中文处理设置 */}
          <ChineseSettings 
            settings={chineseSettings}
            onSettingsChange={setChineseSettings}
          />
        </div>
        
        {/* 特性展示 */}
        <div className="mt-12">
          <div className="glass rounded-3xl p-8 border-white/20">
            <h3 className="text-2xl font-bold text-white text-center mb-8">核心特性</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-light rounded-2xl p-6 border-white/20 hover:bg-white/10 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-white font-bold text-lg mb-2">智能上传</h4>
                <p className="text-blue-200 text-sm">支持MP4/MKV/AVI等主流格式，最大10GB文件，4K分辨率处理</p>
              </div>
              
              <div className="glass-light rounded-2xl p-6 border-white/20 hover:bg-white/10 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-white font-bold text-lg mb-2">TensorRT加速</h4>
                <p className="text-blue-200 text-sm">RTX 3060 Ti GPU加速推理，转录速度提升3-5倍</p>
              </div>
              
              <div className="glass-light rounded-2xl p-6 border-white/20 hover:bg-white/10 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-white font-bold text-lg mb-2">多格式导出</h4>
                <p className="text-blue-200 text-sm">SRT、VTT、TXT字幕格式，完美兼容各种播放器</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}