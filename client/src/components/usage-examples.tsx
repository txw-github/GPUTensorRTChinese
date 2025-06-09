import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, Copy } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CodeExample {
  title: string;
  description: string;
  code: string;
  language: string;
}

export function UsageExamples() {
  const { toast } = useToast();
  const [openSections, setOpenSections] = useState<string[]>([]);

  const examples: CodeExample[] = [
    {
      title: "Command Line Interface",
      description: "Basic usage and batch processing examples",
      language: "bash",
      code: `# Basic usage:
python transcribe.py --input video.mp4 --gpu --tensorrt

# Batch processing:
python transcribe.py --batch videos/ --chinese --output-formats srt,vtt

# Advanced options:
python transcribe.py --input video.mp4 \\
  --language zh \\
  --variant simplified \\
  --multi-pronunciation \\
  --smart-punctuation \\
  --segmentation jieba \\
  --gpu --tensorrt \\
  --output-dir results/`
    },
    {
      title: "Python API",
      description: "Integrate transcription into your Python applications",
      language: "python",
      code: `from transcriber import VideoTranscriber
from transcriber.chinese import ChineseProcessor

# Initialize with GPU and TensorRT
transcriber = VideoTranscriber(
    gpu=True, 
    tensorrt=True,
    chinese_settings={
        'variant': 'simplified',
        'multi_pronunciation': True,
        'smart_punctuation': True,
        'segmentation_method': 'jieba'
    }
)

# Process single video
result = transcriber.process(
    'video.mp4', 
    lang='zh',
    output_formats=['srt', 'vtt', 'txt']
)

# Batch processing
results = transcriber.batch_process(
    input_dir='videos/',
    output_dir='results/',
    max_workers=2  # Limit concurrent jobs
)

# Access results
for segment in result.segments:
    print(f"[{segment.start}s-{segment.end}s]: {segment.text}")

print(f"Processing stats: {result.processing_stats}")
print(f"GPU speedup: {result.processing_stats.speedup}x")`
    },
    {
      title: "REST API",
      description: "HTTP API for integration with web applications",
      language: "bash",
      code: `# Upload and start transcription
curl -X POST http://localhost:8000/api/upload \\
  -F "video=@video.mp4" \\
  -F "language=zh" \\
  -F "settings={
    \\"variant\\": \\"simplified\\",
    \\"multiPronunciation\\": true,
    \\"smartPunctuation\\": true,
    \\"segmentationMethod\\": \\"jieba\\"
  }" \\
  -F "outputFormats=srt,vtt,txt"

# Check job status
curl http://localhost:8000/api/jobs/123

# Download results
curl -O http://localhost:8000/api/jobs/123/download/srt

# Get system metrics
curl http://localhost:8000/api/system/metrics`
    },
    {
      title: "WebSocket Real-time",
      description: "Real-time transcription updates via WebSocket",
      language: "javascript",
      code: `// Connect to WebSocket for real-time updates
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
    console.log('Connected to transcription service');
    
    // Subscribe to job updates
    ws.send(JSON.stringify({
        type: 'subscribe',
        jobId: 123
    }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
        case 'progress':
            console.log(\`Progress: \${data.progress}%\`);
            break;
            
        case 'segment':
            console.log(\`New segment: \${data.text}\`);
            displaySegment(data.start, data.end, data.text);
            break;
            
        case 'completed':
            console.log('Transcription completed');
            downloadResults(data.jobId);
            break;
            
        case 'error':
            console.error('Transcription error:', data.message);
            break;
    }
};

function displaySegment(start, end, text) {
    const timestamp = formatTimestamp(start);
    const element = document.createElement('div');
    element.innerHTML = \`[\${timestamp}] \${text}\`;
    document.getElementById('transcript').appendChild(element);
}`
    }
  ];

  const toggleSection = (title: string) => {
    setOpenSections(prev => 
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const copyCode = (code: string, title: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast({
        title: "Code Copied",
        description: `${title} example copied to clipboard.`,
      });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Examples</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {examples.map((example) => (
          <Collapsible key={example.title}>
            <CollapsibleTrigger
              className="flex items-center justify-between w-full cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 py-2"
              onClick={() => toggleSection(example.title)}
            >
              <span>{example.title}</span>
              <ChevronDown 
                size={16} 
                className={`transition-transform ${
                  openSections.includes(example.title) ? 'rotate-180' : ''
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-2">{example.description}</p>
                <div className="relative">
                  <pre className="p-3 bg-gray-50 rounded font-mono text-xs overflow-x-auto">
                    <code className="text-gray-900">{example.code}</code>
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 h-6 px-2"
                    onClick={() => copyCode(example.code, example.title)}
                  >
                    <Copy size={10} />
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
}
