import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { useAppStore } from '@/store/appStore';

interface HistoryItem {
  id: number;
  input_text: string;
  output_text: string;
  style: string;
  created_at: string;
}

export const History: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    if (!user.isLoggedIn) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user.isLoggedIn) {
      fetchHistory();
    }
  }, [user.isLoggedIn]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/history/list');
      setHistory(res.data);
    } catch (err: any) {
      setError(err.message || '加载历史记录失败');
    } finally {
      setLoading(false);
    }
  };

  const deleteHistory = async (id: number) => {
    if (!confirm('确定删除这条记录吗？')) return;
    try {
      await apiClient.delete(`/api/history/${id}`);
      setHistory(history.filter(item => item.id !== id));
    } catch (err: any) {
      alert('删除失败：' + err.message);
    }
  };

  // ========== 新增：清空所有历史 ==========
  const clearAllHistory = async () => {
    if (!confirm('确定清空所有历史记录吗？此操作不可撤销')) return;
    try {
      await apiClient.delete('/api/history/clear');
      setHistory([]);
      alert('已清空所有历史记录');
    } catch (err: any) {
      alert('清空失败：' + err.message);
    }
  };

  const copyText = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      alert('复制失败，请手动复制');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] py-10 px-4 flex items-center justify-center">
        <div className="text-center text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] py-6 px-4 md:py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📜 转换历史</h1>
          <div className="flex gap-3">
            {history.length > 0 && (
              <button
                onClick={clearAllHistory}
                className="text-sm text-red-500 hover:text-red-700 transition-colors"
              >
                🗑️ 清空所有
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="text-sm text-purple-500 hover:underline"
            >
              ← 返回首页
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {history.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-400">还没有转换记录</p>
            <p className="text-sm text-gray-300 mt-1">去首页使用一次转换，记录会自动保存</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 btn-primary text-white px-6 py-2 rounded-xl text-sm"
            >
              去转换
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="glass-card rounded-2xl p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                      <span>{formatDate(item.created_at)}</span>
                      <span className="px-2 py-0.5 bg-purple-100 rounded-full text-purple-600">
                        {item.style}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      原文：{item.input_text}
                    </div>
                    <div className="text-sm text-gray-800 mt-1 line-clamp-2">
                      转换：{item.output_text}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <button
                      onClick={() => copyText(item.output_text, item.id)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                        copiedId === item.id
                          ? 'bg-green-100 text-green-600'
                          : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                      }`}
                      title="复制转换结果"
                    >
                      {copiedId === item.id ? '✅ 已复制' : '📋 复制'}
                    </button>
                    <button
                      onClick={() => deleteHistory(item.id)}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-lg hover:bg-red-50"
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};