import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { useTypingEffect } from '@/hooks/useTypingEffect';
import { FiCopy, FiCheck, FiShare2 } from 'react-icons/fi';
import { SharePoster } from '@/components/Share/SharePoster';
import './index.less';

export const OutputArea: React.FC = () => {
  const { outputText, isLoading, inputText, selectedStyle } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [shouldType, setShouldType] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // 使用打字机效果
  const { displayText, isComplete, isTyping, skip } = useTypingEffect(
    shouldType ? outputText : '',
    { speed: 25, autoStart: shouldType }
  );

  // 当输出文本变化时，触发打字效果
  useEffect(() => {
    if (outputText && !isLoading) {
      setShouldType(true);
    }
  }, [outputText, isLoading]);

  // 当开始新加载时，重置打字状态
  useEffect(() => {
    if (isLoading) {
      setShouldType(false);
      setCopied(false);
    }
  }, [isLoading]);

  // 滚动到底部
  useEffect(() => {
    if (outputRef.current && (displayText || isTyping)) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [displayText, isTyping]);

  const handleCopy = async () => {
    const textToCopy = isComplete ? outputText : displayText;
    if (!textToCopy) return;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSkip = () => {
    skip();
  };

  const handleShare = () => {
    if (!outputText) return;
    setShowShareModal(true);
  };

  const outputLength = (isComplete ? outputText : displayText)?.length || 0;

  return (
    <>
      <div className="output-container">
        {/* 输出内容 */}
        <div
          ref={outputRef}
          className={`
            flex-1 min-h-[200px] max-h-[400px] overflow-y-auto
            p-4 bg-white/50 backdrop-blur-sm border border-gray-200/60 rounded-xl
            text-gray-700 text-sm leading-relaxed whitespace-pre-wrap
            ${isLoading ? 'opacity-70' : ''}
          `}
        >
          {isLoading ? (
            // 加载状态：显示加载动画
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="relative">
                <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              </div>
              <p className="mt-3 text-sm">AI 正在思考中...</p>
            </div>
          ) : displayText ? (
            // 打字机效果显示
            <div>
              {displayText}
              {/* 打字光标 */}
              {!isComplete && isTyping && (
                <span className="typing-cursor"></span>
              )}
              {/* 跳过按钮（打字过程中显示） */}
              {!isComplete && isTyping && (
                <button
                  onClick={handleSkip}
                  className="ml-2 text-xs text-purple-400 hover:text-purple-600 transition-colors"
                >
                  跳过
                </button>
              )}
            </div>
          ) : (
            // 占位状态
            <div className="flex flex-col items-center justify-center h-full text-gray-400/60">
              <span className="text-4xl mb-2 opacity-30">📄</span>
              <span>转换后的结果将在这里显示</span>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        {(displayText || isLoading) && !isLoading && (
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-gray-400">
              共 {outputLength} 字
              {!isComplete && isTyping && (
                <span className="ml-2 text-purple-400 animate-pulse">● 生成中...</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {/* 分享按钮 */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50/80 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200/50"
              >
                <FiShare2 title="分享" />
              </button>
              {/* 复制按钮 */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-purple-600 bg-purple-50/80 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200/50"
              >
                {copied ? (
                  <>
                    <FiCheck className="text-green-500" />
                    <span className="text-green-600">已复制</span>
                  </>
                ) : (
                  <>
                    <FiCopy title="复制结果" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 分享海报弹窗 */}
      {/* <SharePoster
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        originalText={inputText || '原文'}
        convertedText={outputText}
        styleName={selectedStyle}
      /> */}
    </>
  );
};