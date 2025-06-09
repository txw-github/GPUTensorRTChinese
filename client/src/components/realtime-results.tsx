import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Languages, CheckCircle, Type, Copy } from "lucide-react";
import type { TranscriptionJob } from "@shared/schema";

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

export function RealtimeResults() {
  const [currentSegments, setCurrentSegments] = useState<TranscriptionSegment[]>([
    {
      start: 135,
      end: 140,
      text: "欢迎观看今天的节目，我是主持人张明。"
    },
    {
      start: 140,
      end: 148,
      text: "今天我们要讨论的话题是人工智能在现代社会中的应用。"
    },
    {
      start: 148,
      end: 155,
      text: "人工智能技术正在快速发展，它已经渗透到我们生活的各个方面。"
    }
  ]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Get active processing jobs
  const { data: jobs = [] } = useQuery<TranscriptionJob[]>({
    queryKey: ['/api/jobs'],
    refetchInterval: 2000,
  });

  const activeJob = jobs.find(job => job.status === 'processing');

  useEffect(() => {
    if (activeJob) {
      setIsProcessing(true);
      // Simulate real-time transcription updates
      const interval = setInterval(() => {
        if (Math.random() > 0.7) {
          const newSegment: TranscriptionSegment = {
            start: 155 + currentSegments.length * 7,
            end: 162 + currentSegments.length * 7,
            text: getRandomChineseText()
          };
          
          setCurrentSegments(prev => [...prev, newSegment].slice(-10)); // Keep last 10 segments
        }
      }, 3000);

      return () => clearInterval(interval);
    } else {
      setIsProcessing(false);
    }
  }, [activeJob, currentSegments.length]);

  const getRandomChineseText = () => {
    const texts = [
      "从智能手机的语音助手到自动驾驶汽车...",
      "这些技术的发展正在改变我们的生活方式。",
      "人工智能在医疗、教育、金融等领域都有广泛应用。",
      "我们需要思考这些技术对社会的影响。",
      "技术的进步带来了新的机遇和挑战。"
    ];
    return texts[Math.floor(Math.random() * texts.length)];
  };

  const formatTimestamp = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = () => {
    const text = currentSegments
      .map(segment => `[${formatTimestamp(segment.start)}] ${segment.text}`)
      .join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: "Transcription preview has been copied.",
      });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-time Transcription Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm space-y-2 max-h-64 overflow-y-auto">
          {currentSegments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Type size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No active transcription</p>
              <p className="text-xs">Start processing a video to see real-time results</p>
            </div>
          ) : (
            <>
              {currentSegments.map((segment, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <span className="text-gray-400 min-w-0 flex-shrink-0">
                    [{formatTimestamp(segment.start)}]
                  </span>
                  <span className="text-gray-900">{segment.text}</span>
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex items-start space-x-3 opacity-75">
                  <span className="text-gray-400 min-w-0 flex-shrink-0">
                    [{formatTimestamp(155 + currentSegments.length * 7)}]
                  </span>
                  <span className="text-gray-900">正在处理中...</span>
                  <div className="flex items-center space-x-1 ml-2">
                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 text-gray-500">
            <div className="flex items-center space-x-1">
              <Languages size={16} />
              <span>Chinese (Simplified)</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle size={16} className="text-green-500" />
              <span>Multi-tone processed</span>
            </div>
            <div className="flex items-center space-x-1">
              <Type size={16} />
              <span>Auto-segmented</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            disabled={currentSegments.length === 0}
          >
            <Copy size={12} className="mr-1" />
            Copy Preview
          </Button>
        </div>

        {activeJob && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-700">
                Processing: {activeJob.filename}
              </span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-600">
              {activeJob.progress || 0}% Complete
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
