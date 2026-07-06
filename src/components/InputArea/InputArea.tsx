import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { useDebounce } from '@/hooks/useDebounce';

export const InputArea: React.FC = () => {
  const { inputText, setInput, isLoading } = useAppStore();
  const [localText, setLocalText] = useState(inputText);
  const debouncedText = useDebounce(localText, 300);

  useEffect(() => {
    setInput(debouncedText);
  }, [debouncedText, setInput]);

  const charCount = localText.length;
  const maxLength = 2000;
  const isOverLimit = charCount > maxLength;

  return (
    <div className="flex-1 space-y-2">
      <textarea
        className={`
          input-area w-full h-64 p-4 bg-white/60 rounded-2xl
          text-gray-700 text-sm leading-relaxed resize-none
          placeholder:text-gray-400/60
          ${isOverLimit ? 'border-red-300' : ''}
          ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
        `}
        placeholder="在此粘贴你想要转换的文本……"
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        disabled={isLoading}
      />
      <div className="flex justify-between text-xs px-1">
        <span className={isOverLimit ? 'text-red-500 font-medium' : 'text-gray-400'}>
          {isOverLimit ? '⚠️ 超出限制' : '输入字数'}
        </span>
        <span className={isOverLimit ? 'text-red-500 font-medium' : 'text-gray-400'}>
          {charCount} / {maxLength}
        </span>
      </div>
    </div>
  );
};