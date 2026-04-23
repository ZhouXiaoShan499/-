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

// 使用 Map 管理多个识别实例的超时，避免泄漏
const recognitionTimeouts: Map<any, ReturnType<typeof setTimeout>> = new Map();

export interface RecognitionHandle {
  stop: () => void;
}

export const startRecognition = (
  options: RecognitionOptions | ((text: string) => void),
  onError?: (err: string) => void
): RecognitionHandle | null => {
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

  // 清理函数：清除超时并移除 Map 中的记录
  const cleanup = () => {
    const timeout = recognitionTimeouts.get(recognition);
    if (timeout) {
      clearTimeout(timeout);
      recognitionTimeouts.delete(recognition);
    }
  };

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
    cleanup();
  };

  recognition.onend = () => {
    console.log("语音识别结束");
    cleanup();
    config.onEnd?.();
  };

  recognition.start();

  // 设置超时自动停止
  if (config.timeout) {
    const timeout = setTimeout(() => {
      console.log("语音识别超时，自动停止");
      try {
        recognition.stop();
      } catch (e) {
        // 忽略错误
      }
    }, config.timeout);
    recognitionTimeouts.set(recognition, timeout);
  }

  // 返回 handle，允许外部主动停止
  return {
    stop: () => {
      cleanup();
      try {
        recognition.stop();
      } catch (e) {
        console.warn("停止语音识别时出错:", e);
      }
    }
  };
};

export const stopRecognition = (handle: RecognitionHandle | null) => {
  handle?.stop();
};

// 获取浏览器语音识别支持状态
export const isSpeechRecognitionSupported = () => {
  return !!SpeechRecognition;
};
