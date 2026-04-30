"""
MindBloom 情绪分析模型 API 服务
基于 FastAPI 提供情绪分类推理服务
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import torch
import json
import os
import logging
import threading
from transformers import BertTokenizer, BertForSequenceClassification
import numpy as np
from time import time
from collections import defaultdict

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="MindBloom Emotion Analysis API")

# ==============================================
# 安全配置
# ==============================================

# CORS 配置 - 生产环境应限制为特定域名
# 可以通过环境变量配置允许的源
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # 限制允许的源
    allow_credentials=True,
    allow_methods=["POST", "GET"],  # 限制允许的 HTTP 方法
    allow_headers=["Content-Type", "Authorization"],  # 限制允许的头部
    max_age=3600,  # 预检请求缓存时间
)

# ==============================================
# 速率限制配置
# ==============================================

class RateLimiter:
    """简单的基于 IP 的速率限制器"""
    
    def __init__(self, max_requests: int = 100, time_window: int = 60):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = defaultdict(list)
    
    def is_allowed(self, client_ip: str) -> bool:
        current_time = time()
        # 清理过期记录
        self.requests[client_ip] = [
            t for t in self.requests[client_ip]
            if current_time - t < self.time_window
        ]
        # 检查是否超过限制
        if len(self.requests[client_ip]) >= self.max_requests:
            return False
        self.requests[client_ip].append(current_time)
        return True

rate_limiter = RateLimiter(max_requests=100, time_window=60)  # 每分钟最多 100 次请求

# ==============================================
# 模型配置
# ==============================================

MODEL_PATH = os.path.join(os.path.dirname(__file__), "public", "models", "mindbloom-final")
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# 输入验证配置
MAX_INPUT_LENGTH = 512  # 最大输入长度
MIN_INPUT_LENGTH = 1    # 最小输入长度

# 全局变量存储模型和 tokenizer
tokenizer = None
model = None
labels = None

# ==============================================
# 数据模型
# ==============================================

class EmotionRequest(BaseModel):
    text: str = Field(
        ..., 
        min_length=MIN_INPUT_LENGTH, 
        max_length=MAX_INPUT_LENGTH,
        description="要分析情绪的文本"
    )

class EmotionResponse(BaseModel):
    label: str
    confidence: float
    all_scores: dict

# ==============================================
# 中间件
# ==============================================

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """速率限制中间件"""
    # 获取客户端 IP（考虑代理）
    client_ip = request.client.host
    if "x-forwarded-for" in request.headers:
        client_ip = request.headers["x-forwarded-for"].split(",")[0].strip()
    
    # 检查速率限制
    if not rate_limiter.is_allowed(client_ip):
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests, please try again later."}
        )
    
    response = await call_next(request)
    return response

# ==============================================
# 异常处理
# ==============================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理器 - 不暴露内部错误信息"""
    logger.error(f"Internal error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# ==============================================
# 模型加载
# ==============================================

def load_model():
    """加载模型和 tokenizer"""
    global tokenizer, model, labels
    
    print(f"Loading model from {MODEL_PATH} on {DEVICE}...")
    logger.info(f"Loading model from {MODEL_PATH} on {DEVICE}")
    
    try:
        # 加载 tokenizer
        tokenizer = BertTokenizer.from_pretrained(MODEL_PATH)
        
        # 加载模型
        model = BertForSequenceClassification.from_pretrained(MODEL_PATH)
        model.to(DEVICE)
        model.eval()
        
        # 加载标签
        labels_path = os.path.join(MODEL_PATH, "labels.json")
        if not os.path.exists(labels_path):
            raise FileNotFoundError(f"Labels file not found at {labels_path}")
        
        with open(labels_path, "r", encoding="utf-8") as f:
            labels = json.load(f)
        
        print("Model loaded successfully!")
        logger.info("Model loaded successfully")
        
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise

@app.on_event("startup")
async def startup_event():
    """启动时加载模型"""
    load_model()

# ==============================================
# API 路由
# ==============================================

@app.get("/")
async def root():
    """健康检查端点"""
    return {
        "message": "MindBloom Emotion Analysis API",
        "status": "running",
        "labels": list(labels["id2label"].values()) if labels else []
    }

@app.post("/analyze", response_model=EmotionResponse)
async def analyze_emotion(request: EmotionRequest):
    """分析文本情绪"""
    # 输入验证（Pydantic 已处理基本验证，这里添加额外检查）
    text = request.text.strip()
    
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    if len(text) > MAX_INPUT_LENGTH:
        raise HTTPException(
            status_code=400, 
            detail=f"Text exceeds maximum length of {MAX_INPUT_LENGTH} characters"
        )
    
    try:
        # 编码输入
        inputs = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=MAX_INPUT_LENGTH
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
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Analysis failed")

@app.post("/batch-analyze")
async def batch_analyze(request: EmotionRequest):
    """批量分析情绪"""
    return await analyze_emotion(request)

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy" if model is not None else "unhealthy",
        "device": str(DEVICE)
    }

# ==============================================
# 启动脚本
# ==============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info"
    )