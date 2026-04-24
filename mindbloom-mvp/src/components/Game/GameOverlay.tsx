<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Wind, Star, Sun, Cloud, Droplet } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface BalloonProps {
  id: string;
  x: number;
  y: number;
  color: string;
  onPop: (id: string, x: number, y: number) => void;
}

const Balloon: React.FC<BalloonProps> = ({ id, x, y, color, onPop }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: y + 100 }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        y: [y, y - 20, y],
      }}
      transition={{
        y: {
          duration: 2 + Math.random() * 2,
          repeat: Infinity,
          ease: "easeInOut"
        },
        scale: { duration: 0.5 }
      }}
      exit={{ 
        scale: 1.5, 
        opacity: 0,
        transition: { duration: 0.2 }
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => onPop(id, x, y)}
      style={{ left: `${x}%`, top: `${y}%`, backgroundColor: color }}
      className="absolute w-20 h-24 rounded-full shadow-lg flex items-center justify-center cursor-pointer select-none z-20"
    >
      <div className="absolute -bottom-2 w-1 h-6 bg-gray-200 bg-opacity-30 rounded-full" />
      <div className="text-white opacity-40">
        <Wind size={20} />
      </div>
    </motion.div>
  );
};

const WaterDrop: React.FC<{ x: number; y: number; onComplete: () => void }> = ({ x, y, onComplete }) => {
  return (
    <motion.div
      initial={{ y, x: `${x}%`, opacity: 1, scale: 0.5 }}
      animate={{ 
        y: window.innerHeight, 
        opacity: [1, 1, 0],
        scale: [0.5, 1, 0.8]
      }}
      transition={{ duration: 1.5, ease: "easeIn" }}
      onAnimationComplete={onComplete}
      className="absolute z-10 text-blue-400 pointer-events-none"
    >
      <Droplet size={24} fill="currentColor" />
    </motion.div>
  );
};

const COLORS = [
  '#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#bfdbfe', '#ddd6fe', '#f5d0fe'
];

// Programmatic "Pop" sound using Web Audio API
const playPopSound = () => {
  const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
  if (!AudioContextClass) return;
  
  const ctx = new AudioContextClass();
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
};

interface GameOverlayProps {
=======
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
>>>>>>> feature/addedit1
  onClose: () => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({ onClose }) => {
<<<<<<< HEAD
  const { balloonCount, setBalloonCount } = useStore();
  const [balloons, setBalloons] = useState<{ id: string; x: number; y: number; color: string }[]>([]);
  const [drops, setDrops] = useState<{ id: string; x: number; y: number }[]>([]);

  const spawnBalloon = useCallback(() => {
    setBalloons(prev => {
      if (prev.length >= balloonCount) return prev;
      const newBalloon = {
        id: Math.random().toString(36).substr(2, 9),
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      };
      return [...prev, newBalloon];
    });
  }, [balloonCount]);

  useEffect(() => {
    // Fill up to balloonCount initially
    const currentCount = balloons.length;
    if (currentCount < balloonCount) {
      for(let i=0; i < (balloonCount - currentCount); i++) {
        setTimeout(spawnBalloon, i * 200);
      }
    } else if (currentCount > balloonCount) {
      setBalloons(prev => prev.slice(0, balloonCount));
    }
  }, [balloonCount, spawnBalloon]);

  // Keep checking if we need to spawn more (if some were popped)
  useEffect(() => {
    const interval = setInterval(() => {
      if (balloons.length < balloonCount) {
        spawnBalloon();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [balloons.length, balloonCount, spawnBalloon]);

  const handlePop = (id: string, x: number, y: number) => {
    const popped = balloons.find(b => b.id === id);
    if (!popped) return;

    // Play "Pop" sound
    playPopSound();

    // Add water drop
    const dropId = Math.random().toString(36).substr(2, 9);
    setDrops(prev => [...prev, { id: dropId, x, y: (y / 100) * window.innerHeight }]);

    setBalloons(prev => prev.filter(b => b.id !== id));
  };

  const removeDrop = (id: string) => {
    setDrops(prev => prev.filter(d => d.id !== id));
=======
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
>>>>>>> feature/addedit1
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
<<<<<<< HEAD
        <Sun size={120} className="absolute top-10 right-10 text-yellow-400" />
        <Cloud size={80} className="absolute top-20 left-20 text-blue-200" />
        <Cloud size={60} className="absolute bottom-40 right-40 text-blue-100" />
=======
        <div className="absolute top-10 right-10 text-yellow-400">
          <Sun size={120} />
        </div>
        <div className="absolute top-20 left-20 text-blue-200">
          <Cloud size={80} />
        </div>
        <div className="absolute bottom-40 right-40 text-blue-100">
          <Cloud size={60} />
        </div>
>>>>>>> feature/addedit1
      </div>

      {/* Header */}
      <div className="p-8 flex items-center justify-between z-10">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <Heart className="text-pink-400 fill-pink-400" />
<<<<<<< HEAD
            <h2 className="text-2xl font-bold text-gray-700 tracking-tight">解压气球 ({balloons.length}/{balloonCount})</h2>
          </div>
          
          {/* Balloon Count Selector inside Game */}
=======
            <h2 className="text-2xl font-bold text-gray-700 tracking-tight">
              解压气球 ({balloons.length}/{balloonCount})
            </h2>
          </div>
          
          {/* Balloon Count Selector */}
>>>>>>> feature/addedit1
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
<<<<<<< HEAD
      <div className="flex-1 relative">
=======
      <div ref={setContainerRef} className="flex-1 relative game-area">
>>>>>>> feature/addedit1
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
<<<<<<< HEAD
=======
              containerHeight={containerHeight}
>>>>>>> feature/addedit1
              onComplete={() => removeDrop(drop.id)} 
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer Hint */}
      <div className="p-12 text-center z-10">
        <p className="text-gray-400 text-sm italic tracking-widest flex items-center justify-center space-x-2">
          <Star size={14} className="fill-gray-300 text-gray-300" />
<<<<<<< HEAD
          <span>点击气球，释放内心的压力</span>
=======
          <span>{getEmotionHint()}</span>
>>>>>>> feature/addedit1
          <Star size={14} className="fill-gray-300 text-gray-300" />
        </p>
      </div>
    </motion.div>
  );
};

export default GameOverlay;
