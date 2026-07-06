import React, { useEffect } from 'react';
import { Header } from '@/components/Layout/Header';
import { InputArea } from '@/components/InputArea/InputArea';
import { StyleSelector } from '@/components/StyleSelector/StyleSelector';
import { OutputArea } from '@/components/OutputArea/OutputArea';
import { useAppStore } from '@/store/appStore';

function App() {
  const { convert, isLoading, error, setError, fetchQuota } = useAppStore();

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] py-6 px-4 md:py-10 flex items-start justify-center">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <Header />

        {/* Error Toast */}
        {error && (
          <div className="toast mb-4 p-4 bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-2xl text-red-600 flex justify-between items-center shadow-sm">
            <span className="flex items-center gap-2 text-sm">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-4">
          {/* Left: Input */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-3xl p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <span>📝</span> 输入原文
                </h2>
                <span className="text-xs text-gray-400 bg-white/40 px-2 py-0.5 rounded-full">支持 2000 字</span>
              </div>
              <InputArea />
            </div>
          </div>

          {/* Right: Output */}
          <div className="lg:col-span-3">
            <div className="glass-card rounded-3xl p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <span>✨</span> 转换结果
                </h2>
                {isLoading && (
                  <div className="text-xs text-purple-500 flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                    <span>生成中…</span>
                  </div>
                )}
              </div>
              <OutputArea />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 glass-card rounded-3xl p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <StyleSelector />
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={convert}
                disabled={isLoading}
                className="btn-primary text-white font-semibold px-8 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-purple-200/60 w-full md:w-auto justify-center text-base"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    转换中…
                  </>
                ) : (
                  <>
                    <span className="text-xl">✨</span> 一键转换
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400/70 flex flex-wrap justify-center gap-x-4 gap-y-1">
          <span>AI 生成内容仅供参考</span>
          <span>·</span>
          <span>语气魔方 v1.0</span>
          <span>·</span>
          <span>数据仅用于本次转换</span>
          <span>·</span>
          <a href="#" className="hover:text-purple-500 transition-colors">隐私政策</a>
        </div>
      </div>
    </div>
  );
}

export default App;