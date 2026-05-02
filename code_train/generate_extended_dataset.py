# generate_extended_dataset.py
import json
import random
from faker import Faker

# 初始化中文假数据生成器
fake = Faker("zh_CN")

# 自有情绪标签（核心10类）
EMOTION_LABELS = ["焦虑", "迷茫", "自我否定", "孤独", "忧郁", "疲惫", "愤怒", "平静", "快乐", "内耗"]

# 文本模板（贴近日常场景，可扩展更多）
TEXT_TEMPLATES = [
    "最近{场景}压力好大，{身体感受}，感觉{情绪1}又{情绪2}",
    "{时间}一个人{行为}，心里{感受}，总是{情绪1}，偶尔还会{情绪2}",
    "和{人物}发生了{事件}，整个人都{情绪1}，连带着{情绪2}，什么都不想做",
    "{日常场景}，{状态}，既觉得{情绪1}，又有点{情绪3}",
]
# 填充词库（提升文本真实感）
SCENARIOS = ["工作", "学习", "考试", "项目", "求职"]
BODY_FEELINGS = ["晚上失眠", "头疼", "心慌", "浑身没力气", "提不起精神"]
TIMES = ["晚上", "周末", "清晨", "深夜", "下班"]
ACTIONS = ["在家", "散步", "刷手机", "看书", "吃饭"]
FEELINGS = ["空空的", "堵得慌", "乱糟糟的", "很踏实", "闷闷的"]
PEOPLE = ["领导", "朋友", "家人", "同事", "室友"]
EVENTS = ["争执", "误会", "开心的聊天", "被批评", "收到礼物"]
DAILY_SCENARIOS = ["下班回家", "周末独处", "过节放假", "早起上班"]
STATES = ["加班到深夜", "复习到凌晨", "躺了一整天", "忙了一上午"]

def generate_emotion_text():
    """生成单条多标签情绪文本"""
    # 随机选模板 + 填充变量
    template = random.choice(TEXT_TEMPLATES)
    filled_text = template.replace("{场景}", random.choice(SCENARIOS))\
                          .replace("{身体感受}", random.choice(BODY_FEELINGS))\
                          .replace("{时间}", random.choice(TIMES))\
                          .replace("{行为}", random.choice(ACTIONS))\
                          .replace("{感受}", random.choice(FEELINGS))\
                          .replace("{人物}", random.choice(PEOPLE))\
                          .replace("{事件}", random.choice(EVENTS))\
                          .replace("{日常场景}", random.choice(DAILY_SCENARIOS))\
                          .replace("{状态}", random.choice(STATES))
    # 随机选1-3个情绪标签（多标签核心）
    num_labels = random.randint(1, 3)
    selected_labels = random.sample(EMOTION_LABELS, num_labels)
    return {
        "text": filled_text,
        "label": selected_labels
    }

# 1. 加载原有数据集并转为多标签格式
with open("mindbloom-emotion-dataset.json", "r", encoding="utf-8") as f:
    original_data = json.load(f)
    extended_data = [{
        "text": item["text"],
        "label": [item["label"]]  # 单标签→多标签格式
    } for item in original_data]

# 2. 生成4500条新数据（最终总数≈4600，可再补充公开数据到5000+）
for _ in range(4500):
    extended_data.append(generate_emotion_text())

# 3. 去重 + 保存
unique_texts = set()
final_data = []
for item in extended_data:
    if item["text"] not in unique_texts:
        unique_texts.add(item["text"])
        final_data.append(item)

with open("mindbloom-emotion-dataset-extended.json", "w", encoding="utf-8") as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)

print(f"✅ 扩充完成！数据集共 {len(final_data)} 条，示例：")
print(final_data[-1])