import React, { useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

import { useTypingEffect } from '@/hooks/useTypingEffect';
import { useAppStore } from '@/store/appStore';
import './index.less';

export const OutputArea: React.FC = () => {
  const { isLoading, outputText } = useAppStore();
  const [shouldType, setShouldType] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const { displayText, isComplete, isTyping, skip } = useTypingEffect(
    shouldType ? outputText : '',
    { speed: 25, autoStart: shouldType }
  );

  useEffect(() => {
    if (outputText && !isLoading) {
      setShouldType(true);
    } else if (!outputText) {
      setShouldType(false);
    }
  }, [outputText, isLoading]);

  useEffect(() => {
    if (isLoading) {
      setShouldType(false);
    }
  }, [isLoading]);

  useEffect(() => {
    if (outputRef.current && (displayText || isTyping)) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [displayText, isTyping]);

  const handleCopy = async () => {
    const textToCopy = isComplete ? outputText : displayText;
    if (!textToCopy) return;
    await navigator.clipboard.writeText(textToCopy);
    message.success('复制成功');
  };

  const outputLength = (isComplete ? outputText : displayText)?.length || 0;

  return (
    <div className="output-container">
      <div
        ref={outputRef}
        className={`output-area ${isLoading ? 'output-area--loading' : ''}`}
      >
        {isLoading ? (
          <div className="output-state">
            <div className="output-loader" />
            <p className="output-state-text">AI 正在思考中...</p>
          </div>
        ) : displayText ? (
          <div>
            {displayText}
            {!isComplete && isTyping && <span className="typing-cursor" />}
            {!isComplete && isTyping && (
              <button onClick={skip} className="skip-typing">跳过</button>
            )}
          </div>
        ) : (
          <div className="output-empty">转换后的内容将显示在这里</div>
        )}
      </div>

      {(displayText || outputText) && !isLoading && (
        <div className="output-info">
          <span>{outputLength} 字</span>
          <button onClick={handleCopy} className="copy-btn" aria-label="复制结果">
            <CopyOutlined />
          </button>
        </div>
      )}
    </div>
  );
};
