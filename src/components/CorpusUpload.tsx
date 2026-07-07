import React, { useState } from 'react';
import apiClient from '@/api/client';

export const CorpusUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [styleSummary, setStyleSummary] = useState('');

  const handleUpload = async () => {
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
    } catch (e) {
      alert('上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-bold text-gray-800 mb-3">📂 上传你的写作样本</h3>
      <p className="text-sm text-gray-400 mb-4">
        上传你之前写过的文章（支持 .txt / .docx），AI将学习你的个人风格
      </p>
      <input
        type="file"
        accept=".txt,.docx"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-600 hover:file:bg-purple-100"
      />
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="mt-4 btn-primary text-white px-6 py-2 rounded-xl text-sm disabled:opacity-50"
      >
        {uploading ? '分析中...' : '上传并分析'}
      </button>
      {styleSummary && (
        <div className="mt-4 p-3 bg-purple-50 rounded-xl text-sm text-gray-600">
          <strong>风格分析：</strong>{styleSummary}
        </div>
      )}
    </div>
  );
};