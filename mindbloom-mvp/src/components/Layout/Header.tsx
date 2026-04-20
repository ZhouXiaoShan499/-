import React from 'react';
import { Menu, Lock, ShieldCheck, Eye } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { isHiddenMode } = useStore();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm z-10 border-b border-gray-100">
      {/* Left: Avatar/Menu Button */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Menu size={24} className="text-gray-600" />
      </button>

      {/* Middle: Title */}
      <h1 className="text-xl font-semibold text-gray-800 tracking-tight">
        MindBloom 情绪梳理
      </h1>

      {/* Right: Storage Status Icon */}
      <div className="flex items-center space-x-4">
        {isHiddenMode && (
          <div className="flex items-center space-x-1 text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">
            <Eye size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">隐藏模式开启</span>
          </div>
        )}
        <div className="flex items-center space-x-2 text-green-500 bg-green-50 px-3 py-1 rounded-full">
          <ShieldCheck size={16} />
          <span className="text-xs font-medium">本地加密存储</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
