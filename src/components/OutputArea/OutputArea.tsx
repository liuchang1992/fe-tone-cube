import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';

export const OutputArea: React.FC = () => {
  const { outputText, isLoading } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // 当输出文本变化时，模拟打字效果（仅在 loading 结束后）
  useEffect(() => {
    if (!isLoading && outputText) {
      // 直接显示最终结果（后端已返回完整文本）
      setDisplayText(outputText);
      setIsTyping(false);
    } else if (isLoading) {
      // 开始加载时清空并显示光标
      setDisplayText('');
      setIsTyping(true);
    }
  }, [outputText, isLoading]);

  // 自动滚动到底部
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [displayText]);

  const handleCopy = async () => {
    if (!displayText) return;
    await navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const outputLength = displayText.length;

  return (
    <div className="flex-1 flex flex-col">
      <div
        ref={outputRef}
        className="output-area rounded-2xl p-4 flex-1"
      >
        {isLoading ? (
          // 加载状态：显示占位 + 光标
          <div className="flex flex-col items-center justify-center h-full text-gray-400/60">
            <div className="relative">
              <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-3 text-sm">AI 正在思考中...</p>
          </div>
        ) : displayText ? (
          // 显示结果
          <div className="text-gray-700 whitespace-pre-wrap">
            {displayText}
            <span className="typing-cursor"></span>
          </div>
        ) : (
          // 占位
          <div className="flex flex-col items-center justify-center h-full text-gray-400/60">
            <span className="text-5xl mb-3 opacity-20">📄</span>
            <span className="text-sm">转换后的结果将在这里显示</span>
          </div>
        )}
      </div>

      {displayText && !isLoading && (
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200/50">
          <span className="text-xs text-gray-400">共 {outputLength} 字</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-purple-600 bg-purple-50/80 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200/50 hover:shadow-sm"
          >
            <span>{copied ? '✅' : '📋'}</span>
            <span>{copied ? '已复制' : '复制结果'}</span>
          </button>
        </div>
      )}
    </div>
  );
};