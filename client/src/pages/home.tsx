import { useState } from "react";
import { FileUploadZone } from "@/components/file-upload-zone";
import { ProcessingQueue } from "@/components/processing-queue";
import { RealtimeResults } from "@/components/realtime-results";
import { ChineseSettings } from "@/components/chinese-settings";
import { PerformanceMonitor } from "@/components/performance-monitor";
import { SystemStatus } from "@/components/system-status";
import { UsageExamples } from "@/components/usage-examples";
import { Settings, Video, Cpu, Zap, Monitor, Play, Upload, Download, Gauge } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Video className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  中文视频转录系统
                </h1>
                <p className="text-xs text-gray-600 font-medium">RTX 3060 Ti 专业版</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <SystemStatus />
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
                <Settings size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Action Bar */}
        <div className="mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">快速上传</p>
                    <p className="text-xs text-gray-600">拖拽视频文件</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Gauge className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">实时监控</p>
                    <p className="text-xs text-gray-600">GPU状态</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Download className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">多格式导出</p>
                    <p className="text-xs text-gray-600">SRT/VTT/TXT</p>
                  </div>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-9">
                <Play className="w-4 h-4 mr-2" />
                开始转录
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Upload and Processing Area */}
          <div className="xl:col-span-3 space-y-6">
            {/* Model Selection Panel */}
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Cpu className="h-4 w-4 text-white" />
                  </div>
                  AI模型配置
                </CardTitle>
                <CardDescription className="text-base">
                  针对RTX 3060 Ti优化的专业转录模型，支持中文电视剧音频识别
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label htmlFor="model-select" className="text-base font-semibold">AI转录模型</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger id="model-select" className="h-12">
                        <SelectValue placeholder="选择最适合的AI模型" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_MODELS.map((model) => (
                          <SelectItem key={model.name} value={model.name}>
                            <div className="flex items-center gap-3 py-1">
                              <span className="font-medium">{model.displayName}</span>
                              {model.tensorrtSupport && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                  TensorRT
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {currentModel && (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <p className="font-medium text-gray-900 mb-2">{currentModel.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">显存需求:</span>
                          <span className="font-semibold text-blue-600">{currentModel.gpuMemoryRequired}MB</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <Label htmlFor="tensorrt-switch" className="text-base font-medium text-gray-900">
                          TensorRT 加速
                        </Label>
                        <p className="text-sm text-gray-600">GPU推理优化，提升3-5倍速度</p>
                      </div>
                      <Switch
                        id="tensorrt-switch"
                        checked={tensorrtEnabled && currentModel?.tensorrtSupport}
                        onCheckedChange={setTensorrtEnabled}
                        disabled={!currentModel?.tensorrtSupport}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <Label htmlFor="gpu-opt-switch" className="text-base font-medium text-gray-900">
                          RTX 3060 Ti 专项优化
                        </Label>
                        <p className="text-sm text-gray-600">针对6GB显存优化配置</p>
                      </div>
                      <Switch
                        id="gpu-opt-switch"
                        checked={gpuOptimization}
                        onCheckedChange={setGpuOptimization}
                      />
                    </div>
                    
                    {currentModel && (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="flex items-center gap-2 text-green-700 mb-2">
                          <Zap className="h-4 w-4" />
                          <span className="font-semibold">性能预估</span>
                        </div>
                        <div className="space-y-1 text-sm text-green-600">
                          <div className="flex justify-between">
                            <span>处理速度:</span>
                            <span className="font-medium">
                              {currentModel.name.includes('large') ? '慢但精确' : 
                               currentModel.name.includes('medium') ? '平衡模式' : '快速处理'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>中文准确率:</span>
                            <span className="font-medium">
                              {currentModel.name.includes('fireredasr') ? '98%+ 专业级' : '95%+ 高精度'}
                            </span>
                          </div>
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

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Monitor className="h-5 w-5 text-purple-600" />
                  系统监控
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PerformanceMonitor />
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5 text-blue-600" />
                  中文处理设置
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChineseSettings 
                  settings={chineseSettings} 
                  onSettingsChange={setChineseSettings} 
                />
              </CardContent>
            </Card>

            <SystemStatus detailed />
            <UsageExamples />
          </div>
        </div>
      </div>
    </div>
  );
}
