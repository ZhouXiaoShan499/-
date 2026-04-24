# MindBloom 代码文件说明文档

本文档介绍 MindBloom 项目中各个代码文件的功能和用途。

---

## 📁 Python 数据与训练脚本

### 1. `collect_public_datasets.py` - 公开数据集收集工具

**功能**: 从 HuggingFace 和其他公开源收集情感数据集，并转换为 MindBloom 格式。

**主要功能**:
- 从 GoEmotions 数据集收集英文情绪数据
- 从 Mohammad Emotion Dataset 收集情绪数据
- 从 ChnSentiCorp 收集中文情感评论数据
- 从 OCNLI 收集中文自然语言推理数据
- 将英文情绪标签映射到 MindBloom 的 10 个中文情绪标签
- 生成数据集质量报告

**目标标签体系**: `["焦虑", "迷茫", "自我否定", "孤独", "忧郁", "疲惫", "愤怒", "平静", "快乐", "内耗"]`

**输出**: `collected-datasets/mindbloom-collected-dataset.json`

**运行方式**:
```bash
pip install datasets
python collect_public_datasets.py
```

---

### 2. `clean_data.py` - 数据清洗脚本

**功能**: 清洗原始 TSV 格式的情感数据，转换为 MindBloom 标准格式。

**主要功能**:
- 读取 TSV 格式的情感分类数据
- 处理读取错误（跳过坏行、忽略引号）
- 过滤短文本和敏感内容
- 将原始标签映射到 MindBloom 标签体系
- 保存为 JSON 格式

**输入**: `datases/emotion_classification.tsv`
**输出**: `mindbloom_emotion_ready.json`

**标签映射**:
- 高兴 → 快乐
- 喜爱 → 快乐/平静
- 惊讶 → 迷茫
- 愤怒 → 愤怒
- 厌恶 → 愤怒/内耗
- 悲伤 → 忧郁/孤独
- 恐惧 → 焦虑

---

### 3. `generate_extended_dataset.py` - 数据集扩充脚本

**功能**: 使用 Faker 库生成额外的模拟情绪数据，扩充数据集规模。

**主要功能**:
- 加载原始数据集并转换为多标签格式
- 使用文本模板生成 4500 条新数据
- 模拟真实用户情绪表达场景
- 支持多标签情绪分类（1-3 个标签）
- 去重并保存扩展数据集

**文本模板示例**:
- "最近{场景}压力好大，{身体感受}，感觉{情绪 1}又{情绪 2}"
- "{时间}一个人{行为}，心里{感受}，总是{情绪 1}，偶尔还会{情绪 2}"

**输入**: `mindbloom-emotion-dataset.json`
**输出**: `mindbloom-emotion-dataset-extended.json`

---

### 4. `merge_and_train.py` - 数据合并与训练准备脚本

**功能**: 合并所有数据源，进行数据预处理，为模型训练做准备。

**主要功能**:
- 合并原始数据、扩展数据、公开数据集
- 文本哈希去重
- 数据集平衡（控制各标签样本数）
- 生成训练报告（标签分布、数据源分布、文本长度统计）
- 分割训练集/验证集/测试集（8:1:1）

**输出文件**:
- `mindbloom-merged-dataset.json` - 合并数据集
- `mindbloom-train-dataset.json` - 训练集
- `mindbloom-val-dataset.json` - 验证集
- `mindbloom-test-dataset.json` - 测试集
- `training-report.json` - 训练报告

**运行方式**:
```bash
python merge_and_train.py
```

---

### 5. `train-mindbloom.py` - 模型训练脚本

**功能**: 使用 HuggingFace Transformers 训练情感分类模型。

**主要配置**:
- **模型**: `hfl/rbt3` (轻量中文 BERT)
- **最大长度**: 64 字符
- **批次大小**: 8
- **训练轮数**: 5
- **学习率**: 2e-5

**主要功能**:
- 加载并预处理数据集
- 划分训练集/测试集（9:1）
- 定义评估指标（准确率 + F1 分数）
- 训练模型并记录日志
- 生成 Loss 和 Accuracy 可视化曲线
- 保存最佳模型

**输出**:
- `./mindbloom-best-model/` - 最佳模型目录
- `./training_curves.png` - 训练曲线图

**运行方式**:
```bash
pip install torch pandas numpy scikit-learn transformers matplotlib
python train-mindbloom.py
```

---

### 6. `mindbloom-mvp/server.py` - API 服务

**功能**: 基于 FastAPI 提供情绪分析模型推理服务。

**主要功能**:
- CORS 跨域配置
- 基于 IP 的速率限制（默认 100 请求/分钟）
- 输入验证（文本长度限制）
- 模型加载与推理
- 健康检查端点
- 异常处理（不暴露内部错误信息）

**API 端点**:
- `GET /` - API 信息
- `POST /analyze` - 分析文本情绪
- `POST /batch-analyze` - 批量分析情绪
- `GET /health` - 健康检查

**运行方式**:
```bash
pip install fastapi uvicorn transformers torch
python mindbloom-mvp/server.py
```

**访问**: http://localhost:8000

---

## 📁 TypeScript 前端服务

### 7. `mindbloom-mvp/src/services/data-contribution.ts` - 数据贡献服务

**功能**: 处理用户情绪数据的贡献和上传功能。

**主要功能**:
- 数据格式验证
- 数据加密处理
- 上传到数据贡献平台
- 贡献记录管理

---

### 8. `mindbloom-mvp/src/services/storage.ts` - 本地存储服务

**功能**: 管理用户数据的本地存储和同步。

**主要功能**:
- IndexedDB 数据持久化
- 会话管理
- 卡片和连接数据存储
- 数据导出/导入

---

### 9. `mindbloom-mvp/src/services/ai-engine.ts` - AI 引擎服务

**功能**: 集成 AI 模型进行情绪分析。

**主要功能**:
- 调用后端 API 进行情绪分析
- 本地模型推理（可选）
- 分析结果缓存
- 错误处理和重试

---

### 10. `mindbloom-mvp/src/services/speech-recognition.ts` - 语音识别服务

**功能**: 提供语音输入和情绪识别功能。

**主要功能**:
- Web Speech API 集成
- 语音转文本
- 实时语音流处理
- 语音情绪检测

---

## 📁 状态管理

### 11. `mindbloom-mvp/src/store/useStore.ts` - 全局状态管理

**功能**: 使用 Zustand 管理应用全局状态。

**主要管理的数据**:
- 当前会话信息
- 情绪卡片列表
- 卡片连接关系
- 用户偏好设置
- 动画开关状态

---

## 📁 UI 组件

### 12. `mindbloom-mvp/src/components/EmotionCard/EmotionCanvas.tsx` - 情绪画布组件

**功能**: 显示和管理情绪卡片的可视化画布。

**主要功能**:
- 卡片拖拽移动
- 卡片连接（绘制贝塞尔曲线）
- 连接模式切换
- 卡片删除
- 空状态引导

---

### 13. `mindbloom-mvp/src/components/Game/Balloon.tsx` - 气球组件

**功能**: 游戏化元素中的气球组件。

---

### 14. `mindbloom-mvp/src/components/Game/WaterDrop.tsx` - 水滴组件

**功能**: 游戏化元素中的水滴组件。

---

### 15. `mindbloom-mvp/src/components/Game/GameOverlay.tsx` - 游戏覆盖层

**功能**: 游戏界面的覆盖层显示。

---

### 16. `mindbloom-mvp/src/components/Sidebar/Sidebar.tsx` - 侧边栏组件

**功能**: 应用侧边栏导航和工具面板。

---

## 📊 数据集文件

### `mindbloom-emotion-dataset.json`
原始情绪数据集（单标签格式）

### `mindbloom-emotion-dataset-extended.json`
扩展后的情绪数据集（多标签格式，约 4600 条）

### `mindbloom-merged-dataset.json`
合并所有数据源后的数据集

### `mindbloom-train-dataset.json`
训练集（约 80%）

### `mindbloom-val-dataset.json`
验证集（约 10%）

### `mindbloom-test-dataset.json`
测试集（约 10%）

---

## 🔄 工作流程

```
1. 数据收集
   collect_public_datasets.py
         ↓
2. 数据清洗
   clean_data.py
         ↓
3. 数据扩充
   generate_extended_dataset.py
         ↓
4. 数据合并与准备
   merge_and_train.py
         ↓
5. 模型训练
   train-mindbloom.py
         ↓
6. 模型部署
   server.py
         ↓
7. 前端集成
   mindbloom-mvp/
```

---

## 📦 依赖安装

### Python 依赖
```bash
pip install -r mindbloom-mvp/requirements.txt
```

### 前端依赖
```bash
cd mindbloom-mvp
npm install