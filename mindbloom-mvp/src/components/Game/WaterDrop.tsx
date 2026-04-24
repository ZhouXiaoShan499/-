/**
 * 水滴子组件
 * 负责渲染气球捏破后的水滴下落动画
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Droplet } from 'lucide-react';

export interface WaterDropProps {
  x: number;
  y: number;
  onComplete: () => void;
  containerHeight: number; // 容器高度，用于计算水滴下落终点
}

const WaterDrop: React.FC<WaterDropProps> = ({ x, y, onComplete, containerHeight }) => {
  return (
    <motion.div
      initial={{ y, left: x, opacity: 1, scale: 0.5 }}
      animate={{ 
        y: y + containerHeight,
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

export default WaterDrop;