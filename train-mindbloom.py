import json
import torch
import pandas as pd
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    Trainer,
    TrainingArguments
)

# ==============================================
# 1. 加载数据集
# ==============================================
print("📊 加载数据集...")
with open("mindbloom-emotion-dataset.json", "r", encoding="utf-8") as f:
    data = json.load(f)

df = pd.DataFrame(data)
labels = sorted(list(df["label"].unique()))
label2id = {l: i for i, l in enumerate(labels)}
id2label = {i: l for i, l in enumerate(labels)}

print(f"✅ 数据集加载完成，共 {len(df)} 条")
print(f"情绪标签：{labels}")

# ==============================================
# 2. 选择轻量中文模型（适合导出到前端）
# ==============================================
print("🧠 加载模型...")
model_name = "uer/chinese-roberta-wwm-ext-tiny"  # 超轻量，速度快，适合本地
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(
    model_name,
    num_labels=len(labels),
    id2label=id2label,
    label2id=label2id
)

# ==============================================
# 3. 数据预处理
# ==============================================
def tokenize_function(examples):
    return tokenizer(
        examples["text"],
        padding="max_length",
        truncation=True,
        max_length=64
    )

class SimpleDataset(torch.utils.data.Dataset):
    def __init__(self, df):
        self.df = df
        self.encodings = tokenize_function(df.to_dict(orient="list"))
    
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

train_dataset = SimpleDataset(df)

# ==============================================
# 4. 训练配置
# ==============================================
training_args = TrainingArguments(
    output_dir="./mindbloom-trained-model",
    per_device_train_batch_size=8,
    num_train_epochs=15,
    logging_steps=10,
    learning_rate=2e-5,
    save_strategy="epoch",
    logging_dir="./logs",
)

# ==============================================
# 5. 开始训练
# ==============================================
print("🚀 开始训练...")
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
)

trainer.train()

# ==============================================
# 6. 保存最终模型
# ==============================================
model.save_pretrained("./mindbloom-final-model")
tokenizer.save_pretrained("./mindbloom-final-model")
print("✅ 训练完成！模型已保存到 ./mindbloom-final-model")