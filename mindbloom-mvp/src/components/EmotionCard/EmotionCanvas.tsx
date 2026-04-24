import React, { useRef, useState, useCallback } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { Tag, Sparkles, Hash, Link, X, Plus } from 'lucide-react';

interface EmotionCardProps {
  id: string;
  text: string;
  type: 'label' | 'keyword';
  x: number;
  y: number;
  isSelected: boolean;
  isConnectMode: boolean;
  onSelect: (id: string | null) => void;
  onConnect: (fromId: string, toId: string) => void;
  onDelete: (id: string) => void;
}

const EmotionCard: React.FC<EmotionCardProps> = ({ 
  id, text, type, x, y, 
  isSelected, isConnectMode,
  onSelect, onConnect, onDelete 
}) => {
  const { updateCardPosition, isAnimationEnabled } = useStore();
  const controls = useDragControls();
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConnectMode) {
      if (isSelected) {
        // 已选中，取消选择
        onSelect(null);
      } else {
        // 未选中，选择此卡片
        onSelect(id);
      }
    } else {
      onSelect(isSelected ? null : id);
    }
  };

  return (
    <motion.div
      drag
      dragControls={controls}
      dragMomentum={false}
      initial={isAnimationEnabled ? { opacity: 0, scale: 0.8, x, y } : { x, y }}
      animate={{ opacity: 1, scale: 1, x, y }}
      whileHover={{ scale: 1.05, zIndex: 30 }}
      whileTap={{ cursor: 'grabbing', scale: 0.95 }}
      onDragEnd={(_, info) => {
        updateCardPosition(id, x + info.offset.x, y + info.offset.y);
      }}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`absolute px-4 py-2 rounded-xl shadow-md border flex items-center space-x-2 cursor-grab select-none z-20 transition-all ${
        isSelected 
          ? 'ring-2 ring-indigo-400 ring-offset-2 shadow-lg' 
          : ''
      } ${
        type === 'label'
          ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
          : 'bg-teal-50 border-teal-100 text-teal-600'
      } ${
        isConnectMode ? 'cursor-crosshair' : ''
      }`}
    >
      {type === 'label' ? <Tag size={14} /> : <Hash size={14} />}
      <span className="text-sm font-medium tracking-wide">{text}</span>
      
      {/* 删除按钮 */}
      {(isHovered || isSelected) && !isConnectMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="ml-1 p-0.5 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
        >
          <X size={12} />
        </button>
      )}
      
      {/* 连接模式指示 */}
      {isConnectMode && (
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
          isSelected ? 'bg-green-500' : 'bg-gray-300'
        }`} />
      )}
    </motion.div>
  );
};

const EmotionCanvas: React.FC = () => {
  const { getCurrentSession, addConnection, addCards, createSession } = useStore();
  const session = getCurrentSession();
  const cards = session?.cards || [];
  const connections = session?.connections || [];
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isConnectMode, setIsConnectMode] = useState(false);
  const [tempConnection, setTempConnection] = useState<{ from: { x: number, y: number }, to: { x: number, y: number } } | null>(null);

  // 处理卡片选择
  const handleCardSelect = useCallback((id: string | null) => {
    if (id === null) {
      setSelectedCardId(null);
      setIsConnectMode(false);
    } else if (!isConnectMode) {
      // 第一次点击，进入连接模式
      setIsConnectMode(true);
      setSelectedCardId(id);
    } else {
      // 第二次点击，建立连接
      if (selectedCardId && selectedCardId !== id) {
        addConnection(selectedCardId, id);
      }
      setSelectedCardId(null);
      setIsConnectMode(false);
    }
  }, [isConnectMode, selectedCardId, addConnection]);

  // 处理卡片删除 - 使用 store action
  const handleCardDelete = useCallback((id: string) => {
    // 删除卡片及其所有连接
    const { getCurrentSession, addCards, addConnection } = useStore.getState();
    const session = getCurrentSession();
    if (!session) return;
    
    // 创建新的卡片和连接数组（排除被删除的）
    const newCards = session.cards.filter(c => c.id !== id);
    const newConnections = session.connections.filter(
      c => c.fromId !== id && c.toId !== id
    );
    
    // 使用 setState 更新当前会话
    const { sessions } = useStore.getState();
    const updatedSessions = sessions.map(s => 
      s.id === session.id 
        ? { ...s, cards: newCards, connections: newConnections }
        : s
    );
    
    useStore.setState({ sessions: updatedSessions });
  }, []);

  // 处理画布点击（取消选择）
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      setSelectedCardId(null);
      setIsConnectMode(false);
    }
  };

  // 计算连接中心点
  const getCardCenter = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return { x: 0, y: 0 };
    return { x: card.x + 50, y: card.y + 20 };
  };

  // 绘制贝塞尔曲线连接
  const drawCurve = (from: { x: number, y: number }, to: { x: number, y: number }) => {
    const deltaX = Math.abs(to.x - from.x);
    const controlPointOffset = Math.min(deltaX * 0.5, 100);
    
    const path = `M ${from.x} ${from.y} C ${from.x + controlPointOffset} ${from.y}, ${to.x - controlPointOffset} ${to.y}, ${to.x} ${to.y}`;
    return path;
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-white bg-opacity-40"
      onClick={handleCanvasClick}
    >
      {/* 背景点阵 */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* SVG 用于绘制连接线和临时连线 */}
      <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none overflow-visible">
        {/* 已保存的连接 */}
        {connections.map((conn, idx) => {
          const from = getCardCenter(conn.fromId);
          const to = getCardCenter(conn.toId);
          if (!from || !to) return null;
          
          return (
            <g key={idx}>
              <motion.path
                d={drawCurve(from, to)}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              />
              {/* 连接中点装饰 */}
              <circle
                cx={(from.x + to.x) / 2}
                cy={(from.y + to.y) / 2}
                r="3"
                fill="#94a3b8"
                opacity="0.5"
              />
            </g>
          );
        })}
        
        {/* 临时连接预览 */}
        {isConnectMode && selectedCardId && tempConnection && (
          <motion.path
            d={drawCurve(tempConnection.from, tempConnection.to)}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.6 }}
          />
        )}
      </svg>

      {/* 卡片列表 */}
      {cards.map((card) => (
        <div
          key={card.id}
          onMouseMove={(e) => {
            if (isConnectMode && selectedCardId === card.id) {
              const rect = containerRef.current?.getBoundingClientRect();
              if (rect) {
                setTempConnection({
                  from: getCardCenter(card.id),
                  to: { x: e.clientX - rect.left, y: e.clientY - rect.top }
                });
              }
            }
          }}
          onMouseUp={(e) => {
            if (isConnectMode && selectedCardId && selectedCardId !== card.id) {
              addConnection(selectedCardId, card.id);
              setSelectedCardId(null);
              setIsConnectMode(false);
              setTempConnection(null);
            }
          }}
        >
          <EmotionCard
            {...card}
            isSelected={selectedCardId === card.id}
            isConnectMode={isConnectMode}
            onSelect={handleCardSelect}
            onConnect={addConnection}
            onDelete={handleCardDelete}
          />
        </div>
      ))}

      {/* 空状态引导 */}
      {cards.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none">
          <div className="flex flex-col items-center space-y-2 opacity-50">
            <Sparkles size={24} />
            <span className="text-xs italic">输入情绪后，这里将生成你的情绪网络</span>
          </div>
        </div>
      )}

      {/* 连接模式提示 */}
      {isConnectMode && selectedCardId && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 z-30"
        >
          <Link size={14} />
          <span>点击另一张卡片建立连接</span>
          <button
            onClick={() => {
              setSelectedCardId(null);
              setIsConnectMode(false);
              setTempConnection(null);
            }}
            className="ml-2 p-0.5 hover:bg-indigo-200 rounded-full"
          >
            <X size={12} />
          </button>
        </motion.div>
      )}

      {/* 快速添加卡片按钮 */}
      <button
        onClick={() => {
          const labels = ['新情绪'];
          const keywords = ['新想法'];
          addCards(labels, keywords);
        }}
        className="absolute bottom-4 right-4 w-12 h-12 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-30"
        title="快速添加情绪卡片"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default EmotionCanvas;