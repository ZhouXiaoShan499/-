# MindBloom 情感数据集资源指南

## 一、推荐公开情感数据集

### 1. 中文情感分析数据集

| 数据集名称 | 来源 | 规模 | 情绪标签 | 下载链接 |
|-----------|------|------|---------|---------|
| **ChnSentiCorp** | 携程评论 | ~10,000 条 | 正面/负面 | GitHub 搜索 "ChnSentiCorp" |
| **Weibo Sentiment** | 微博评论 | ~150,000 条 | 正面/负面/中性 | [GitHub - 中文情感分析](https://github.com/SophonEDU/chinese_sentiment) |
| **AFQMC (Ant Financial Question Matching Corpus)** | 蚂蚁金服 | ~400,000 条 | 语义相似/不相似 | [飞桨 PaddleNLP 数据集](https://aistudio.baidu.com/datasetdetail/afqmc) |
| **XNLI** | 多语言 NLI | ~500,000 条（含中文）| 蕴含/矛盾/中立 | [MultiNLI 官网](https://www.nyu.edu/projects/bowman/multinli/) |
| **CMNLI** | 中文 NLI | ~380,000 条 | 蕴含/矛盾/中立 | [SNLI 中文版本](https://github.com/ryanhaoqin/NLI-in-XNLI) |
| **THUCNews** | 搜狐新闻 | ~1,000,000 条 | 14 个类别 | [THU 数据集](http://thuctc.thunlp.org/) |
| **Ocnli (Open Chinese NLI)** | 开源中文 NLI | ~400,000 条 | 蕴含/矛盾/中立 | [OCNLI 官网](https://github.com/cltl/Ocnli) |
| **SMP 2020 ECOM** | 电商评论 | ~20,000 条 | 正面/负面/中性 | [SMP 官网](https://smp-platform.github.io/) |

### 2. 情绪分类专用数据集

| 数据集名称 | 情绪类别 | 规模 | 特点 | 下载链接 |
|-----------|---------|------|------|---------|
| **GoEmotions** | 27 种情绪 | ~58,000 条 | 微博情绪标注 | [Google Research](https://huggingface.co/datasets/google-research-datasets/goemotions) |
| **Emotion Dataset (Mohammad)** | 6 种基本情绪 | ~16,000 条 | 快乐/悲伤/愤怒/恐惧/厌恶/惊讶 | [HuggingFace](https://huggingface.co/datasets/mbpp/emotion_dataset) |
| **SEED** | 4 种基本情绪 | ~2,400 条 | 多模态情感 | [SEED 官网](https://seeg-oxford.github.io/seed/) |
| **CAER-S** | 4 种情绪 | ~200,000 条 | 上下文情感 | [CAER 官网](https://aclanthology.org/2020.lrec-1.589/) |

### 3. HuggingFace 一键加载数据集

```python
from datasets import load_dataset

# 中文情感分析
datasets = [
    "autherqiu/anli",           # 中文自然语言推理
    "cltl/Ocnli",               # 开源中文 NLI
    "lhoestn/chnsenticorp",     # 中文情感评论
    "yujiepan/afqmc",           # 蚂蚁金服语义匹配
    "thuiabs/TNews",            # 新闻分类
]

for ds in datasets:
    data = load_dataset(ds)
    print(f"Loaded: {ds}, size: {data}")
```

### 4. 推荐组合方案（针对 MindBloom）

```
推荐数据集组合：
├── GoEmotions（英文）→ 翻译为中文 → 扩充情绪类别
├── Mohammad Emotion Dataset → 6 基本情绪 → 映射到 MindBloom 10 类
├── ChnSentiCorp → 补充日常场景文本
└── 自有数据 → 保持 MindBloom 特色标签体系
```

---

## 二、本地数据收集方案

### 方案 1：应用内匿名收集（推荐）

在 MindBloom 应用中添加"贡献数据"选项：

```typescript
// mindbloom-mvp/src/services/data-contribution.ts
interface ContributedData {
  text: string;
  selectedEmotions: string[];  // 用户选择的情绪标签
  timestamp: number;
  sessionId: string;
}

class DataContributionService {
  private contributions: ContributedData[] = [];
  
  // 用户完成情绪记录后，询问是否贡献数据
  askContribution(record: EmotionRecord): boolean {
    // 弹出提示："是否帮助改善 AI？匿名贡献此条记录"
    return userConfirm();
  }
  
  // 本地加密存储贡献数据
  saveContribution(data: ContributedData): void {
    this.contributions.push(data);
    this.encryptAndSave();
  }
  
  // 定期导出为训练格式
  exportForTraining(): EmotionDatasetItem[] {
    return this.contributions.map(c => ({
      text: c.text,
      label: c.selectedEmotions[0]  // 主情绪
    }));
  }
}
```

### 方案 2：Web 表单收集

创建一个简单的 Web 表单页面：

```html
<!-- data-collection.html -->
<!DOCTYPE html>
<html>
<head>
    <title>MindBloom 数据贡献</title>
</head>
<body>
    <h1>帮助改善情绪识别 AI</h1>
    <form id="emotionForm">
        <label>请描述你此刻的感受：</label>
        <textarea id="inputText" required></textarea>
        
        <label>选择最符合的情绪标签（可多选）：</label>
        <div class="emotions">
            <label><input type="checkbox" value="焦虑"> 焦虑</label>
            <label><input type="checkbox" value="迷茫"> 迷茫</label>
            <label><input type="checkbox" value="自我否定"> 自我否定</label>
            <label><input type="checkbox" value="孤独"> 孤独</label>
            <label><input type="checkbox" value="忧郁"> 忧郁</label>
            <label><input type="checkbox" value="疲惫"> 疲惫</label>
            <label><input type="checkbox" value="愤怒"> 愤怒</label>
            <label><input type="checkbox" value="平静"> 平静</label>
            <label><input type="checkbox" value="快乐"> 快乐</label>
            <label><input type="checkbox" value="内耗"> 内耗</label>
        </div>
        
        <button type="submit">提交（匿名）</button>
    </form>
</body>
</html>
```

### 方案 3：API 收集服务（Node.js）

```javascript
// data-collector-server.js
const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const app = express();

app.use(express.json());

const DATASET_FILE = 'contributed-data.json';
const SALT = crypto.randomBytes(16).toString('hex');

// 匿名化处理
function anonymize(text) {
  // 移除个人信息（手机号、邮箱等）
  return text
    .replace(/1[3-9]\d{9}/g, '[手机号]')
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, '[邮箱]')
    .replace(/[\u4e00-\u9fa5]{2,4}(?:先生|女士|朋友|同学)/g, '[人名]');
}

app.post('/api/contribute', (req, res) => {
  const { text, emotions, sessionId } = req.body;
  
  const anonymizedText = anonymize(text);
  const contribution = {
    text: anonymizedText,
    label: emotions,
    timestamp: Date.now(),
    hash: crypto.createHash('sha256')
      .update(anonymizedText + SALT)
      .digest('hex')
  };
  
  // 追加到数据集
  const data = JSON.parse(fs.readFileSync(DATASET_FILE, 'utf8') || '[]');
  data.push(contribution);
  fs.writeFileSync(DATASET_FILE, JSON.stringify(data, null, 2));
  
  res.json({ success: true });
});

app.listen(3001, () => console.log('Data collector running on port 3001'));
```

---

## 三、数据增强技术

### 使用 LLM 生成合成数据

```python
# synthetic_data_generator.py
from openai import OpenAI
import json
import random

client = OpenAI(api_key="your-api-key", base_url="https://api.openai.com")

EMOTION_LABELS = ["焦虑", "迷茫", "自我否定", "孤独", "忧郁", "疲惫", "愤怒", "平静", "快乐", "内耗"]

SCENARIOS = {
    "焦虑": ["工作压力", "考试复习", "人际关系", "经济压力", "未来规划"],
    "迷茫": ["职业选择", "人生方向", "兴趣缺失", "价值困惑", "目标设定"],
    "自我否定": ["工作失误", "比较心理", "失败经历", "他人评价", "能力怀疑"],
    "孤独": ["异地生活", "社交困难", "家庭分离", "恋爱空窗", "群体融入"],
    "忧郁": ["失去亲人", "友谊破裂", "健康困扰", "生活变故", "回忆触发"],
    "疲惫": ["加班文化", "学业压力", "家务负担", "通勤劳累", "精神消耗"],
    "愤怒": ["不公平待遇", "被误解", "规则破坏", "信任背叛", "边界侵犯"],
    "平静": ["自然体验", "冥想练习", "完成目标", "安静时光", "内心和解"],
    "快乐": ["成就达成", "社交连接", "美食体验", "惊喜时刻", "健康恢复"],
    "内耗": ["选择困难", "完美主义", "过度思考", "情绪压抑", "认知冲突"]
}

def generate_synthetic_samples(label, count=50):
    """使用 LLM 生成合成数据"""
    scenario = random.choice(SCENARIOS[label])
    
    prompt = f"""请生成 {count} 条关于"{label}"情绪的中文文本，场景为"{scenario}"。
要求：
1. 每条文本 10-50 字
2. 语言自然、口语化
3. 贴近日常生活
4. 不要重复或模板化
5. 每行一条，不要编号

示例格式：
最近工作压力好大，晚上经常失眠
总是在想刚才那句话是不是说得不合适"""
    
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
        max_tokens=2000
    )
    
    texts = [line.strip() for line in response.choices[0].message.content.split('\n') if line.strip()]
    
    return [{"text": text, "label": label} for text in texts[:count]]

# 生成数据
dataset = []
for label in EMOTION_LABELS:
    samples = generate_synthetic_samples(label, count=100)
    dataset.extend(samples)
    print(f"Generated {len(samples)} samples for {label}")

with open("mindbloom-synthetic-dataset.json", "w", encoding="utf-8") as f:
    json.dump(dataset, f, ensure_ascii=False, indent=2)

print(f"Total: {len(dataset)} synthetic samples")
```

### 回译增强（Translation Back-Translation）

```python
# back_translation_augment.py
from transformers import MarianMTModel, MarianTokenizer
import json

# 中→英→中 回译
def back_translate(text):
    tokenizer = MarianMTModel.from_pretrained("Helsinki-NLP/opus-mt-zh-en")
    tokenizer_en = MarianMTModel.from_pretrained("Helsinki-NLP/opus-mt-en-zh")
    
    # 中文 → 英文
    tokens = tokenizer(text, return_tensors="pt")
    translated = tokenizer.generate(**tokens)
    english = tokenizer.decode(translated[0], skip_special_tokens=True)
    
    # 英文 → 中文（同义表达）
    tokens_en = tokenizer_en(english, return_tensors="pt")
    back = tokenizer_en.generate(**tokens_en)
    return tokenizer_en.decode(back[0], skip_special_tokens=True)

# 对现有数据集进行增强
with open("mindbloom-emotion-dataset.json", "r", encoding="utf-8") as f:
    dataset = json.load(f)

augmented = dataset.copy()
for item in dataset:
    augmented_text = back_translate(item["text"])
    if augmented_text != item["text"]:
        augmented.append({
            "text": augmented_text,
            "label": item["label"]
        })

with open("mindbloom-augmented-dataset.json", "w", encoding="utf-8") as f:
    json.dump(augmented, f, ensure_ascii=False, indent=2)

print(f"Augmented from {len(dataset)} to {len(augmented)}")
```

---

## 四、数据质量保障

### 1. 数据标注规范

```
标注质量标准：
├── 准确性：标签必须准确反映文本情绪
├── 一致性：同一类情绪的不同样本应保持一致性
├── 多样性：覆盖不同年龄、地区、场景
└── 真实性：避免过于书面化或模板化的表达
```

### 2. 数据清洗流程

```python
# data_quality_check.py
import re
from collections import Counter

def check_data_quality(dataset):
    """检查数据集质量"""
    stats = {
        "total": len(dataset),
        "label_distribution": Counter(item["label"] for item in dataset),
        "text_length_stats": {},
        "duplicate_count": 0
    }
    
    texts = set()
    for item in dataset:
        text_len = len(item["text"])
        if text_len not in stats["text_length_stats"]:
            stats["text_length_stats"][text_len] = 0
        stats["text_length_stats"][text_len] += 1
        
        if item["text"] in texts:
            stats["duplicate_count"] += 1
        texts.add(item["text"])
    
    # 检查标签分布是否均衡
    label_counts = list(stats["label_distribution"].values())
    if max(label_counts) > min(label_counts) * 3:
        print("⚠️  警告：标签分布不均衡！")
    
    return stats
```

### 3. 数据版本管理

```
dataset/
├── v1.0/
│   └── original-101.json      # 原始 101 条
├── v2.0/
│   └── extended-4600.json     # Faker 扩展后
├── v3.0/
│   └── public-data-merged.json  # 合并公开数据
└── v4.0/
    └── final-training.json    # 最终训练集
```

---

## 五、快速开始

### 一键获取公开数据集

```bash
# 安装依赖
pip install datasets transformers pandas

# 运行数据收集脚本
python collect_public_datasets.py
```

```python
# collect_public_datasets.py
from datasets import load_dataset
import json

def collect_datasets():
    """收集公开数据集并转换为 MindBloom 格式"""
    
    # 1. 加载 GoEmotions（英文，需翻译）
    print("Loading GoEmotions...")
    goemotions = load_dataset("google-research-datasets/goemotions")
    
    # 2. 加载 Mohammad Emotion Dataset
    print("Loading Mohammad Emotion Dataset...")
    emotion_ds = load_dataset("mbpp/emotion_dataset")
    
    # 3. 转换为 MindBloom 格式
    mindbloom_format = []
    
    for split in ["train", "validation"]:
        for item in emotion_ds[split]:
            mindbloom_format.append({
                "text": item["text"],
                "label": item["emotion"]
            })
    
    with open("collected-dataset.json", "w", encoding="utf-8") as f:
        json.dump(mindbloom_format, f, ensure_ascii=False, indent=2)
    
    print(f"Collected {len(mindbloom_format)} samples")

if __name__ == "__main__":
    collect_datasets()
```

---

## 六、隐私与合规

### 数据收集隐私原则

```
1. 知情同意 - 明确告知用户数据用途
2. 匿名化处理 - 移除所有个人标识信息
3. 本地优先 - 数据存储在用户本地
4. 可选贡献 - 用户可随时删除自己的数据
5. 透明公开 - 公开数据处理方式
```

### 合规检查清单

- [ ] 符合《个人信息保护法》(PIPL) 要求
- [ ] 数据收集有明确的用户授权
- [ ] 提供数据删除选项
- [ ] 不收集敏感个人信息
- [ ] 数据加密存储和传输