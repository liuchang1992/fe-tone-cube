import React from 'react';
import { useAppStore } from '@/store/appStore';

const STYLE_OPTIONS = [
  { id: 'formal', label: '职场汇报', icon: '💼' },
  { id: 'xiaohongshu', label: '小红书种草', icon: '🌸' },
  { id: 'wechat', label: '微信私聊', icon: '💬' },
  { id: 'academic', label: '学术严谨', icon: '📚' },
  { id: 'marketing', label: '营销文案', icon: '🎯' },
];

export const StyleSelector: React.FC = () => {
  const { selectedStyle, setStyle, isLoading } = useAppStore();

  return (
    <div className="flex flex-wrap gap-2">
      {STYLE_OPTIONS.map((style) => (
        <button
          key={style.id}
          onClick={() => !isLoading && setStyle(style.id)}
          className={`
            style-btn px-4 py-2.5 rounded-2xl text-sm font-medium flex items-center gap-2
            ${selectedStyle === style.id ? 'style-active' : ''}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          disabled={isLoading}
        >
          <span>{style.icon}</span>
          {style.label}
          <span className="style-check text-purple-600 text-xs ml-1">✓</span>
        </button>
      ))}
    </div>
  );
};