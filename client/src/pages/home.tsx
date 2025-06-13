import { useState } from "react";
import { FileUploadZone } from "@/components/file-upload-zone";
import { ProcessingQueue } from "@/components/processing-queue";
import { RealtimeResults } from "@/components/realtime-results";
import { ChineseSettings } from "@/components/chinese-settings";
import { PerformanceMonitor } from "@/components/performance-monitor";
import { SystemStatus } from "@/components/system-status";
import { UsageExamples } from "@/components/usage-examples";
import { Settings, Video, Cpu, Zap, Monitor } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Video className="text-primary-foreground" size={16} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">VideoSubtitle Transcriber</h1>
                <p className="text-xs text-gray-500 font-mono">GPU-Accelerated Chinese Transcription</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <SystemStatus />
              <button className="p-2 text-gray-400 hover:text-gray-500 transition-colors">
                <Settings size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Upload and Processing Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Model Selection Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  转录模型配置
                </CardTitle>
                <CardDescription>
                  选择适合您RTX 3060 Ti显卡的最佳转录模型
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="model-select">转录模型</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger id="model-select">
                        <SelectValue placeholder="选择转录模型" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_MODELS.map((model) => (
                          <SelectItem key={model.name} value={model.name}>
                            <div className="flex items-center gap-2">
                              <span>{model.displayName}</span>
                              {model.tensorrtSupport && (
                                <Badge variant="secondary" className="text-xs">
                                  TensorRT
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {currentModel && (
                      <div className="text-sm text-gray-600">
                        <p>{currentModel.description}</p>
                        <p className="mt-1">
                          显存需求: <span className="font-medium">{currentModel.gpuMemoryRequired}MB</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="tensorrt-switch" className="text-sm font-medium">
                        TensorRT 加速
                      </Label>
                      <Switch
                        id="tensorrt-switch"
                        checked={tensorrtEnabled && currentModel?.tensorrtSupport}
                        onCheckedChange={setTensorrtEnabled}
                        disabled={!currentModel?.tensorrtSupport}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="gpu-opt-switch" className="text-sm font-medium">
                        RTX 3060 Ti 优化
                      </Label>
                      <Switch
                        id="gpu-opt-switch"
                        checked={gpuOptimization}
                        onCheckedChange={setGpuOptimization}
                      />
                    </div>
                    
                    {currentModel && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                          <Zap className="h-4 w-4" />
                          <span className="font-medium">性能预估</span>
                        </div>
                        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                          <p>处理速度: {currentModel.name.includes('large') ? '慢但准确' : currentModel.name.includes('medium') ? '平衡' : '快速'}</p>
                          <p>中文准确率: {currentModel.name.includes('fireredasr') ? '专业级' : '高'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <FileUploadZone 
              settings={chineseSettings} 
              selectedModel={selectedModel}
              tensorrtEnabled={tensorrtEnabled}
              gpuOptimization={gpuOptimization}
            />
            <ProcessingQueue />
            <RealtimeResults />
          </div>

          {/* Settings and Performance Sidebar */}
          <div className="space-y-6">
            <ChineseSettings 
              settings={chineseSettings} 
              onSettingsChange={setChineseSettings} 
            />
            <PerformanceMonitor />
            <SystemStatus detailed />
            <UsageExamples />
          </div>
        </div>
      </div>
    </div>
  );
}
