import React, { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import Header from './components/Layout/Header';
import Sidebar from './components/Sidebar/Sidebar';
import ChatArea from './components/Chat/ChatArea';
import EmotionCanvas from './components/EmotionCard/EmotionCanvas';
import GameOverlay from './components/Game/GameOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';

const App: React.FC = () => {
  const { isHiddenMode, loadState } = useStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showGame, setShowGame] = useState(false);

  useEffect(() => {
    loadState();
  }, [loadState]);

  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden bg-mindbloom-bg">
      {/* Header */}
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Chat Bubbles */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <ChatArea />
        </div>

        {/* Emotion Card Visualization Area */}
        <div className="h-1/3 border-t border-gray-200 relative bg-white bg-opacity-50">
          <EmotionCanvas />
        </div>

        {/* Floating Action Button (Hidden Mode) - Moved up to avoid input bar overlap */}
        <button
          onClick={() => setShowGame(true)}
          className={`fixed bottom-24 right-6 p-4 rounded-full shadow-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all z-[100] flex items-center space-x-2 ${
            isHiddenMode ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'
          }`}
        >
          <Gamepad2 size={20} />
          <span className="text-sm font-bold">解压游戏</span>
        </button>
      </main>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* Game Overlay */}
      <AnimatePresence>
        {showGame && (
          <GameOverlay onClose={() => setShowGame(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
