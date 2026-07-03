import React, { useEffect } from 'react';
import { Header } from '@/components/Layout/Header';
import { InputArea } from '@/components/InputArea/InputArea';
import { StyleSelector } from '@/components/StyleSelector/StyleSelector';
import { OutputArea } from '@/components/OutputArea/OutputArea';
import { useAppStore } from '@/store/appStore';

function App() {
  const { convert, isLoading, error, setError, fetchQuota } = useAppStore();

  useEffect(() => {
    fetchQuota(); // 加载时获取剩余次数
  }, [fetchQuota]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 flex justify-between">
            <span>❌ {error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 左侧输入区 */}
          <div className="lg:col-span-2 space-y-4">
            <InputArea />
          </div>

          {/* 右侧输出区 */}
          <div className="lg:col-span-3 space-y-4">
            <OutputArea />
          </div>
        </div>

        {/* 风格选择和操作按钮 */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <StyleSelector />
          <div className="mt-4 flex justify-end">
            <button
              onClick={convert}
              disabled={isLoading}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? '转换中…' : '✨ 一键转换'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;