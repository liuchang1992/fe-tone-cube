import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { useDebounce } from '@/hooks/useDebounce';

export const InputArea: React.FC = () => {
  const { inputText, setInput, isLoading } = useAppStore();
  const [localText, setLocalText] = useState(inputText);
  const debouncedText = useDebounce(localText, 300);

  // 将防抖后的文本同步到 store
  useEffect(() => {
    setInput(debouncedText);
  }, [debouncedText, setInput]);

  const charCount = localText.length;
  const maxLength = 2000;

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <textarea
        className="w-full h-64 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none text-gray-700"
        placeholder="在此粘贴你想要转换的文本……（支持2000字）"
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        disabled={isLoading}
      />
      <div className="flex justify-between mt-2 text-sm text-gray-400">
        <span>{charCount} 字</span>
        <span>{charCount > maxLength ? '⚠️ 超过限制' : `剩余 ${maxLength - charCount} 字`}</span>
      </div>
    </div>
  );
};