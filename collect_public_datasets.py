"""
MindBloom 公开数据集收集工具
从 HuggingFace 和其他公开源收集情感数据集，并转换为 MindBloom 格式
"""

import json
import os
import sys
from typing import List, Dict, Optional
from collections import Counter

# MindBloom 目标标签体系
MINDBLOOM_LABELS = ["焦虑", "迷茫", "自我否定", "孤独", "忧郁", "疲惫", "愤怒", "平静", "快乐", "内耗"]

# 英文情绪标签到 MindBloom 标签的映射
EMOTION_MAPPING = {
    # GoEmotions 标签映射
    "admiration": "快乐",
    "amusement": "快乐",
    "anger": "愤怒",
    "anxiety": "焦虑",
    "compassion": "忧郁",
    "confusion": "迷茫",
    "curiosity": "迷茫",
    "disappointment": "忧郁",
    "disgust": "愤怒",
    "embarrassment": "焦虑",
    "excitement": "快乐",
    "fear": "焦虑",
    "gratitude": "快乐",
    "grief": "忧郁",
    "joy": "快乐",
    "love": "快乐",
    "nervousness": "焦虑",
    "optimism": "平静",
    "pride": "快乐",
    "realization": "迷茫",
    "relief": "平静",
    "sadness": "忧郁",
    "surprise": "迷茫",
    
    # Mohammad 数据集标签映射
    "joy": "快乐",
    "sadness": "忧郁",
    "anger": "愤怒",
    "fear": "焦虑",
    "disgust": "愤怒",
    "surprise": "迷茫",
}


def ensure_dataset_dir() -> str:
    """确保数据集目录存在"""
    dataset_dir = "collected-datasets"
    os.makedirs(dataset_dir, exist_ok=True)
    return dataset_dir


def load_existing_dataset(filepath: str) -> List[Dict]:
    """加载已存在的数据集"""
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def append_to_dataset(dataset: List[Dict], filepath: str):
    """追加数据到数据集文件"""
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)


def check_huggingface_datasets() -> bool:
    """检查是否安装了 datasets 库"""
    try:
        from datasets import load_dataset
        return True
    except ImportError:
        print("⚠️  未安装 datasets 库")
        print("请运行: pip install datasets")
        return False


def collect_goemotions(output_path: str, max_samples_per_label: int = 100):
    """
    收集 GoEmotions 数据集
    来源: https://huggingface.co/datasets/google-research-datasets/goemotions
    """
    if not check_huggingface_datasets():
        print("⏭️  跳过 GoEmotions 收集（需要先安装 datasets 库）")
        return 0
    
    from datasets import load_dataset
    
    print("\n📊 正在收集 GoEmotions 数据集...")
    print(f"   来源: google-research-datasets/goemotions")
    
    try:
        # 加载数据集
        dataset = load_dataset("google-research-datasets/goemotions", split=["train", "validation"])
        train_data = dataset["train"]
        val_data = dataset["validation"]
        
        # 合并并限制数量
        all_data = list(train_data) + list(val_data)
        
        # 统计各标签数量
        label_counts = Counter(item["label"] for item in all_data)
        print(f"   原始数据: {len(all_data)} 条")
        print(f"   标签分布: {dict(label_counts)}")
        
        # 转换为 MindBloom 格式
        mindbloom_data = []
        label_sample_counts = Counter()
        
        for item in all_data:
            emotion = item["label"]
            if emotion in EMOTION_MAPPING:
                target_label = EMOTION_MAPPING[emotion]
                if label_sample_counts[target_label] < max_samples_per_label:
                    mindbloom_data.append({
                        "text": item["text"],
                        "label": target_label,
                        "source": "goemotions",
                        "original_label": emotion
                    })
                    label_sample_counts[target_label] += 1
        
        # 追加到数据集
        existing = load_existing_dataset(output_path)
        existing.extend(mindbloom_data)
        append_to_dataset(existing, output_path)
        
        print(f"   ✅ 转换后: {len(mindbloom_data)} 条")
        return len(mindbloom_data)
        
    except Exception as e:
        print(f"   ❌ 收集失败: {e}")
        return 0


def collect_mohammad_emotion(output_path: str, max_samples_per_label: int = 100):
    """
    收集 Mohammad Emotion Dataset
    来源: https://huggingface.co/datasets/mbpp/emotion_dataset
    """
    if not check_huggingface_datasets():
        print("⏭️  跳过 Mohammad Emotion 收集（需要先安装 datasets 库）")
        return 0
    
    from datasets import load_dataset
    
    print("\n📊 正在收集 Mohammad Emotion Dataset...")
    print(f"   来源: mbpp/emotion_dataset")
    
    try:
        dataset = load_dataset("mbpp/emotion_dataset", split=["train", "validation"])
        all_data = list(dataset["train"]) + list(dataset["validation"])
        
        print(f"   原始数据: {len(all_data)} 条")
        
        # 转换为 MindBloom 格式
        mindbloom_data = []
        label_sample_counts = Counter()
        
        for item in all_data:
            emotion = item.get("emotion", item.get("label", ""))
            if emotion in EMOTION_MAPPING:
                target_label = EMOTION_MAPPING[emotion]
                if label_sample_counts[target_label] < max_samples_per_label:
                    mindbloom_data.append({
                        "text": item.get("text", ""),
                        "label": target_label,
                        "source": "mohammad_emotion",
                        "original_label": emotion
                    })
                    label_sample_counts[target_label] += 1
        
        # 追加到数据集
        existing = load_existing_dataset(output_path)
        existing.extend(mindbloom_data)
        append_to_dataset(existing, output_path)
        
        print(f"   ✅ 转换后: {len(mindbloom_data)} 条")
        return len(mindbloom_data)
        
    except Exception as e:
        print(f"   ❌ 收集失败: {e}")
        return 0


def collect_chnsenticorp(output_path: str, max_samples: int = 500):
    """
    收集 ChnSentiCorp 中文情感评论数据集
    来源: https://huggingface.co/datasets/lhoestn/chnsenticorp
    """
    if not check_huggingface_datasets():
        print("⏭️  跳过 ChnSentiCorp 收集（需要先安装 datasets 库）")
        return 0
    
    from datasets import load_dataset
    
    print("\n📊 正在收集 ChnSentiCorp 数据集...")
    print(f"   来源: lhoestn/chnsenticorp")
    
    try:
        dataset = load_dataset("lhoestn/chnsenticorp", split=["train", "validation", "test"])
        all_data = list(dataset["train"]) + list(dataset["validation"]) + list(dataset["test"])
        
        print(f"   原始数据: {len(all_data)} 条")
        
        # ChnSentiCorp 是正面/负面分类，需要映射
        # 正面 -> 快乐/平静
        # 负面 -> 根据内容判断（这里简化处理）
        mindbloom_data = []
        
        for item in all_data[:max_samples]:
            label = item.get("label", 0)  # 1=正面, 0=负面
            text = item.get("text", "")
            
            if label == 1:  # 正面
                target_label = "快乐" if len(mindbloom_data) % 2 == 0 else "平静"
            else:  # 负面
                target_label = ["焦虑", "忧郁", "愤怒", "疲惫"][len(mindbloom_data) % 4]
            
            mindbloom_data.append({
                "text": text,
                "label": target_label,
                "source": "chnsenticorp",
                "original_label": "positive" if label == 1 else "negative"
            })
        
        # 追加到数据集
        existing = load_existing_dataset(output_path)
        existing.extend(mindbloom_data)
        append_to_dataset(existing, output_path)
        
        print(f"   ✅ 转换后: {len(mindbloom_data)} 条")
        return len(mindbloom_data)
        
    except Exception as e:
        print(f"   ❌ 收集失败: {e}")
        return 0


def collect_ocnli(output_path: str, max_samples_per_label: int = 100):
    """
    收集 OCNLI 开源中文自然语言推理数据集
    来源: https://huggingface.co/datasets/cltl/Ocnli
    """
    if not check_huggingface_datasets():
        print("⏭️  跳过 OCNLI 收集（需要先安装 datasets 库）")
        return 0
    
    from datasets import load_dataset
    
    print("\n📊 正在收集 OCNLI 数据集...")
    print(f"   来源: cltl/Ocnli")
    
    try:
        dataset = load_dataset("cltl/Ocnli", split=["train", "validation"])
        all_data = list(dataset["train"]) + list(dataset["validation"])
        
        print(f"   原始数据: {len(all_data)} 条")
        
        # OCNLI 是 NLI 任务，标签为 0=蕴含, 1=矛盾, 2=中立
        # 这里我们使用 premise（前提）文本，根据内容分配情绪标签
        mindbloom_data = []
        label_sample_counts = Counter()
        
        for item in all_data:
            premise = item.get("premise", "")
            label = item.get("label", 2)
            
            # 简单启发式：根据标签和文本内容分配情绪
            if label == 0:  # 蕴含 - 通常是中性/正面
                if "开心" in premise or "快乐" in premise or "好" in premise:
                    target_label = "快乐"
                elif "平静" in premise or "安静" in premise:
                    target_label = "平静"
                else:
                    continue  # 跳过不明确的内容
            elif label == 1:  # 矛盾 - 可能包含负面情绪
                if "焦虑" in premise or "担心" in premise or "害怕" in premise:
                    target_label = "焦虑"
                elif "难过" in premise or "伤心" in premise or "孤独" in premise:
                    target_label = "忧郁"
                elif "生气" in premise or "愤怒" in premise:
                    target_label = "愤怒"
                else:
                    continue
            else:  # 中立
                continue
            
            if label_sample_counts[target_label] < max_samples_per_label:
                mindbloom_data.append({
                    "text": premise,
                    "label": target_label,
                    "source": "ocnli",
                    "original_label": ["蕴含", "矛盾", "中立"][label]
                })
                label_sample_counts[target_label] += 1
        
        # 追加到数据集
        existing = load_existing_dataset(output_path)
        existing.extend(mindbloom_data)
        append_to_dataset(existing, output_path)
        
        print(f"   ✅ 转换后: {len(mindbloom_data)} 条")
        return len(mindbloom_data)
        
    except Exception as e:
        print(f"   ❌ 收集失败: {e}")
        return 0


def generate_quality_report(dataset_path: str):
    """生成数据集质量报告"""
    if not os.path.exists(dataset_path):
        print(f"❌ 数据集文件不存在: {dataset_path}")
        return
    
    with open(dataset_path, "r", encoding="utf-8") as f:
        dataset = json.load(f)
    
    print("\n" + "="*50)
    print("📊 数据集质量报告")
    print("="*50)
    print(f"总样本数: {len(dataset)}")
    
    # 标签分布
    label_dist = Counter(item["label"] for item in dataset)
    print("\n标签分布:")
    for label in MINDBLOOM_LABELS:
        count = label_dist.get(label, 0)
        bar = "█" * (count // 10)
        print(f"  {label:6s}: {count:5d} {bar}")
    
    # 数据源分布
    source_dist = Counter(item.get("source", "unknown") for item in dataset)
    print("\n数据源分布:")
    for source, count in source_dist.items():
        print(f"  {source}: {count}")
    
    # 文本长度统计
    lengths = [len(item["text"]) for item in dataset]
    print(f"\n文本长度统计:")
    print(f"  平均: {sum(lengths)/len(lengths):.1f} 字符")
    print(f"  最短: {min(lengths)} 字符")
    print(f"  最长: {max(lengths)} 字符")
    
    # 去重统计
    unique_texts = set(item["text"] for item in dataset)
    print(f"\n去重统计:")
    print(f"  原始: {len(dataset)} 条")
    print(f"  唯一: {len(unique_texts)} 条")
    print(f"  重复: {len(dataset) - len(unique_texts)} 条")
    
    # 检查标签均衡性
    counts = list(label_dist.values())
    if counts and max(counts) > min(counts) * 3 and min(counts) > 0:
        print("\n⚠️  警告：标签分布不均衡！")
        print(f"   最多: {max(counts)}, 最少: {min(counts)}")


def main():
    """主函数"""
    print("="*50)
    print("MindBloom 公开数据集收集工具")
    print("="*50)
    
    dataset_dir = ensure_dataset_dir()
    output_path = os.path.join(dataset_dir, "mindbloom-collected-dataset.json")
    
    # 收集各数据集
    total_collected = 0
    total_collected += collect_goemotions(output_path, max_samples_per_label=100)
    total_collected += collect_mohammad_emotion(output_path, max_samples_per_label=100)
    total_collected += collect_chnsenticorp(output_path, max_samples=500)
    total_collected += collect_ocnli(output_path, max_samples_per_label=100)
    
    # 生成质量报告
    generate_quality_report(output_path)
    
    print(f"\n{'='*50}")
    print(f"✅ 收集完成！共收集 {total_collected} 条新数据")
    print(f"📁 数据集保存在: {output_path}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()