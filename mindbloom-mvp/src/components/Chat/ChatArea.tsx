import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Mic, MicOff, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { aiEngine, ContextAwareAnalysis } from '../../services/ai-engine';
import { startRecognition, stopRecognition, isSpeechRecognitionSupported } from '../../services/speech-recognition';
import { motion, AnimatePresence } from 'framer-motion';

const ChatArea: React.FC = () => {
  const { 
    getCurrentSession, 
    addMessage, 
    addCards,
    autoAddConnection,
    sessions,
    getFilteredMessages
  } = useStore();
  const session = getCurrentSession();
  const allMessages = session?.messages || [];
  const messages = getFilteredMessages();
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [supportStatus, setSupportStatus] = useState<boolean | null>(null);
  const [pendingAnalysis, setPendingAnalysis] = useState<ContextAwareAnalysis | null>(null);
  const [suggestedConnections, setSuggestedConnections] = useState<Array<{
    fromLabel: string;
    toLabel: string;
    reason: string;
  }>>([]);
  const [showConnectionSuggestions, setShowConnectionSuggestions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // 检查语音识别支持
  useEffect(() => {
    setSupportStatus(isSpeechRecognitionSupported());
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, interimText, suggestedConnections, allMessages]);

  // 语音输入处理
  const handleVoiceInput = () => {
    if (isRecording) {
      stopRecognition(recognitionRef.current);
      recognitionRef.current = null;
      setIsRecording(false);
      setInterimText('');
      return;
    }

    // 检查浏览器支持
    if (!isSpeechRecognitionSupported()) {
      alert('您的浏览器不支持语音输入，请使用 Chrome 或 Edge 浏览器');
      return;
    }

    startRecognition({
      onResult: (text) => {
        setInputValue(text);
        setIsRecording(false);
        recognitionRef.current = null;
        setInterimText('');
        inputRef.current?.focus();
      },
      onInterimResult: (text) => {
        setInterimText(text);
      },
      onError: (err) => {
        console.error("语音识别错误:", err);
        setIsRecording(false);
        recognitionRef.current = null;
        setInterimText('');
      },
      onEnd: () => {
        setIsRecording(false);
        recognitionRef.current = null;
        setInterimText('');
      },
      lang: 'zh-CN',
      timeout: 30000, // 30 秒超时
    });

    setIsRecording(true);
  };

  // 发送消息 - 上下文感知
  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    
    // 获取之前的用户消息作为上下文（使用全部消息，不是筛选后的）
    const previousMessages = allMessages.filter(m => m.sender === 'user');
    
    // 使用上下文感知分析
    const analysis = aiEngine.analyzeWithContext(userText, [
      ...previousMessages.map(m => ({ text: m.text, sender: m.sender })),
      { text: userText, sender: 'user' }
    ]);

    // 直接保存消息
    addMessage(userText, 'user', {
      labels: analysis.labels,
      keywords: analysis.keywords,
      intensity: analysis.intensity,
      isNegativeEmotion: analysis.isNegativeEmotion
    });
    
    // 添加情绪卡片
    addCards(analysis.labels, analysis.keywords, analysis.labels[0]);
    
    // 处理建议的连接
    if (analysis.suggestedConnections.length > 0) {
      setSuggestedConnections(analysis.suggestedConnections);
      setShowConnectionSuggestions(true);
    }
    
    // AI 回复
    setTimeout(() => {
      let aiResponse = analysis.response;
      
      // 如果有上下文引用，在回复中体现
      if (analysis.contextReferences.length > 0) {
        aiResponse = analysis.followUpQuestion || aiResponse;
      }
      
      addMessage(aiResponse, 'ai');
    }, 800 + Math.random() * 400);
    
    setInputValue('');
  };

  // 接受建议连接
  const handleAcceptConnection = (index: number) => {
    const connection = suggestedConnections[index];
    // 查找对应的卡片 ID
    const session = getCurrentSession();
    if (session) {
      const fromCard = session.cards.find(c => c.text === connection.fromLabel);
      const toCard = session.cards.find(c => c.text === connection.toLabel);
      if (fromCard && toCard) {
        autoAddConnection(fromCard.id, toCard.id, connection.reason);
      }
    }
    // 移除已接受的连接建议
    setSuggestedConnections(prev => prev.filter((_, i) => i !== index));
    if (suggestedConnections.length === 1) {
      setShowConnectionSuggestions(false);
    }
  };

  // 忽略建议连接
  const handleIgnoreConnection = (index: number) => {
    setSuggestedConnections(prev => prev.filter((_, i) => i !== index));
    if (suggestedConnections.length === 1) {
      setShowConnectionSuggestions(false);
    }
  };

  // 回车发送（Shift+Enter 换行）
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 输入框内容是否有效（非空且非纯空格）
  const hasValidInput = inputValue.trim().length > 0;

  return (
    <div className="flex flex-col h-full relative">

      {/* 连接建议提示 */}
      <AnimatePresence>
        {showConnectionSuggestions && suggestedConnections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-4 z-50"
          >
            <div className="bg-white border border-blue-200 rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-blue-800">💡 AI 发现可能的关联</h4>
                <button
                  onClick={() => setShowConnectionSuggestions(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {suggestedConnections.map((conn, index) => (
                  <div key={index} className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-blue-900 mb-2">
                      <span className="font-medium">{conn.fromLabel}</span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{conn.toLabel}</span>
                    </p>
                    <p className="text-xs text-blue-700 mb-2">{conn.reason}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptConnection(index)}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                      >
                        建立连接
                      </button>
                      <button
                        onClick={() => handleIgnoreConnection(index)}
                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition-colors"
                      >
                        忽略
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 聊天消息列表区 */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pb-32 px-4 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {/* 空状态引导 */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4 py-20"
            >
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                <Sparkles size={32} />
              </div>
              <p className="text-sm italic tracking-wider">
                {session?.emotionFilter === 'negative' 
                  ? '暂无负面情绪记录' 
                  : session?.emotionFilter === 'positive' 
                  ? '暂无正面情绪记录'
                  : '随便说说吧，不用有压力…'}
              </p>
            </motion.div>
          )}
          
          {/* 筛选提示 */}
          {session?.emotionFilter && session.emotionFilter !== 'all' && messages.length > 0 && (
            <div className={`mx-4 py-2 rounded-lg text-xs text-center ${
              session.emotionFilter === 'negative' 
                ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            }`}>
              当前显示{session.emotionFilter === 'negative' ? '负面情绪' : '正面情绪'}消息
              <button
                onClick={() => {}}
                className="ml-2 underline hover:no-underline"
                title="在侧边栏切换筛选"
              >
                切换
              </button>
            </div>
          )}
          
          {/* 消息气泡列表 */}
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-mindbloom-primary text-white rounded-br-none'
                    : 'bg-white text-gray-700 rounded-bl-none border border-gray-100'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 底部输入栏：优化层级和点击穿透 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-mindbloom-bg via-mindbloom-bg to-transparent z-[60] pointer-events-none">
        <div className="max-w-4xl mx-auto relative group pointer-events-auto">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isRecording ? "正在录音…说完自动结束" : "随便说说吧，不用有压力…"}
            rows={1}
            className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-6 pr-28 focus:outline-none focus:ring-2 focus:ring-mindbloom-primary focus:border-transparent shadow-lg transition-all resize-none text-sm placeholder:text-gray-400 group-hover:border-gray-300"
          />
          {/* 语音按钮：优化状态反馈 */}
          <motion.button
            onClick={handleVoiceInput}
            whileTap={{ scale: 0.9 }}
            className={`absolute right-16 bottom-3.5 p-2 rounded-xl transition-all ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse shadow-md' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            title={isRecording ? "停止录音" : "语音输入"}
          >
            <Mic size={18} />
          </motion.button>
          {/* 发送按钮：优化状态逻辑 + 视觉反馈 */}
          <motion.button
            onClick={handleSend}
            disabled={!hasValidInput}
            whileTap={hasValidInput ? { scale: 0.9 } : {}}
            className={`absolute right-3 bottom-3.5 p-2 rounded-xl transition-all ${
              hasValidInput 
                ? 'bg-mindbloom-primary text-white hover:scale-105 active:scale-95 shadow-md cursor-pointer' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-60'
            }`}
            title={hasValidInput ? "发送" : "请输入内容后发送"}
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;