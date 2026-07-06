import React from 'react';
import { useAppStore } from '@/store/appStore';

export const Header: React.FC = () => {
  const { remainingQuota } = useAppStore();

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200/50">
          <span className="text-2xl">🎲</span>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            语气<span className="gradient-text">魔方</span>
          </h1>
          <p className="text-xs text-gray-400/80 mt-0.5 font-medium tracking-wider">一键切换文本语气 · AI 驱动</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full shadow-sm border border-white/50">
          <span className="text-sm text-gray-500 font-medium">今日剩余</span>
          <span className="text-sm font-bold text-purple-600">{remainingQuota}</span>
          <span className="text-xs text-gray-400">次</span>
        </div>
        <button
          className="px-5 py-2 text-sm font-semibold text-purple-600 bg-purple-50/80 backdrop-blur-sm rounded-full hover:bg-purple-100 transition-all border border-purple-200/50 hover:shadow-md"
          onClick={() => alert('🚀 会员功能即将上线，敬请期待！')}
        >
          🔓 升级会员
        </button>
      </div>
    </header>
  );
};