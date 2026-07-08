import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  FileDoneOutlined,
  CheckCircleOutlined,
  ExclamationCircleFilled
} from '@ant-design/icons';
import { Modal, message } from 'antd';
import { useAppStore } from '@/store/appStore';
import apiClient from '@/api/client';
import './Corpus.less';

const confirm = Modal.confirm;

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
      message.info('请至少输入50个字符以上的文本');
      return;
    }
    setUploading(true);
    try {
      const res = await apiClient.post('/api/corpus/upload-text', {
        content: textContent,
        file_name: `粘贴文本 ${new Date().toLocaleDateString()}`,
      });
      setStyleSummary(res.data.style_summary);
      message.info('上传成功！AI已分析你的写作风格');
      setTextContent('');
      fetchCorpusList();
    } catch (e: any) {
      message.info('上传失败');
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
      message.info('上传成功！AI已分析你的写作风格');
      setFile(null);
      fetchCorpusList();
    } catch (e: any) {
      message.info('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const deleteCorpus = async (id: number) => {
    confirm({
      title: '提示',
      icon: <ExclamationCircleFilled />,
      content: '确定删除这条语料吗？',
      onOk: async() => {
        try {
          await apiClient.delete(`/api/corpus/${id}`);
          setCorpusList(corpusList.filter(item => item.id !== id));
        } catch (e: any) {
          message.warning('删除失败')
        }
      },
      onCancel() {},
    });
    
  };

  // 清空所有语料
  const clearAllCorpus = async () => {
    confirm({
      title: '提示',
      icon: <ExclamationCircleFilled />,
      content: '确定清空所有语料吗？此操作不可撤销',
      onOk: async() => {
        try {
          await apiClient.delete('/api/corpus/clear');
          setCorpusList([]);
          message.info('已清空所有语料');
        } catch (e: any) {
          message.info('清空失败');
        }
      },
      onCancel() {},
    });
    
  };

  return (
    <div className="library-container">
      <div className="container-wrapper">
        <div className="page-navigation" onClick={() => navigate('/')}>
          <ArrowLeftOutlined className="back-icon" />
          <h1 className="navigation-text">个人语料库</h1>
        </div>

        {/* 上传区域 */}
        <div className="upload-context">
          <h3 className="upload-title">让魔方学习你的写作风格</h3>
          <p className="sub-tips">上传或粘贴你写过的文章、周报、邮件等文本，AI将分析你的写作风格，后续转换会参考这些风格。</p>
          {/* 模式切换 */}
          <div className="upload-mode">
            <button
              onClick={() => setInputMode('text')}
              className={`upload-btn ${inputMode === 'text' ? 'active': ''}`}
            >
              粘贴文本
            </button>
            <button
              onClick={() => setInputMode('file')}
              className={`upload-btn ${inputMode === 'file' ? 'active': ''}`}
            >
              上传文件
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
                <span>{textContent.length < 50 ? '至少需要50个字符' : ''}</span>
              </div>
              <div className="submit-container">
                <button
                  onClick={handleTextUpload}
                  disabled={uploading || textContent.length < 50}
                  className="submit-btn"
                >
                  {uploading ? '分析中...' : '提交并分析'}
                </button>
              </div>
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
              <div className="submit-container">
                <button
                  onClick={handleFileUpload}
                  disabled={uploading || !file}
                  className="submit-btn"
                >
                  {uploading ? '分析中...' : '上传并分析'}
                </button>
              </div>
            </div>
          )}

          {styleSummary && (
            <div className="current-analysis bg-purple-50">
              <strong>风格分析结果：</strong>
              <div className="analysis-detail">{styleSummary}</div>
            </div>
          )}
        </div>

        {/* 已上传列表 */}
        <div className="analyzed-list-title">
          <h3 className="title">已上传语料分析记录</h3>
          {corpusList.length > 0 && (
            <button
              onClick={clearAllCorpus}
              className="delete-all"
            >
              清空所有
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
          <div className="analyzed-list">
            {corpusList.map((item) => (
              <div key={item.id} className="analyzed-item">
                <div className="item-detail">
                  <FileDoneOutlined className="file-icon" />
                  <div className="detail-info">
                      <p className="title">{item.file_name}</p>
                      <p className="time">{new Date(item.created_at).toLocaleDateString()}</p>
                      <div className="status-box">
                         <CheckCircleOutlined className="status-icon"/>
                         <p className="status">已完成</p>
                      </div>
                  </div>
                </div>
                <div className="item-operate">
                  <a href="javascript:;" className="view">查看报告</a>
                  <a href="javascript:;" className="delete" onClick={() => deleteCorpus(item.id)}>删除</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};