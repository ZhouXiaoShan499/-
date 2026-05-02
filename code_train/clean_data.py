import json
import pandas as pd

# 路径（请确保TSV文件和这个脚本在同一个文件夹，或者写绝对路径）
TSV_PATH = "datases/emotion_classification.tsv" 
OUTPUT = "mindbloom_emotion_ready.json"

# 你的10个标签
YOUR_LABELS = ["焦虑","迷茫","自我否定","孤独","忧郁","疲惫","愤怒","平静","快乐","内耗"]

# 原标签 -> 你的标签映射
LABEL_MAP = {
    "高兴": ["快乐"],
    "喜爱": ["快乐","平静"],
    "惊讶": ["迷茫"],
    "愤怒": ["愤怒"],
    "厌恶": ["愤怒","内耗"],
    "悲伤": ["忧郁","孤独"],
    "恐惧": ["焦虑"],
}

# ============== 1. 修复读取错误 ==============
# 参数说明：
# on_bad_lines='skip'：跳过列数不对的坏行
# quoting=3：不把引号当作特殊字符（防止文本里的引号干扰）
df = pd.read_csv(
    TSV_PATH, 
    sep="\t", 
    header=None, 
    on_bad_lines='skip',  # 关键：跳过坏行
    quoting=3,             # 关键：忽略引号
    encoding='utf-8',      # 尝试utf-8
    engine='python'        # 用python引擎更稳定
)

# ============== 2. 内容清洗 ==============
clean_data = []
for _, row in df.iterrows():
    try:
        # 假设第2列是文本，第3列是标签（根据你的TSV实际情况调整索引）
        text = str(row[1]).strip()
        label = str(row[2]).strip()

        # 过滤规则
        if len(text) < 5: continue
        if "face_" in text or "妈的" in text or "傻逼" in text: continue
        if label not in LABEL_MAP: continue

        # 标签映射
        new_labels = LABEL_MAP[label]

        clean_data.append({
            "text": text,
            "label": new_labels
        })
    except:
        continue

# ============== 3. 保存 ==============
with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(clean_data, f, ensure_ascii=False, indent=2)

print(f"✅ 处理完成！")
print(f"✅ 原始行数: {len(df)}")
print(f"✅ 清洗后保留: {len(clean_data)}")
print(f"✅ 已保存至: {OUTPUT}")