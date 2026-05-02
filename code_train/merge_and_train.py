"""
MindBloom 数据合并与训练脚本
合并所有数据源并训练最终模型
"""

import json
import os
import sys
import random
import hashlib
from collections import Counter
from typing import List, Dict

# MindBloom 目标标签体系
MINDBLOOM_LABELS = ["焦虑", "迷茫", "自我否定", "孤独", "忧郁", "疲惫", "愤怒", "平静", "快乐", "内耗"]


def load_json(filepath: str) -> List[Dict]:
    """加载 JSON 文件"""
    if not os.path.exists(filepath):
        print(f"⚠️  文件不存在: {filepath}")
        return []
    
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    print(f"📄 加载 {filepath}: {len(data)} 条")
    return data


def save_json(data: List[Dict], filepath: str):
    """保存 JSON 文件"""
    os.makedirs(os.path.dirname(filepath) or ".", exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"💾 保存到 {filepath}: {len(data)} 条")


def hash_text(text: str) -> str:
    """文本哈希用于去重"""
    return hashlib.md5(text.encode("utf-8")).hexdigest()


def deduplicate_dataset(dataset: List[Dict]) -> List[Dict]:
    """数据集去重"""
    print("\n🔄 正在去重...")
    seen_hashes = set()
    unique_data = []
    
    for item in dataset:
        text_hash = hash_text(item["text"])
        if text_hash not in seen_hashes:
            seen_hashes.add(text_hash)
            unique_data.append(item)
    
    print(f"   原始: {len(dataset)} 条")
    print(f"   去重后: {len(unique_data)} 条")
    print(f"   移除重复: {len(dataset) - len(unique_data)} 条")
    
    return unique_data


def balance_dataset(dataset: List[Dict], min_samples: int = 50, max_samples: int = 500) -> List[Dict]:
    """平衡数据集（每个标签样本数控制在 min-max 之间）"""
    print("\n⚖️  正在平衡数据集...")
    
    # 按标签分组
    by_label: Dict[str, List[Dict]] = Counter()
    for label in MINDBLOOM_LABELS:
        by_label[label] = []
    
    for item in dataset:
        label = item.get("label", "")
        if label in by_label:
            by_label[label].append(item)
    
    # 每个标签采样
    balanced_data = []
    for label in MINDBLOOM_LABELS:
        samples = by_label[label]
        random.shuffle(samples)
        
        if len(samples) < min_samples:
            print(f"   ⚠️  {label}: 仅 {len(samples)} 条（少于最小值）")
            balanced_data.extend(samples)
        elif len(samples) > max_samples:
            print(f"   ✂️  {label}: {len(samples)} → {max_samples} 条")
            balanced_data.extend(samples[:max_samples])
        else:
            print(f"   ✅ {label}: {len(samples)} 条（正常）")
            balanced_data.extend(samples)
    
    random.shuffle(balanced_data)
    return balanced_data


def generate_training_report(dataset: List[Dict], output_path: str):
    """生成训练报告"""
    print("\n" + "="*60)
    print("📊 数据集训练报告")
    print("="*60)
    
    # 基本信息
    print(f"总样本数: {len(dataset)}")
    
    # 标签分布
    label_dist = Counter(item["label"] for item in dataset)
    print("\n标签分布:")
    for label in MINDBLOOM_LABELS:
        count = label_dist.get(label, 0)
        percentage = (count / len(dataset) * 100) if dataset else 0
        bar = "█" * (count // 5)
        print(f"  {label:8s}: {count:5d} ({percentage:5.1f}%) {bar}")
    
    # 数据源分布
    source_dist = Counter(item.get("source", "unknown") for item in dataset)
    print("\n数据源分布:")
    for source, count in source_dist.items():
        print(f"  {source}: {count}")
    
    # 文本长度统计
    lengths = [len(item["text"]) for item in dataset]
    avg_length = sum(lengths) / len(lengths) if lengths else 0
    print(f"\n文本长度统计:")
    print(f"  平均: {avg_length:.1f} 字符")
    print(f"  最短: {min(lengths) if lengths else 0} 字符")
    print(f"  最长: {max(lengths) if lengths else 0} 字符")
    
    # 训练/验证/测试分割建议
    train_size = int(len(dataset) * 0.8)
    val_size = int(len(dataset) * 0.1)
    test_size = len(dataset) - train_size - val_size
    
    print(f"\n建议数据分割:")
    print(f"  训练集: {train_size} ({train_size/len(dataset)*100:.1f}%)")
    print(f"  验证集: {val_size} ({val_size/len(dataset)*100:.1f}%)")
    print(f"  测试集: {test_size} ({test_size/len(dataset)*100:.1f}%)")
    
    # 保存报告
    report = {
        "total_samples": len(dataset),
        "label_distribution": dict(label_dist),
        "source_distribution": dict(source_dist),
        "text_length": {
            "average": avg_length,
            "min": min(lengths) if lengths else 0,
            "max": max(lengths) if lengths else 0
        },
        "suggested_split": {
            "train": train_size,
            "validation": val_size,
            "test": test_size
        }
    }
    
    save_json(report, output_path)
    print(f"\n📄 报告已保存到: {output_path}")


def split_dataset(dataset: List[Dict], train_ratio=0.8, val_ratio=0.1, test_ratio=0.1) -> Dict[str, List[Dict]]:
    """分割数据集"""
    # 确保比例和为 1
    total = train_ratio + val_ratio + test_ratio
    train_ratio /= total
    val_ratio /= total
    test_ratio /= total
    
    # 打乱
    shuffled = dataset.copy()
    random.shuffle(shuffled)
    
    # 分割
    train_end = int(len(shuffled) * train_ratio)
    val_end = int(len(shuffled) * (train_ratio + val_ratio))
    
    return {
        "train": shuffled[:train_end],
        "validation": shuffled[train_end:val_end],
        "test": shuffled[val_end:]
    }


def main():
    """主函数"""
    print("="*60)
    print("MindBloom 数据合并与训练准备")
    print("="*60)
    
    # 设置随机种子
    random.seed(42)
    
    # 数据文件路径
    original_data = "mindbloom-emotion-dataset.json"
    extended_data = "mindbloom-emotion-dataset-extended.json"
    collected_dir = "collected-datasets"
    collected_data = os.path.join(collected_dir, "mindbloom-collected-dataset.json")
    
    # 输出路径
    merged_data = "mindbloom-merged-dataset.json"
    train_split = "mindbloom-train-dataset.json"
    val_split = "mindbloom-val-dataset.json"
    test_split = "mindbloom-test-dataset.json"
    report_path = "training-report.json"
    
    # 加载所有数据源
    print("\n📥 正在加载数据源...")
    
    all_data: List[Dict] = []
    
    # 1. 原始数据
    original = load_json(original_data)
    # 转换为统一格式
    for item in original:
        all_data.append({
            "text": item["text"],
            "label": item["label"],
            "source": "original"
        })
    
    # 2. 扩展数据（Faker 生成）
    if os.path.exists(extended_data):
        extended = load_json(extended_data)
        for item in extended:
            label = item["label"] if isinstance(item["label"], str) else item["label"][0] if item["label"] else "平静"
            all_data.append({
                "text": item["text"],
                "label": label,
                "source": "faker_extended"
            })
    
    # 3. 公开数据集
    if os.path.exists(collected_data):
        collected = load_json(collected_data)
        all_data.extend(collected)
    
    print(f"\n📊 合并后总计: {len(all_data)} 条")
    
    # 保存合并后的数据
    save_json(all_data, merged_data)
    
    # 去重
    all_data = deduplicate_dataset(all_data)
    
    # 平衡数据集
    all_data = balance_dataset(all_data, min_samples=30, max_samples=500)
    
    # 生成训练报告
    generate_training_report(all_data, report_path)
    
    # 分割数据集
    print("\n✂️  正在分割数据集...")
    splits = split_dataset(all_data)
    
    for split_name, split_data in splits.items():
        save_json(split_data, globals()[f"{split_name}_split"])
    
    # 最终总结
    print("\n" + "="*60)
    print("✅ 数据准备完成！")
    print("="*60)
    print(f"合并数据集: {merged_data} ({len(all_data)} 条)")
    print(f"训练集: {train_split} ({len(splits['train'])} 条)")
    print(f"验证集: {val_split} ({len(splits['validation'])} 条)")
    print(f"测试集: {test_split} ({len(splits['test'])} 条)")
    print(f"训练报告: {report_path}")
    print("="*60)
    
    # 下一步提示
    print("\n📌 下一步:")
    print("1. 检查 training-report.json 了解数据分布")
    print("2. 运行 train-mindbloom.py 训练模型")
    print("   注意: 需要更新 train-mindbloom.py 使用新的数据集路径")


if __name__ == "__main__":
    main()