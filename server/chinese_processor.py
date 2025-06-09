"""
Advanced Chinese Text Processing with Multi-pronunciation Support
Handles Chinese sentence segmentation, punctuation, and multi-tone characters
"""

import re
import jieba
import jieba.posseg as pseg
from typing import Dict, List, Tuple, Set, Optional
from dataclasses import dataclass
import unicodedata

# Multi-pronunciation character mappings
try:
    from pypinyin import lazy_pinyin, pinyin, Style
    PYPINYIN_AVAILABLE = True
except ImportError:
    PYPINYIN_AVAILABLE = False
    print("Warning: pypinyin not available. Multi-pronunciation processing will be limited.")


@dataclass
class ChineseProcessingSettings:
    variant: str = "simplified"  # simplified, traditional, auto
    multi_pronunciation: bool = True
    smart_punctuation: bool = True
    segmentation_method: str = "jieba"  # jieba, ai, basic


class MultiPronunciationProcessor:
    """Handle Chinese characters with multiple pronunciations (多音字)"""
    
    def __init__(self):
        # Common multi-pronunciation characters with context-based rules
        self.multi_pronunciation_chars = {
            '中': {
                'zhōng': ['中国', '中央', '中间', '中心', '中文', '中医'],
                'zhòng': ['中毒', '中奖', '中计', '击中', '看中']
            },
            '行': {
                'xíng': ['行走', '行动', '行为', '可行', '行人', '银行'],
                'háng': ['行列', '行业', '同行', '内行', '外行', '一行']
            },
            '重': {
                'zhòng': ['重要', '重大', '重点', '重新', '重复'],
                'chóng': ['重叠', '重复', '重来', '重新']
            },
            '长': {
                'cháng': ['长度', '长短', '长江', '长城', '很长'],
                'zhǎng': ['长大', '长老', '家长', '校长', '部长']
            },
            '发': {
                'fā': ['发生', '发现', '发明', '发展', '发言'],
                'fà': ['头发', '白发', '理发']
            },
            '地': {
                'dì': ['土地', '地方', '地址', '地球', '大地'],
                'de': ['慢慢地', '高兴地', '认真地', '仔细地']
            },
            '着': {
                'zhe': ['看着', '走着', '说着', '笑着'],
                'zháo': ['着火', '着急', '着凉'],
                'zhuó': ['着装', '着手', '着重']
            },
            '了': {
                'le': ['走了', '来了', '好了', '完了'],
                'liǎo': ['了解', '了不起', '受不了', '一目了然']
            }
        }
        
        # Context patterns for disambiguation
        self.context_patterns = self._build_context_patterns()
    
    def _build_context_patterns(self) -> Dict[str, List[Tuple[str, str]]]:
        """Build regex patterns for context-based pronunciation detection"""
        patterns = {}
        
        for char, pronunciations in self.multi_pronunciation_chars.items():
            char_patterns = []
            for pronunciation, contexts in pronunciations.items():
                # Create regex patterns from context words
                for context in contexts:
                    if char in context:
                        # Create pattern around the character
                        idx = context.index(char)
                        before = context[:idx] if idx > 0 else ""
                        after = context[idx+1:] if idx < len(context)-1 else ""
                        
                        pattern = f"{before}{char}{after}"
                        char_patterns.append((pattern, pronunciation))
            
            patterns[char] = char_patterns
        
        return patterns
    
    def get_pronunciation(self, char: str, context: str) -> Optional[str]:
        """Get the correct pronunciation for a character in context"""
        if char not in self.multi_pronunciation_chars:
            return None
        
        if not PYPINYIN_AVAILABLE:
            # Fallback to first pronunciation
            pronunciations = list(self.multi_pronunciation_chars[char].keys())
            return pronunciations[0] if pronunciations else None
        
        # Check context patterns
        if char in self.context_patterns:
            for pattern, pronunciation in self.context_patterns[char]:
                if pattern in context:
                    return pronunciation
        
        # Fallback to pypinyin
        try:
            result = lazy_pinyin(char, style=Style.TONE)[0]
            return result
        except:
            return None
    
    def process_text_pronunciations(self, text: str) -> str:
        """Process text to handle multi-pronunciation characters"""
        if not PYPINYIN_AVAILABLE:
            return text
        
        # For now, we'll keep the original text but could add pronunciation annotations
        # In a full implementation, you might add pinyin annotations or corrections
        processed_text = text
        
        # Add pronunciation corrections based on context
        for char in self.multi_pronunciation_chars:
            if char in text:
                pronunciation = self.get_pronunciation(char, text)
                # Could add pronunciation hints or corrections here
        
        return processed_text


class ChinesePunctuationProcessor:
    """Handle Chinese punctuation and sentence boundaries"""
    
    def __init__(self):
        # Chinese punctuation mappings
        self.punctuation_map = {
            '，': ',',    # Chinese comma to English comma (optional)
            '。': '。',    # Keep Chinese period
            '？': '？',    # Keep Chinese question mark
            '！': '！',    # Keep Chinese exclamation mark
            '；': ';',     # Chinese semicolon to English
            '：': ':',     # Chinese colon to English
            '"': '"',     # Left quote
            '"': '"',     # Right quote
            ''': "'",     # Left single quote
            ''': "'",     # Right single quote
            '（': '(',     # Left parenthesis
            '）': ')',     # Right parenthesis
            '《': '<',     # Left book title mark
            '》': '>',     # Right book title mark
            '【': '[',     # Left bracket
            '】': ']',     # Right bracket
        }
        
        # Sentence ending punctuation
        self.sentence_endings = ['。', '？', '！', '.', '?', '!']
        
        # Pause punctuation
        self.pause_punctuation = ['，', '、', '；', ',', ';']
    
    def add_smart_punctuation(self, text: str) -> str:
        """Add intelligent punctuation based on text analysis"""
        if not text.strip():
            return text
        
        # Remove extra spaces
        text = re.sub(r'\s+', '', text)
        
        # Add periods at natural sentence boundaries
        text = self._add_sentence_boundaries(text)
        
        # Add commas at natural pause points
        text = self._add_comma_boundaries(text)
        
        return text
    
    def _add_sentence_boundaries(self, text: str) -> str:
        """Add sentence boundaries based on semantic analysis"""
        # Simple rules for sentence boundaries
        sentences = []
        current_sentence = ""
        
        # Split by existing punctuation first
        parts = re.split(r'([。？！])', text)
        
        for i, part in enumerate(parts):
            if part in self.sentence_endings:
                current_sentence += part
                sentences.append(current_sentence.strip())
                current_sentence = ""
            else:
                current_sentence += part
        
        if current_sentence.strip():
            # Add period if no ending punctuation
            if not any(current_sentence.endswith(p) for p in self.sentence_endings):
                current_sentence += "。"
            sentences.append(current_sentence.strip())
        
        return "".join(sentences)
    
    def _add_comma_boundaries(self, text: str) -> str:
        """Add commas at natural pause points"""
        # Use jieba for word segmentation to identify pause points
        words = list(jieba.cut(text))
        
        result = []
        for i, word in enumerate(words):
            result.append(word)
            
            # Add comma after certain patterns
            if i < len(words) - 1:
                next_word = words[i + 1]
                
                # Add comma after certain conjunctions or transition words
                if word in ['但是', '然后', '因此', '所以', '不过', '而且', '另外']:
                    if '，' not in result[-1]:
                        result.append('，')
        
        return "".join(result)


class ChineseSentenceSegmenter:
    """Segment Chinese text into proper sentences"""
    
    def __init__(self, method: str = "jieba"):
        self.method = method
        
        # Initialize jieba with custom dictionary for better segmentation
        jieba.load_userdict(self._get_custom_dict())
    
    def _get_custom_dict(self) -> List[str]:
        """Get custom dictionary entries for better segmentation"""
        # In a full implementation, this would load from a file
        custom_words = [
            "人工智能", "机器学习", "深度学习", "神经网络",
            "大数据", "云计算", "物联网", "区块链",
            "自然语言处理", "计算机视觉", "语音识别"
        ]
        return custom_words
    
    def segment_sentences(self, text: str) -> str:
        """Segment text into proper sentences"""
        if self.method == "jieba":
            return self._segment_with_jieba(text)
        elif self.method == "ai":
            return self._segment_with_ai(text)
        else:
            return self._segment_basic(text)
    
    def _segment_with_jieba(self, text: str) -> str:
        """Use jieba for intelligent sentence segmentation"""
        # First, segment words
        words = list(jieba.cut(text))
        
        # Then group into sentences based on punctuation and semantic rules
        sentences = []
        current_sentence = []
        
        for word in words:
            current_sentence.append(word)
            
            # Check for sentence endings
            if any(word.endswith(p) for p in ['。', '？', '！', '.', '?', '!']):
                sentences.append("".join(current_sentence).strip())
                current_sentence = []
        
        if current_sentence:
            sentence_text = "".join(current_sentence).strip()
            if sentence_text:
                # Add period if no ending punctuation
                if not any(sentence_text.endswith(p) for p in ['。', '？', '！', '.', '?', '!']):
                    sentence_text += "。"
                sentences.append(sentence_text)
        
        return "".join(sentences)
    
    def _segment_with_ai(self, text: str) -> str:
        """Use AI-based segmentation (placeholder for future implementation)"""
        # This would use a trained model for sentence segmentation
        # For now, fall back to jieba
        return self._segment_with_jieba(text)
    
    def _segment_basic(self, text: str) -> str:
        """Basic segmentation using simple rules"""
        # Split on obvious sentence boundaries
        sentences = re.split(r'[。？！]', text)
        
        result = []
        for sentence in sentences:
            sentence = sentence.strip()
            if sentence:
                result.append(sentence + "。")
        
        return "".join(result)


class ChineseProcessor:
    """Main Chinese text processing class"""
    
    def __init__(self, settings: Dict):
        self.settings = ChineseProcessingSettings(**settings)
        
        # Initialize processors
        self.multi_pronunciation = MultiPronunciationProcessor()
        self.punctuation = ChinesePunctuationProcessor()
        self.segmenter = ChineseSentenceSegmenter(self.settings.segmentation_method)
    
    def process_text(self, text: str) -> str:
        """Process Chinese text with all enabled features"""
        if not text or not text.strip():
            return text
        
        processed_text = text.strip()
        
        # Handle text variant conversion if needed
        if self.settings.variant == "traditional":
            processed_text = self._convert_to_traditional(processed_text)
        elif self.settings.variant == "simplified":
            processed_text = self._convert_to_simplified(processed_text)
        
        # Process multi-pronunciation characters
        if self.settings.multi_pronunciation:
            processed_text = self.multi_pronunciation.process_text_pronunciations(processed_text)
        
        # Add smart punctuation
        if self.settings.smart_punctuation:
            processed_text = self.punctuation.add_smart_punctuation(processed_text)
        
        return processed_text
    
    def segment_sentences(self, text: str) -> str:
        """Segment text into proper sentences"""
        return self.segmenter.segment_sentences(text)
    
    def _convert_to_traditional(self, text: str) -> str:
        """Convert simplified Chinese to traditional (placeholder)"""
        # This would use a conversion library like opencc
        # For now, return as-is
        return text
    
    def _convert_to_simplified(self, text: str) -> str:
        """Convert traditional Chinese to simplified (placeholder)"""
        # This would use a conversion library like opencc
        # For now, return as-is
        return text
    
    def analyze_text_quality(self, text: str) -> Dict[str, float]:
        """Analyze the quality of processed Chinese text"""
        if not text:
            return {"completeness": 0.0, "punctuation_score": 0.0, "segmentation_score": 0.0}
        
        # Analyze punctuation coverage
        punctuation_count = sum(1 for char in text if char in '，。？！；：')
        punctuation_score = min(1.0, punctuation_count / max(1, len(text) // 20))
        
        # Analyze sentence completeness
        sentences = re.split(r'[。？！]', text)
        complete_sentences = sum(1 for s in sentences if len(s.strip()) > 3)
        completeness = complete_sentences / max(1, len(sentences)) if sentences else 0
        
        # Analyze segmentation quality (based on word boundaries)
        words = list(jieba.cut(text))
        avg_word_length = sum(len(word) for word in words) / max(1, len(words))
        segmentation_score = max(0.0, min(1.0, 1.0 - abs(avg_word_length - 2.5) / 2.5))
        
        return {
            "completeness": completeness,
            "punctuation_score": punctuation_score,
            "segmentation_score": segmentation_score,
            "overall_quality": (completeness + punctuation_score + segmentation_score) / 3
        }


# Example usage and testing
if __name__ == "__main__":
    # Test Chinese processing
    settings = {
        "variant": "simplified",
        "multi_pronunciation": True,
        "smart_punctuation": True,
        "segmentation_method": "jieba"
    }
    
    processor = ChineseProcessor(settings)
    
    # Test text
    test_text = "欢迎观看今天的节目我是主持人张明今天我们要讨论的话题是人工智能在现代社会中的应用"
    
    print("Original text:", test_text)
    print("Processed text:", processor.process_text(test_text))
    print("Segmented text:", processor.segment_sentences(test_text))
    
    quality = processor.analyze_text_quality(processor.process_text(test_text))
    print("Quality analysis:", quality)
