/**
 * 解压游戏全屏浮层
 * 气球捏破小游戏，用于释放压力
 * 
 * 职责：仅负责整体布局和组件组合
 * 游戏逻辑已移入 hooks/useGameLogic.ts
 * 子组件已拆分至 Balloon.tsx 和 WaterDrop.tsx
 * 音频服务已移入 services/audio.ts
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Star, Sun, Cloud } from 'lucide-react';
import { useGameLogic } from '../../hooks/useGameLogic';
import Balloon from './Balloon';
import WaterDrop from './WaterDrop';

export interface GameOverlayProps {
  onClose: () => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({ onClose }) => {
  const {
    balloons,
    drops,
    balloonCount,
    setBalloonCount,
    currentIntensity,
    updateBalloonConfigByEmotion,
    handlePop,
    removeDrop,
    setContainerRef,
    getContainerHeight,
  } = useGameLogic();

  // 获取容器高度供 WaterDrop 使用
  const containerHeight = getContainerHeight();

  // 根据情绪强度获取提示文字
  const getEmotionHint = () => {
    if (currentIntensity < 0.33) return "平静 - 深呼吸，感受内心的宁静";
    if (currentIntensity < 0.66) return "中等 - 慢慢捏破气球，释放压力";
    return "激烈 - 用力捏破气球，释放情绪";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[60] bg-white bg-opacity-95 flex flex-col overflow-hidden"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 right-10 text-yellow-400">
          <Sun size={120} />
        </div>
        <div className="absolute top-20 left-20 text-blue-200">
          <Cloud size={80} />
        </div>
        <div className="absolute bottom-40 right-40 text-blue-100">
          <Cloud size={60} />
        </div>
      </div>

      {/* Header */}
      <div className="p-8 flex items-center justify-between z-10">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <Heart className="text-pink-400 fill-pink-400" />
            <h2 className="text-2xl font-bold text-gray-700 tracking-tight">
              解压气球 ({balloons.length}/{balloonCount})
            </h2>
          </div>
          
          {/* Balloon Count Selector */}
          <div className="flex items-center space-x-3 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">气球数量</span>
            <div className="flex items-center bg-white rounded-lg border border-indigo-100 overflow-hidden">
              <button 
                onClick={() => setBalloonCount(Math.max(1, balloonCount - 1))}
                className="px-3 py-1 hover:bg-indigo-50 text-indigo-600 font-bold transition-colors border-r border-indigo-50"
              >
                -
              </button>
              <span className="px-4 py-1 text-sm font-bold text-indigo-700 min-w-[3rem] text-center">
                {balloonCount}
              </span>
              <button 
                onClick={() => setBalloonCount(Math.min(20, balloonCount + 1))}
                className="px-3 py-1 hover:bg-indigo-50 text-indigo-600 font-bold transition-colors border-l border-indigo-50"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all shadow-sm"
        >
          <X size={24} />
        </button>
      </div>

      {/* Game Area */}
      <div ref={setContainerRef} className="flex-1 relative game-area">
        <AnimatePresence>
          {balloons.map(b => (
            <Balloon key={b.id} {...b} onPop={handlePop} />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {drops.map(drop => (
            <WaterDrop 
              key={drop.id} 
              x={drop.x} 
              y={drop.y} 
              containerHeight={containerHeight}
              onComplete={() => removeDrop(drop.id)} 
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer Hint */}
      <div className="p-12 text-center z-10">
        <p className="text-gray-400 text-sm italic tracking-widest flex items-center justify-center space-x-2">
          <Star size={14} className="fill-gray-300 text-gray-300" />
          <span>{getEmotionHint()}</span>
          <Star size={14} className="fill-gray-300 text-gray-300" />
        </p>
      </div>
    </motion.div>
  );
};

export default GameOverlay;
