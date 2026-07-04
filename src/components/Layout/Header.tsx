import React from 'react';
import { useAppStore } from '@/store/appStore';

export const Header: React.FC = () => {
  const remaining = useAppStore((state) => state.remainingQuota);
  return (
    <header className="flex justify-between items-center px-6 bg-white shadow-sm">
      <h1 className="text-xl font-bold text-indigo-600">✨ 语气魔方</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">今日剩余免费：</span>
        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
          {remaining} 次
        </span>
      </div>
    </header>
  );
};