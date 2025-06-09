import { useState } from "react";
import { FileUploadZone } from "@/components/file-upload-zone";
import { ProcessingQueue } from "@/components/processing-queue";
import { RealtimeResults } from "@/components/realtime-results";
import { ChineseSettings } from "@/components/chinese-settings";
import { PerformanceMonitor } from "@/components/performance-monitor";
import { SystemStatus } from "@/components/system-status";
import { UsageExamples } from "@/components/usage-examples";
import { Settings, Video } from "lucide-react";
import type { ChineseSettings as ChineseSettingsType } from "@shared/schema";

export default function Home() {
  const [chineseSettings, setChineseSettings] = useState<ChineseSettingsType>({
    variant: 'simplified',
    multiPronunciation: true,
    smartPunctuation: true,
    segmentationMethod: 'jieba'
  });

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
            <FileUploadZone settings={chineseSettings} />
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
