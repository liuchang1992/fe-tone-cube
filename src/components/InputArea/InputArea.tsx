import React from 'react';

import { useAppStore } from '@/store/appStore';
import './index.less';

export const InputArea: React.FC = () => {
  const { inputText, isLoading, setInput } = useAppStore();
  const isOverLimit = inputText.length > 2000;

  return (
    <div className="input-area-context">
      <textarea
        className={`input-area ${isOverLimit ? 'input-area--over-limit' : ''}`}
        placeholder="请输入需要转换的文本内容..."
        value={inputText}
        onChange={(event) => setInput(event.target.value)}
        disabled={isLoading}
      />
    </div>
  );
};
