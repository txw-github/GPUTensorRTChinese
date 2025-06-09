import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import type { ChineseSettings } from "@shared/schema";

interface ChineseSettingsProps {
  settings: ChineseSettings;
  onSettingsChange: (settings: ChineseSettings) => void;
}

export function ChineseSettings({ settings, onSettingsChange }: ChineseSettingsProps) {
  const updateSetting = <K extends keyof ChineseSettings>(
    key: K, 
    value: ChineseSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chinese Processing Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="language-variant">Language Variant</Label>
          <Select
            value={settings.variant}
            onValueChange={(value: 'simplified' | 'traditional' | 'auto') => 
              updateSetting('variant', value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simplified">Simplified Chinese (简体中文)</SelectItem>
              <SelectItem value="traditional">Traditional Chinese (繁體中文)</SelectItem>
              <SelectItem value="auto">Auto-detect</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="multi-pronunciation">Multi-pronunciation Processing</Label>
            <Switch
              id="multi-pronunciation"
              checked={settings.multiPronunciation}
              onCheckedChange={(checked) => updateSetting('multiPronunciation', checked)}
            />
          </div>
          <p className="text-xs text-gray-500">
            Handle characters with multiple pronunciations (多音字)
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="smart-punctuation">Smart Punctuation</Label>
            <Switch
              id="smart-punctuation"
              checked={settings.smartPunctuation}
              onCheckedChange={(checked) => updateSetting('smartPunctuation', checked)}
            />
          </div>
          <p className="text-xs text-gray-500">
            Automatic punctuation and sentence segmentation
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="segmentation-method">Sentence Segmentation</Label>
          <Select
            value={settings.segmentationMethod}
            onValueChange={(value: 'jieba' | 'ai' | 'basic') => 
              updateSetting('segmentationMethod', value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jieba">Jieba + Rules</SelectItem>
              <SelectItem value="ai">AI-based (slower)</SelectItem>
              <SelectItem value="basic">Basic splitting</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Output Format</Label>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="srt" defaultChecked />
              <Label htmlFor="srt" className="text-sm">SRT</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="vtt" defaultChecked />
              <Label htmlFor="vtt" className="text-sm">VTT</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="txt" />
              <Label htmlFor="txt" className="text-sm">TXT</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
