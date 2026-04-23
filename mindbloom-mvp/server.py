"""
MindBloom 情绪分析模型 API 服务
基于 FastAPI 提供情绪分类推理服务
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import json
import os
from transformers import BertTokenizer, BertForSequenceClassification
import numpy as np

app = FastAPI(title="MindBloom Emotion Analysis API")

# 允许跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 模型配置
MODEL_PATH = os.path.join(os.path.dirname(__file__), "public", "models", "mindbloom-final")
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# 全局变量存储模型和 tokenizer
tokenizer = None
model = None
labels = None

class EmotionRequest(BaseModel):
    text: str

class EmotionResponse(BaseModel):
    label: str
    confidence: float
    all_scores: dict

def load_model():
    """加载模型和 tokenizer"""
    global tokenizer, model, labels
    
    print(f"Loading model from {MODEL_PATH} on {DEVICE}...")
    
    # 加载 tokenizer
    tokenizer = BertTokenizer.from_pretrained(MODEL_PATH)
    
    # 加载模型
    model = BertForSequenceClassification.from_pretrained(MODEL_PATH)
    model.to(DEVICE)
    model.eval()
    
    # 加载标签
    with open(os.path.join(MODEL_PATH, "labels.json"), "r", encoding="utf-8") as f:
        labels = json.load(f)
    
    print("Model loaded successfully!")

@app.on_event("startup")
async def startup_event():
    """启动时加载模型"""
    load_model()

@app.get("/")
async def root():
    return {
        "message": "MindBloom Emotion Analysis API",
        "status": "running",
        "labels": list(labels["id2label"].values()) if labels else []
    }

@app.post("/analyze", response_model=EmotionResponse)
async def analyze_emotion(request: EmotionRequest):
    """分析文本情绪"""
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    try:
        # 编码输入
        inputs = tokenizer(
            request.text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=512
        )
        inputs = {k: v.to(DEVICE) for k, v in inputs.items()}
        
        # 推理
        with torch.no_grad():
            outputs = model(**inputs)
            probabilities = torch.softmax(outputs.logits, dim=-1)
        
        # 获取结果
        scores = probabilities.cpu().numpy()[0]
        id2label = labels["id2label"]
        
        # 构建所有分数
        all_scores = {id2label[str(i)]: float(scores[i]) for i in range(len(scores))}
        
        # 获取最高分
        max_idx = np.argmax(scores)
        predicted_label = id2label[str(max_idx)]
        confidence = float(scores[max_idx])
        
        return EmotionResponse(
            label=predicted_label,
            confidence=confidence,
            all_scores=all_scores
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@app.post("/batch-analyze")
async def batch_analyze(request: EmotionRequest):
    """批量分析情绪"""
    # 复用单条分析逻辑
    return await analyze_emotion(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)