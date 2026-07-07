import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import apiClient from '@/api/client';

interface CorpusItem {
  id: number;
  file_name: string;
  style_summary: string;
  created_at: string;
}

export const Corpus: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('text');
  const [uploading, setUploading] = useState(false);
  const [styleSummary, setStyleSummary] = useState('');
  const [corpusList, setCorpusList] = useState<CorpusItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user.isLoggedIn) {
      navigate('/login');
    } else {
      fetchCorpusList();
    }
  }, [user, navigate]);

  const fetchCorpusList = async () => {
    try {
      const res = await apiClient.get('/api/corpus/list');
      setCorpusList(res.data);
    } catch (e) {
      console.error('加载语料列表失败', e);
    } finally {
      setLoading(false);
    }
  };

  // 文本粘贴上传
  const handleTextUpload = async () => {
    if (!textContent.trim() || textContent.trim().length < 50) {
      alert('请至少输入50个字符以上的文本');
      return;
    }
    setUploading(true);
    try {
      const res = await apiClient.post('/api/corpus/upload-text', {
        content: textContent,
        file_name: `粘贴文本 ${new Date().toLocaleDateString()}`,
      });
      setStyleSummary(res.data.style_summary);
      alert('上传成功！AI已分析你的写作风格');
      setTextContent('');
      fetchCorpusList();
    } catch (e: any) {
      alert('上传失败：' + (e.response?.data?.detail || e.message));
    } finally {
      setUploading(false);
    }
  };

  // 文件上传
  const handleFileUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await apiClient.post('/api/corpus/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStyleSummary(res.data.style_summary);
      alert('上传成功！AI已分析你的写作风格');
      setFile(null);
      fetchCorpusList();
    } catch (e: any) {
      alert('上传失败：' + (e.response?.data?.detail || e.message));
    } finally {
      setUploading(false);
    }
  };

  const deleteCorpus = async (id: number) => {
    if (!confirm('确定删除这条语料吗？')) return;
    try {
      await apiClient.delete(`/api/corpus/${id}`);
      setCorpusList(corpusList.filter(item => item.id !== id));
    } catch (e: any) {
      alert('删除失败：' + e.message);
    }
  };

  // 清空所有语料
  const clearAllCorpus = async () => {
    if (!confirm('确定清空所有语料吗？此操作不可撤销')) return;
    try {
      await apiClient.delete('/api/corpus/clear');
      setCorpusList([]);
      alert('已清空所有语料');
    } catch (e: any) {
      alert('清空失败：' + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] py-6 px-4 md:py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📂 个人语料库</h1>
          <button onClick={() => navigate('/')} className="text-sm text-purple-500 hover:underline">
            ← 返回首页
          </button>
        </div>

        {/* 上传区域 */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <h3 className="font-bold text-gray-800 mb-2">📤 让AI学习你的写作风格</h3>
          <p className="text-sm text-gray-400 mb-4">
            上传或粘贴你写过的文章、周报、邮件等文本，AI将分析你的写作风格，后续转换会参考这些风格。
          </p>

          {/* 模式切换 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setInputMode('text')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                inputMode === 'text'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-white/50 text-gray-600 hover:bg-white/80'
              }`}
            >
              ✏️ 粘贴文本
            </button>
            <button
              onClick={() => setInputMode('file')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                inputMode === 'file'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-white/50 text-gray-600 hover:bg-white/80'
              }`}
            >
              📎 上传文件
            </button>
          </div>

          {/* 文本粘贴模式 */}
          {inputMode === 'text' && (
            <div>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="w-full h-48 p-4 bg-white/60 border border-gray-200 rounded-xl resize-none text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all placeholder:text-gray-400/60"
                placeholder="在此粘贴你的写作样本（至少50个字符，建议500字以上效果更好）"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{textContent.length} 字符</span>
                <span>{textContent.length < 50 ? '⚠️ 至少需要50个字符' : '✅ 可以提交'}</span>
              </div>
              <button
                onClick={handleTextUpload}
                disabled={uploading || textContent.length < 50}
                className="mt-3 btn-primary text-white px-6 py-2 rounded-xl text-sm disabled:opacity-50"
              >
                {uploading ? '分析中...' : '提交并分析'}
              </button>
            </div>
          )}

          {/* 文件上传模式 */}
          {inputMode === 'file' && (
            <div>
              <input
                type="file"
                accept=".txt,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-600 hover:file:bg-purple-100"
              />
              {file && (
                <div className="mt-2 text-sm text-gray-600">
                  已选择：{file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
              <button
                onClick={handleFileUpload}
                disabled={uploading || !file}
                className="mt-3 btn-primary text-white px-6 py-2 rounded-xl text-sm disabled:opacity-50"
              >
                {uploading ? '分析中...' : '上传并分析'}
              </button>
            </div>
          )}

          {styleSummary && (
            <div className="mt-4 p-3 bg-purple-50 rounded-xl text-sm text-gray-600">
              <strong>📊 风格分析结果：</strong>
              <div className="mt-1">{styleSummary}</div>
            </div>
          )}
        </div>

        {/* 已上传列表 */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">📚 已上传的语料</h3>
          {corpusList.length > 0 && (
            <button
              onClick={clearAllCorpus}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              🗑️ 清空所有
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-10">加载中...</div>
        ) : corpusList.length === 0 ? (
          <div className="glass-card rounded-3xl p-8 text-center text-gray-400">
            <span className="text-4xl block mb-2">📭</span>
            还没有上传任何语料，上传后AI将学习你的写作风格
          </div>
        ) : (
          <div className="space-y-3">
            {corpusList.map((item) => (
              <div key={item.id} className="glass-card rounded-2xl p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                      <span>📄 {item.file_name}</span>
                      <span>· {new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    {item.style_summary && (
                      <div className="text-sm text-gray-600 bg-purple-50 p-2 rounded-lg mt-1 line-clamp-3">
                        {item.style_summary}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteCorpus(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-4"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};