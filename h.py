import numpy as np
import matplotlib.pyplot as plt
from scipy.signal import spectrogram, chirp
from scipy.ndimage import gaussian_filter1d

# 设置绘图风格
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']  # 支持中文显示
plt.rcParams['axes.unicode_minus'] = False

# --- 1. 参数设置 ---
fs = 44100  # 采样率
duration = 2.0  # 时长 (秒)
t = np.linspace(0, duration, int(fs * duration), endpoint=False)

# --- 2. 生成模拟音频信号 ---

def generate_calm_voice(t, fs):
    """
    模拟平静对话：
    - 基频稳定 (约 150Hz)
    - 叠加几个主要的共振峰 (Formants)
    - 振幅适中且平滑
    - 加入少量背景噪声
    """
    f0 = 150  # 基频
    # 合成基频和谐波
    signal = 0.5 * np.sin(2 * np.pi * f0 * t)
    signal += 0.2 * np.sin(2 * np.pi * (f0 * 2) * t)
    signal += 0.1 * np.sin(2 * np.pi * (f0 * 3) * t)
    
    # 模拟共振峰 (简化为固定频率的正弦波叠加)
    signal += 0.15 * np.sin(2 * np.pi * 800 * t)  # F1
    signal += 0.1 * np.sin(2 * np.pi * 1500 * t)  # F2
    
    # 振幅包络：模拟说话的节奏，缓慢变化
    envelope = 0.6 + 0.4 * np.sin(2 * np.pi * 2 * t) # 2Hz 的语调变化
    signal *= envelope
    
    # 添加少量高斯噪声
    noise = np.random.normal(0, 0.02, len(t))
    return signal + noise

def generate_scream_voice(t, fs):
    """
    模拟尖叫/求救：
    - 基频极高且快速变化 (滑音/Chirp)
    - 包含大量高频谐波和非线性失真
    - 振幅极大
    - 频谱宽且杂乱
    """
    # 使用 Chirp 信号模拟尖叫时音调的快速拉升和不稳定
    # 从 800Hz 快速扫频到 3000Hz
    f_start, f_end = 800, 3000
    signal = chirp(t, f0=f_start, f1=f_end, t1=duration, method='linear')
    
    # 叠加高频噪声模拟嘶吼感 (宽带噪声)
    noise = np.random.normal(0, 0.3, len(t))
    
    # 叠加一些不和谐的泛音
    signal += 0.5 * np.sin(2 * np.pi * 4000 * t)
    signal += 0.3 * np.sin(2 * np.pi * 6000 * t)
    
    # 振幅极大，并带有剧烈的颤动
    envelope = 0.9 + 0.1 * np.sin(2 * np.pi * 15 * t) # 15Hz 的剧烈抖动
    signal *= envelope
    
    # 混合噪声和主信号
    return signal * 0.8 + noise * 0.4

# 生成数据
signal_calm = generate_calm_voice(t, fs)
signal_scream = generate_scream_voice(t, fs)

# 归一化以防绘图溢出 (仅用于显示，不改变相对特征)
signal_calm = signal_calm / np.max(np.abs(signal_calm))
signal_scream = signal_scream / np.max(np.abs(signal_scream))

# --- 3. 计算声谱图 ---
nperseg = 1024
f_calm, t_spec, Sxx_calm = spectrogram(signal_calm, fs, nperseg=nperseg)
f_scream, t_spec, Sxx_scream = spectrogram(signal_scream, fs, nperseg=nperseg)

# 转换为分贝 (dB)
Sxx_calm_db = 10 * np.log10(Sxx_calm + 1e-10)
Sxx_scream_db = 10 * np.log10(Sxx_scream + 1e-10)

# --- 4. 绘图 ---
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle('听觉情绪对比：平静对话 vs. 尖叫/求救 (波形与声谱图)', fontsize=16, fontweight='bold')

# --- 第一行：平静对话 ---
axes[0, 0].plot(t, signal_calm, color='blue', linewidth=0.8)
axes[0, 0].set_title('平静对话 - 时域波形 (Time Domain)', fontsize=12)
axes[0, 0].set_xlabel('时间 (s)')
axes[0, 0].set_ylabel('振幅')
axes[0, 0].set_ylim(-1.2, 1.2)
axes[0, 0].grid(True, alpha=0.3)

im0 = axes[0, 1].pcolormesh(t_spec, f_calm, Sxx_calm_db, shading='gouraud', cmap='viridis')
axes[0, 1].set_title('平静对话 - 声谱图 (Frequency Domain)', fontsize=12)
axes[0, 1].set_ylabel('频率 (Hz)')
axes[0, 1].set_xlabel('时间 (s)')
axes[0, 1].set_ylim(0, 5000)  # 聚焦于人声主要频段
fig.colorbar(im0, ax=axes[0, 1], label='强度 (dB)')

# --- 第二行：尖叫/求救 ---
axes[1, 0].plot(t, signal_scream, color='red', linewidth=0.8)
axes[1, 0].set_title('尖叫/求救 - 时域波形 (Time Domain)', fontsize=12)
axes[1, 0].set_xlabel('时间 (s)')
axes[1, 0].set_ylabel('振幅')
axes[1, 0].set_ylim(-1.2, 1.2)
axes[1, 0].grid(True, alpha=0.3)

im1 = axes[1, 1].pcolormesh(t_spec, f_scream, Sxx_scream_db, shading='gouraud', cmap='inferno')
axes[1, 1].set_title('尖叫/求救 - 声谱图 (Frequency Domain)', fontsize=12)
axes[1, 1].set_ylabel('频率 (Hz)')
axes[1, 1].set_xlabel('时间 (s)')
axes[1, 1].set_ylim(0, 10000)  # 尖叫包含更多高频
fig.colorbar(im1, ax=axes[1, 1], label='强度 (dB)')

plt.tight_layout(rect=[0, 0.03, 1, 0.95])
plt.show()