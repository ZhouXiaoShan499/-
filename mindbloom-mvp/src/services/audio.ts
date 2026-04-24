/**
 * 游戏音频服务
 * 提供气球捏破音效等功能
 */

// 全局 AudioContext 单例，避免资源泄漏
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  return audioContext;
};

/**
 * 播放气球捏破音效
 * 使用 Web Audio API 生成简单的 pop 声音
 * 使用全局 AudioContext 单例，避免资源泄漏
 */
export const playPopSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  // 如果上下文被挂起，恢复它
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
  
  // 自动清理：在声音播放完成后断开连接
  setTimeout(() => {
    osc.disconnect();
    gain.disconnect();
  }, 200);
};

/**
 * 清理音频资源（在应用卸载时调用）
 */
export const cleanupAudio = () => {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
};

/**
 * 播放治愈文字出现音效（预留）
 * 未来可以添加更丰富的音效
 */
export const playHealingTextSound = () => {
  // TODO: 实现治愈文字出现音效
};