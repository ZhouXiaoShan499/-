# MindBloom 模型集成指南

## 模型文件位置

训练好的模型已放置在以下位置：

- **最终模型**: `mindbloom-mvp/public/models/mindbloom-final/`
  - `config.json` - 模型配置
  - `model.safetensors` - 模型权重
  - `tokenizer.json` - Tokenizer
  - `labels.json` - 情绪标签映射
  - 其他配置文件

- **训练检查点**: `mindbloom-trained-model/`
  - checkpoint-12, 24, 36, 48, 60 - 不同训练阶段的检查点

## 模型信息

- **基础模型**: hfl/rbt3 (中文 BERT)
- **任务**: 情绪分类
- **标签**: 内耗、孤独、平静、忧郁、快乐、愤怒、焦虑、疲惫、自我否定、迷茫

## 启动方式

### 1. 启动后端 API 服务

```bash
# 进入项目目录
cd mindbloom-mvp

# 安装 Python 依赖
pip install -r requirements.txt

# 启动 API 服务
python server.py
```

服务将在 `http://localhost:8000` 启动

### 2. 启动前端应用

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 3. API 测试

```bash
# 测试 API
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "我今天感觉很焦虑"}'
```

## API 接口

### POST /analyze

分析文本情绪

**请求体:**
```json
{
  "text": "我今天感觉很焦虑"
}
```

**响应:**
```json
{
  "label": "焦虑",
  "confidence": 0.85,
  "all_scores": {
    "内耗": 0.02,
    "孤独": 0.03,
    "平静": 0.05,
    "忧郁": 0.08,
    "快乐": 0.02,
    "愤怒": 0.03,
    "焦虑": 0.85,
    "疲惫": 0.06,
    "自我否定": 0.04,
    "迷茫": 0.02
  }
}
```

## TypeScript 使用

```typescript
import { aiEngine } from './services/ai-engine';

// 使用规则匹配分析（离线）
const result = aiEngine.analyze("我今天感觉很焦虑");
console.log(result);

// 使用深度学习模型（需要 API 服务）
const modelResult = await modelAnalyzer.analyze("我今天感觉很焦虑");
console.log(modelResult);
```

## 注意事项

1. 首次启动 API 服务需要加载模型，可能需要几十秒
2. 如果 API 不可用，前端会自动降级到规则匹配分析
3. 模型文件较大（约 500MB），确保有足够的磁盘空间
4. 建议使用 Python 虚拟环境安装依赖