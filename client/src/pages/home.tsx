import { useState } from "react";
import { FileUploadZone } from "@/components/file-upload-zone";
import { ProcessingQueue } from "@/components/processing-queue";
import { RealtimeResults } from "@/components/realtime-results";
import { ChineseSettings } from "@/components/chinese-settings";
import { PerformanceMonitor } from "@/components/performance-monitor";
import { SystemStatus } from "@/components/system-status";
import { UsageExamples } from "@/components/usage-examples";
import { Settings, Video, Cpu, Zap, Monitor, Play, Upload, Download, Gauge, Info, Activity } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Glass morphism header */}
      <header className="backdrop-blur-xl bg-white/10 border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
                <Video className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  AI 视频转录系统
                </h1>
                <p className="text-cyan-200 font-medium tracking-wide">RTX 3060 Ti • 专业级中文识别</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <SystemStatus />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/30"
              >
                <Settings className="text-white" size={18} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
                专业级中文视频转录
              </h2>
              <p className="text-cyan-200 text-lg max-w-2xl mx-auto leading-relaxed">
                基于RTX 3060 Ti GPU加速，支持Whisper、FiredASR等多种AI模型，实现95%+准确率的中文语音识别
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">智能上传</h3>
                <p className="text-cyan-200 text-sm">支持MP4/MKV/AVI格式，最大10GB，4K分辨率</p>
              </div>
              
              <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">TensorRT加速</h3>
                <p className="text-cyan-200 text-sm">GPU加速推理，速度提升3-5倍，实时转录</p>
              </div>
              
              <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">多格式导出</h3>
                <p className="text-cyan-200 text-sm">SRT、VTT、TXT字幕格式，完美兼容</p>
              </div>
            </div>
            
            <div className="text-center">
              <Button className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 text-lg">
                <Play className="w-5 h-5 mr-3" />
                开始AI转录
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Upload and Processing Area */}
          <div className="xl:col-span-3 space-y-6">
            {/* Model Selection Panel */}
            <Card className="border-0 shadow-2xl backdrop-blur-xl bg-white/10 border border-white/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl text-white">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Cpu className="h-5 w-5 text-white" />
                  </div>
                  AI模型配置
                </CardTitle>
                <CardDescription className="text-base text-cyan-200">
                  针对RTX 3060 Ti优化的专业转录模型，支持中文电视剧音频识别
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label htmlFor="model-select" className="text-base font-semibold text-white">AI转录模型</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger id="model-select" className="h-12 bg-white/10 border-white/30 text-white">
                        <SelectValue placeholder="选择最适合的AI模型" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        {AVAILABLE_MODELS.map((model) => (
                          <SelectItem key={model.name} value={model.name} className="text-white hover:bg-gray-800">
                            <div className="flex items-center gap-3 py-1">
                              <span className="font-medium">{model.displayName}</span>
                              {model.tensorrtSupport && (
                                <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                  TensorRT
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {currentModel && (
                      <div className="p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30">
                        <p className="font-medium text-white mb-2">{currentModel.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-cyan-200">显存需求:</span>
                          <span className="font-semibold text-cyan-400">{currentModel.gpuMemoryRequired}MB</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl border border-white/20">
                      <div>
                        <Label htmlFor="tensorrt-switch" className="text-base font-medium text-white">
                          TensorRT 加速
                        </Label>
                        <p className="text-sm text-cyan-200">GPU推理优化，提升3-5倍速度</p>
                      </div>
                      <Switch
                        id="tensorrt-switch"
                        checked={tensorrtEnabled && currentModel?.tensorrtSupport}
                        onCheckedChange={setTensorrtEnabled}
                        disabled={!currentModel?.tensorrtSupport}
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-400 data-[state=checked]:to-blue-500"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl border border-white/20">
                      <div>
                        <Label htmlFor="gpu-opt-switch" className="text-base font-medium text-white">
                          RTX 3060 Ti 专项优化
                        </Label>
                        <p className="text-sm text-cyan-200">针对8GB显存优化配置</p>
                      </div>
                      <Switch
                        id="gpu-opt-switch"
                        checked={gpuOptimization}
                        onCheckedChange={setGpuOptimization}
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-400 data-[state=checked]:to-blue-500"
                      />
                    </div>
                    
                    {currentModel && (
                      <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                          <Zap className="h-4 w-4" />
                          <span className="font-semibold">性能预估</span>
                        </div>
                        <div className="space-y-1 text-sm text-green-300">
                          <div className="flex justify-between">
                            <span>处理速度:</span>
                            <span className="font-medium text-white">
                              {currentModel.name.includes('large') ? '慢但精确' : 
                               currentModel.name.includes('medium') ? '平衡模式' : '快速处理'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>中文准确率:</span>
                            <span className="font-medium text-white">
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
            <Card className="border-0 shadow-2xl backdrop-blur-xl bg-white/10 border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg text-white">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                    <Monitor className="h-4 w-4 text-white" />
                  </div>
                  系统监控
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PerformanceMonitor />
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-2xl backdrop-blur-xl bg-white/10 border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg text-white">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Settings className="h-4 w-4 text-white" />
                  </div>
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

            <Card className="border-0 shadow-2xl backdrop-blur-xl bg-white/10 border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg text-white">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Info className="h-4 w-4 text-white" />
                  </div>
                  系统状态
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SystemStatus detailed />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
