// 兼容 Chrome / Edge / 微信内置浏览器
const SpeechRecognition =
  (window as any).SpeechRecognition ||
  (window as any).webkitSpeechRecognition;

export interface RecognitionOptions {
  onResult: (text: string) => void;
  onInterimResult?: (text: string) => void;
  onError?: (err: string) => void;
  onEnd?: () => void;
  lang?: string;
  continuous?: boolean;
  timeout?: number; // 自动超时停止时间 (ms), 默认 30 秒
}

let recognitionTimeout: ReturnType<typeof setTimeout> | null = null;

export const startRecognition = (
  options: RecognitionOptions | ((text: string) => void),
  onError?: (err: string) => void
) => {
  if (!SpeechRecognition) {
    onError?.("当前浏览器不支持语音输入");
    return null;
  }

  // 兼容旧版 API: 直接传入回调函数
  const config = typeof options === 'function' 
    ? { onResult: options, onError }
    : options;

  const recognition = new SpeechRecognition();
  recognition.lang = config.lang || "zh-CN";
  recognition.interimResults = true; // 启用中间结果
  recognition.maxAlternatives = 1;
  recognition.continuous = config.continuous || false;

  let finalTranscript = '';

  recognition.onresult = (e: any) => {
    let interimTranscript = '';
    
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const transcript = e.results[i][0].transcript;
      if (e.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    // 返回最终结果或中间结果
    if (finalTranscript) {
      config.onResult(finalTranscript);
    } else if (interimTranscript && config.onInterimResult) {
      config.onInterimResult(interimTranscript);
    }
  };

  recognition.onerror = (e: any) => {
    console.error("语音识别错误:", e.error);
    config.onError?.(e.error);
    clearRecognitionTimeout();
  };

  recognition.onend = () => {
    console.log("语音识别结束");
    clearRecognitionTimeout();
    config.onEnd?.();
  };

  recognition.start();

  // 设置超时自动停止
  if (config.timeout) {
    recognitionTimeout = setTimeout(() => {
      console.log("语音识别超时，自动停止");
      recognition.stop();
    }, config.timeout);
  }

  return recognition;
};

export const stopRecognition = (recognition: any) => {
  clearRecognitionTimeout();
  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {
      console.warn("停止语音识别时出错:", e);
    }
  }
};

const clearRecognitionTimeout = () => {
  if (recognitionTimeout) {
    clearTimeout(recognitionTimeout);
    recognitionTimeout = null;
  }
};

// 获取浏览器语音识别支持状态
export const isSpeechRecognitionSupported = () => {
  return !!SpeechRecognition;
};
