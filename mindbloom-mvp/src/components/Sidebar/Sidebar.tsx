import React from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, Settings, SwitchCamera, Info, EyeOff, Eye, Plus, MessageSquare, Trash, Filter, Heart, Smile, Save } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface SidebarProps {
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { 
    sessions,
    currentSessionId,
    createSession,
    switchSession,
    deleteSession,
    isHiddenMode, 
    toggleHiddenMode, 
    aiStyle, 
    setAiStyle, 
    isAnimationEnabled, 
    setAnimationEnabled,
    clearAllData,
    setEmotionFilter,
    toggleSessionSave,
    getNegativeEmotionMessages
  } = useStore();

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
      />
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="fixed top-0 left-0 bottom-0 w-3/4 max-w-sm bg-white shadow-2xl z-50 p-6 flex flex-col"
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-mindbloom-primary flex items-center justify-center text-white">
              <span className="text-lg font-bold">MB</span>
            </div>
            <span className="text-xl font-bold text-gray-800">MindBloom</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => {
            createSession();
            onClose();
          }}
          className="w-full flex items-center justify-center space-x-2 py-3 mb-6 bg-mindbloom-primary text-white rounded-xl shadow-md hover:bg-opacity-90 transition-all active:scale-95"
        >
          <Plus size={18} />
          <span className="font-medium">新开启一次梳理</span>
        </button>

        {/* Sidebar Content */}
        <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
          {/* Emotion Filter Section */}
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">情绪筛选</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setEmotionFilter('all')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  sessions.find(s => s.id === currentSessionId)?.emotionFilter === 'all'
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Filter size={14} />
                <span>全部</span>
              </button>
              <button
                onClick={() => setEmotionFilter('negative')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  sessions.find(s => s.id === currentSessionId)?.emotionFilter === 'negative'
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart size={14} />
                <span>负面情绪</span>
              </button>
              <button
                onClick={() => setEmotionFilter('positive')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  sessions.find(s => s.id === currentSessionId)?.emotionFilter === 'positive'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Smile size={14} />
                <span>正面情绪</span>
              </button>
            </div>
          </section>

          {/* Sessions List */}
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">历史梳理</h2>
            <div className="space-y-2">
              {sessions.map((session) => {
                const negativeCount = session.messages.filter(
                  m => m.sender === 'user' && m.emotionAnalysis?.isNegativeEmotion
                ).length;
                
                return (
                  <div
                    key={session.id}
                    className={`group flex flex-col gap-2 p-3 rounded-xl cursor-pointer transition-all ${
                      currentSessionId === session.id
                        ? 'bg-indigo-50 border border-indigo-100 text-mindbloom-primary'
                        : 'hover:bg-gray-50 text-gray-600'
                    }`}
                    onClick={() => {
                      switchSession(session.id);
                      onClose();
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 overflow-hidden flex-1">
                        <MessageSquare size={16} className={currentSessionId === session.id ? 'text-mindbloom-primary' : 'text-gray-400'} />
                        <span className="text-sm truncate font-medium">{session.title}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('确定要删除这次梳理记录吗？')) {
                            deleteSession(session.id);
                          }
                        }}
                        className={`p-1.5 rounded-md hover:bg-red-50 hover:text-red-500 transition-all ${
                          currentSessionId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                    
                    {/* Session Info Row */}
                    <div className="flex items-center justify-between pl-7">
                      <div className="flex items-center gap-2">
                        {/* Save Status Indicator */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSessionSave(session.id);
                          }}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                            session.isSaved
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                          title={session.isSaved ? '已保存' : '未保存'}
                        >
                          <Save size={10} />
                          <span>{session.isSaved ? '已保存' : '未保存'}</span>
                        </button>
                        
                        {/* Negative Emotion Count */}
                        {negativeCount > 0 && (
                          <span className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-700">
                            <Heart size={10} className="fill-rose-500" />
                            <span>{negativeCount}</span>
                          </span>
                        )}
                      </div>
                      
                      {/* Emotion Filter Badge */}
                      {session.emotionFilter && session.emotionFilter !== 'all' && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          session.emotionFilter === 'negative' 
                            ? 'bg-rose-100 text-rose-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {session.emotionFilter === 'negative' ? '负面情绪' : '正面情绪'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Settings Section */}
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">设置</h2>
            
            <div className="space-y-6">
              {/* AI Style Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-gray-700">
                  <SwitchCamera size={20} />
                  <span>AI 引导风格</span>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setAiStyle('gentle')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      aiStyle === 'gentle' ? 'bg-white shadow-sm text-mindbloom-primary' : 'text-gray-500'
                    }`}
                  >
                    温和
                  </button>
                  <button
                    onClick={() => setAiStyle('concise')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      aiStyle === 'concise' ? 'bg-white shadow-sm text-mindbloom-primary' : 'text-gray-500'
                    }`}
                  >
                    简洁
                  </button>
                </div>
              </div>

              {/* Animation Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-gray-700">
                  <Settings size={20} />
                  <span>动画开关</span>
                </div>
                <button
                  onClick={() => setAnimationEnabled(!isAnimationEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isAnimationEnabled ? 'bg-mindbloom-primary' : 'bg-gray-200'
                  }`}
                >
                  <motion.div
                    animate={{ x: isAnimationEnabled ? 26 : 2 }}
                    className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>

              {/* Data Cleanup */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-gray-700">
                  <Trash2 size={20} />
                  <span>清理本地数据</span>
                </div>
                <button
                  onClick={() => {
                    if (confirm('确认清空所有对话和情绪记录吗？此操作不可逆。')) {
                      clearAllData();
                    }
                  }}
                  className="px-3 py-1 text-xs font-medium text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
                >
                  清空
                </button>
              </div>
            </div>
          </section>

          {/* Hidden Mode Section */}
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">功能模式</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-3 text-gray-700">
                    {isHiddenMode ? <Eye size={20} /> : <EyeOff size={20} />}
                    <span>隐藏应用小游戏</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 ml-8 italic">开启后显示解压游戏入口</p>
                </div>
                <button
                  onClick={toggleHiddenMode}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isHiddenMode ? 'bg-mindbloom-primary' : 'bg-gray-200'
                  }`}
                >
                  <motion.div
                    animate={{ x: isHiddenMode ? 26 : 2 }}
                    className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Info Section */}
          <section className="pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-3 text-gray-400">
              <Info size={18} />
              <span className="text-xs italic">所有数据均加密保存在本地</span>
            </div>
            <div className="mt-2 flex items-center space-x-3 text-gray-400">
              <Info size={18} />
              <span className="text-xs italic">每条消息可选择是否保存</span>
            </div>
          </section>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;