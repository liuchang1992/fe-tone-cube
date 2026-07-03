import React, { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { FiCopy, FiCheck } from 'react-icons/fi';

export const OutputArea: React.FC = () => {
  const { outputText, isLoading } = useAppStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 relative">
      <div className="min-h-[200px] max-h-[400px] overflow-y-auto p-3 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <span className="animate-pulse">⏳ 生成中……</span>
          </div>
        ) : outputText ? (
          outputText
        ) : (
          <span className="text-gray-400">转换后的结果将在这里显示</span>
        )}
      </div>
      {outputText && (
        <button
          onClick={handleCopy}
          className="absolute top-4 right-4 p-2 bg-white rounded-full shadow hover:shadow-md transition"
          title="复制结果"
        >
          {copied ? <FiCheck className="text-green-500" /> : <FiCopy className="text-gray-500" />}
        </button>
      )}
    </div>
  );
};