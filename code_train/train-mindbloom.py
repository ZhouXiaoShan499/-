import os
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"
import json
import torch
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    Trainer, TrainingArguments
)

# ==============================================
# 1. 配置
# ==============================================
DATA_PATH = "mindbloom-emotion-dataset-extended.json"
MODEL_NAME = "hfl/rbt3"  # 轻量中文 BERT，效果最好
MAX_LEN = 64
BATCH_SIZE = 8
EPOCHS = 5
LR = 2e-5

# ==============================================
# 2. 加载数据集
# ==============================================
print("📊 加载数据集...")
with open(DATA_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

df = pd.DataFrame(data)
labels = sorted(list(df["label"].unique()))
label2id = {l: i for i, l in enumerate(labels)}
id2label = {i: l for i, l in enumerate(labels)}

print(f"✅ 数据集加载完成，共 {len(df)} 条")
print(f"情绪标签：{labels}")

# ==============================================
# 3. 划分训练集 / 测试集
# ==============================================
train_df, test_df = train_test_split(
    df, test_size=0.1, random_state=42, stratify=df["label"]
)

# ==============================================
# 4. 加载模型和分词器
# ==============================================
print("🧠 加载模型...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME,
    num_labels=len(labels),
    id2label=id2label,
    label2id=label2id
)

# ==============================================
# 5. 数据预处理
# ==============================================
class EmotionDataset(torch.utils.data.Dataset):
    def __init__(self, df):
        self.df = df
        self.encodings = tokenizer(
            df["text"].tolist(),
            padding="max_length",
            truncation=True,
            max_length=MAX_LEN
        )
    
    def __len__(self):
        return len(self.df)
    
    def __getitem__(self, idx):
        item = {
            key: torch.tensor(val[idx])
            for key, val in self.encodings.items()
        }
        item["labels"] = torch.tensor(
            label2id[self.df.iloc[idx]["label"]]
        )
        return item

train_dataset = EmotionDataset(train_df)
test_dataset = EmotionDataset(test_df)

# ==============================================
# 6. 定义评估指标（准确率 + F1）
# ==============================================
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)
    acc = accuracy_score(labels, predictions)
    f1 = f1_score(labels, predictions, average="weighted")
    return {"accuracy": acc, "f1": f1}

# ==============================================
# 7. 训练配置
# ==============================================
training_args = TrainingArguments(
    output_dir="./mindbloom-checkpoints",
    per_device_train_batch_size=BATCH_SIZE,
    per_device_eval_batch_size=BATCH_SIZE,
    num_train_epochs=EPOCHS,
    learning_rate=LR,
    logging_steps=10,
    save_strategy="epoch",
    evaluation_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="eval_accuracy",
    greater_is_better=True,
    logging_dir="./logs",
    report_to="none",
)

# ==============================================
# 8. 开始训练
# ==============================================
print("🚀 开始训练...")
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=test_dataset,
    compute_metrics=compute_metrics,
)

train_result = trainer.train()

# ==============================================
# 9. 可视化（画 Loss 和 Accuracy 曲线）
# ==============================================
print("📈 生成可视化...")
history = trainer.state.log_history

# 提取数据
train_loss = [x["loss"] for x in history if "loss" in x]
eval_loss = [x["eval_loss"] for x in history if "eval_loss" in x]
eval_acc = [x["eval_accuracy"] for x in history if "eval_accuracy" in x]
steps = [x["step"] for x in history if "loss" in x]
eval_steps = [x["step"] for x in history if "eval_loss" in x]

# 画图
plt.figure(figsize=(12, 5))

# Loss 曲线
plt.subplot(1, 2, 1)
plt.plot(steps, train_loss, label="Train Loss", marker="o")
plt.plot(eval_steps, eval_loss, label="Eval Loss", marker="s")
plt.xlabel("Step")
plt.ylabel("Loss")
plt.title("Loss Curve")
plt.legend()
plt.grid(True)

# Accuracy 曲线
plt.subplot(1, 2, 2)
plt.plot(eval_steps, eval_acc, label="Eval Accuracy", marker="o", color="orange")
plt.xlabel("Step")
plt.ylabel("Accuracy")
plt.title("Accuracy Curve")
plt.legend()
plt.grid(True)

plt.tight_layout()
plt.savefig("./training_curves.png", dpi=300)
print("✅ 可视化已保存为 training_curves.png")

# ==============================================
# 10. 保存最佳模型
# ==============================================
print("💾 保存最佳模型...")
model.save_pretrained("./mindbloom-best-model")
tokenizer.save_pretrained("./mindbloom-best-model")

# 保存标签映射
with open("./mindbloom-best-model/labels.json", "w", encoding="utf-8") as f:
    json.dump({
        "label2id": label2id,
        "id2label": id2label,
        "labels": labels
    }, f, ensure_ascii=False, indent=2)

# 保存最终评估结果
final_eval = trainer.evaluate()
with open("./mindbloom-best-model/eval_results.json", "w", encoding="utf-8") as f:
    json.dump(final_eval, f, ensure_ascii=False, indent=2)

print("\n" + "="*50)
print("🎉 训练完成！")
print(f"✅ 最佳模型已保存到：./mindbloom-best-model")
print(f"✅ 可视化曲线已保存到：./training_curves.png")
print(f"✅ 最终准确率：{final_eval['eval_accuracy']:.4f}")
print(f"✅ 最终 F1 分数：{final_eval['eval_f1']:.4f}")
print("="*50)