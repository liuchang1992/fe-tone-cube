import React, { useState } from 'react';
import apiClient from '@/api/client';
import './CorpusUpload.less';

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
    } catch {
      alert('上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="corpus-upload glass-card">
      <h3 className="corpus-upload-title">📂 上传你的写作样本</h3>
      <p className="corpus-upload-desc">
        上传你之前写过的文章（支持 .txt / .docx），AI将学习你的个人风格
      </p>
      <input
        type="file"
        accept=".txt,.docx"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="corpus-file-input"
      />
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="btn-primary corpus-upload-btn"
      >
        {uploading ? '分析中...' : '上传并分析'}
      </button>
      {styleSummary && (
        <div className="corpus-upload-result">
          <strong>风格分析：</strong>{styleSummary}
        </div>
      )}
    </div>
  );
};
