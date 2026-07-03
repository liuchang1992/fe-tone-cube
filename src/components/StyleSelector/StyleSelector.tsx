import React from 'react';
import { useAppStore } from '@/store/appStore';

const STYLE_OPTIONS = [
  { id: 'formal', label: '📊 职场汇报', desc: '严谨、结构化' },
  { id: 'xiaohongshu', label: '🌸 小红书种草', desc: '活泼、情绪化' },
  { id: 'wechat', label: '💬 微信私聊', desc: '自然、口语化' },
  { id: 'academic', label: '📚 学术严谨', desc: '客观、术语化' },
];

export const StyleSelector: React.FC = () => {
  const { selectedStyle, setStyle, isLoading } = useAppStore();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {STYLE_OPTIONS.map((style) => (
        <button
          key={style.id}
          onClick={() => !isLoading && setStyle(style.id)}
          className={`p-3 rounded-lg border-2 text-left transition-all ${
            selectedStyle === style.id
              ? 'border-indigo-500 bg-indigo-50 shadow-md'
              : 'border-gray-200 hover:border-indigo-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          disabled={isLoading}
        >
          <div className="font-semibold">{style.label}</div>
          <div className="text-xs text-gray-500 mt-1">{style.desc}</div>
        </button>
      ))}
    </div>
  );
};