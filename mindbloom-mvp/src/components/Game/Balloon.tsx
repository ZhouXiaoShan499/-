/**
 * 气球子组件
 * 负责渲染单个气球及其动画效果
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Wind } from 'lucide-react';

export interface BalloonProps {
  id: string;
  x: number;
  y: number;
  color: string;
  floatDuration: number; // 在生成时确定的动画参数
  onPop: (id: string, x: number, y: number) => void;
}

const Balloon: React.FC<BalloonProps> = ({ id, x, y, color, floatDuration, onPop }) => {
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
          duration: floatDuration, // 使用预定义的值，避免每次渲染重新计算
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
      role="button"
      aria-label="捏破气球"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onPop(id, x, y);
        }
      }}
    >
      {/* 气球绳子 */}
      <div className="absolute -bottom-2 w-1 h-6 bg-gray-200 bg-opacity-30 rounded-full" />
      {/* 气球高光 */}
      <div className="text-white opacity-40">
        <Wind size={20} />
      </div>
    </motion.div>
  );
};

export default Balloon;