import React, { useEffect, useState } from 'react';

import { useDebounce } from '@/hooks/useDebounce';
import { useAppStore } from '@/store/appStore';
import './index.less';

export const InputArea: React.FC = () => {
  const { inputText, isLoading, setInput } = useAppStore();
  const [localText, setLocalText] = useState(inputText);
  const debouncedText = useDebounce(localText, 300);

  useEffect(() => {
    setInput(debouncedText);
  }, [debouncedText, setInput]);

  useEffect(() => {
    setLocalText(inputText);
  }, [inputText]);

  const isOverLimit = localText.length > 2000;

  return (
    <div className="input-area-context">
      <textarea
        className={`input-area ${isOverLimit ? 'input-area--over-limit' : ''}`}
        placeholder="请输入需要转换的文本内容..."
        value={localText}
        onChange={(event) => setLocalText(event.target.value)}
        disabled={isLoading}
      />
    </div>
  );
};
