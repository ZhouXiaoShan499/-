/**
 * 游戏逻辑自定义 Hook
 * 管理气球、水滴的状态和游戏事件处理
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import { playPopSound } from '../services/audio';

export interface Balloon {
  id: string;
  x: number;
  y: number;
  color: string;
  floatDuration: number; // 在生成时确定，避免动画闪烁
}

export interface WaterDrop {
  id: string;
  x: number;
  y: number;
}

// 根据情绪强度映射气球颜色（从柔和到激烈）
export const EMOTION_COLORS: Record<'calm' | 'moderate' | 'intense', string[]> = {
  calm: ['#bfdbfe', '#ddd6fe', '#f5d0fe'],      // 蓝色/紫色/粉色 - 平静
  moderate: ['#fed7aa', '#fef08a', '#bbf7d0'],  // 橙色/黄色/绿色 - 中等
  intense: ['#fecaca', '#fca5a5', '#f87171'],   // 红色系 - 激烈
};

/**
 * 根据情绪强度获取气球数量
 * @param intensity 情绪强度 (0-1)
 * @returns 气球数量 (3-15)
 */
export const getBalloonCountByIntensity = (intensity: number): number => {
  const clampedIntensity = Math.max(0, Math.min(1, intensity));
  return Math.floor(3 + clampedIntensity * 12); // 3-15 个气球
};

/**
 * 根据情绪强度获取颜色组
 * @param intensity 情绪强度 (0-1)
 * @returns 颜色数组
 */
export const getColorByIntensity = (intensity: number): string[] => {
  const clampedIntensity = Math.max(0, Math.min(1, intensity));
  if (clampedIntensity < 0.33) return EMOTION_COLORS.calm;
  if (clampedIntensity < 0.66) return EMOTION_COLORS.moderate;
  return EMOTION_COLORS.intense;
};

/**
 * 游戏逻辑 Hook
 * 封装所有游戏相关的状态和事件处理
 */
export const useGameLogic = () => {
  const { balloonCount, setBalloonCount, getNegativeEmotionMessages } = useStore();
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [drops, setDrops] = useState<WaterDrop[]>([]);
  const [currentIntensity, setCurrentIntensity] = useState<number>(0.5); // 当前情绪强度
  const containerRef = useRef<HTMLDivElement | null>(null);
  const spawnTimeoutsRef = useRef<number[]>([]); // 存储超时引用以便清理

  // 使用 ref 存储 currentIntensity 避免依赖项问题
  const currentIntensityRef = useRef(currentIntensity);
  currentIntensityRef.current = currentIntensity;

  /**
   * 根据当前情绪强度生成气球
   */
  const spawnBalloon = useCallback(() => {
    const count = useStore.getState().balloonCount;
    const colors = getColorByIntensity(currentIntensityRef.current);
    setBalloons(prev => {
      if (prev.length >= count) return prev;
      const newBalloon = {
        id: Math.random().toString(36).substr(2, 9),
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        floatDuration: 2 + Math.random() * 2,
      };
      return [...prev, newBalloon];
    });
  }, []);

  /**
   * 根据情绪消息更新气球配置
   */
  const updateBalloonConfigByEmotion = useCallback((intensity: number) => {
    const newCount = getBalloonCountByIntensity(intensity);
    setCurrentIntensity(intensity);
    setBalloonCount(newCount);
  }, [setBalloonCount]);

  /**
   * 初始填充气球
   */
  useEffect(() => {
    // 清理之前的超时
    spawnTimeoutsRef.current.forEach(clearTimeout);
    spawnTimeoutsRef.current = [];

    // 使用函数式更新获取最新的气球数量
    setBalloons(prevBalloons => {
      const currentCount = prevBalloons.length;
      if (currentCount < balloonCount) {
        for (let i = 0; i < (balloonCount - currentCount); i++) {
          const timeout = setTimeout(() => {
            spawnBalloon();
          }, i * 200);
          spawnTimeoutsRef.current.push(timeout);
        }
      } else if (currentCount > balloonCount) {
        return prevBalloons.slice(0, balloonCount);
      }
      return prevBalloons;
    });
  }, [balloonCount]);

  /**
   * 持续检查并补充气球
   */
  useEffect(() => {
    let intervalId: number | null = null;
    
    const startInterval = () => {
      intervalId = setInterval(() => {
        setBalloons(currentBalloons => {
          const count = useStore.getState().balloonCount;
          if (currentBalloons.length < count) {
            spawnBalloon();
          }
          return currentBalloons;
        });
      }, 1000);
    };

    startInterval();
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  /**
   * 获取容器高度
   */
  const getContainerHeight = useCallback(() => {
    if (containerRef.current) {
      return containerRef.current.clientHeight;
    }
    return window.innerHeight;
  }, []);

  /**
   * 处理气球捏破
   * @param id 气球 ID
   * @param xPercent X 坐标百分比 (0-100)
   * @param yPercent Y 坐标百分比 (0-100)
   */
  const handlePop = useCallback((id: string, xPercent: number, yPercent: number) => {
    const containerHeight = getContainerHeight();
    
    // 播放音效
    playPopSound();
    
    // 将百分比坐标转换为像素坐标
    const pixelX = (xPercent / 100) * (containerRef.current?.clientWidth || window.innerWidth);
    const pixelY = (yPercent / 100) * containerHeight;
    
    // 添加水滴效果
    const dropId = Math.random().toString(36).substr(2, 9);
    setDrops(prev => [...prev, { 
      id: dropId, 
      x: pixelX, 
      y: pixelY 
    }]);

    // 移除气球
    setBalloons(prev => prev.filter(b => b.id !== id));
  }, [getContainerHeight]);

  /**
   * 移除水滴
   */
  const removeDrop = useCallback((id: string) => {
    setDrops(prev => prev.filter(d => d.id !== id));
  }, []);

  /**
   * 重置游戏
   */
  const resetGame = useCallback(() => {
    setBalloons([]);
    setDrops([]);
    setCurrentIntensity(0.5);
  }, []);

  /**
   * 设置容器引用
   */
  const setContainerRef = useCallback((element: HTMLDivElement | null) => {
    containerRef.current = element;
  }, []);

  return {
    balloons,
    drops,
    balloonCount,
    setBalloonCount,
    currentIntensity,
    updateBalloonConfigByEmotion,
    handlePop,
    removeDrop,
    resetGame,
    setContainerRef,
    containerRef,
    getContainerHeight,
  };
};
