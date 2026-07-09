import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  FileDoneOutlined,
  CheckCircleOutlined,
  ExclamationCircleFilled,
  PlusOutlined
} from '@ant-design/icons';
import { Modal, message, Select, Tag, Tabs, Input, Button } from 'antd';
import { useAppStore } from '@/store/appStore';
// import apiClient from '@/api/client';
import { 
  uploadCorpusText, 
  uploadCorpusFile, 
  getCorpusList, 
  deleteCorpusItem,
  clearCorpus,
  CorpusItem 
} from '@/api/corpus';
import './Corpus.less';
const { TextArea } = Input;
const { TabPane } = Tabs;
const SCENE_OPTIONS = [
  { value: 'formal', label: '职场汇报' },
  { value: 'xiaohongshu', label: '小红书种草' },
  { value: 'wechat', label: '微信聊天' },
  { value: 'academic', label: '学术严谨' },
  { value: 'marketing', label: '营销文案' },
  { value: 'all', label: '全部场景' },
];

const SCENE_COLOR: Record<string, string> = {
  formal: 'blue',
  xiaohongshu: 'pink',
  wechat: 'green',
  academic: 'orange',
  marketing: 'red',
  all: 'default',
};

const confirm = Modal.confirm;

export const Corpus: React.FC = () => {
  const navigate = useNavigate();
  const { user, setShowLoginModal } = useAppStore();
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('text');
  const [uploading, setUploading] = useState(false);
  const [styleSummary, setStyleSummary] = useState('');
  const [corpusList, setCorpusList] = useState<CorpusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScene, setSelectedScene] = useState<string>('all');
  const [filterScene, setFilterScene] = useState<string | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');

  // 检查登录
  useEffect(() => {
    if (!user.isLoggedIn) {
      // navigate('/login');
      setShowLoginModal(true)
    }
  }, [user, navigate]);

    // 加载语料列表
  useEffect(() => {
    if (user.isLoggedIn) {
      fetchCorpusList();
    }
  }, [user.isLoggedIn, filterScene]);

  const fetchCorpusList = async () => {
    setLoading(true);
    try {
      const res = await getCorpusList(filterScene);
      setCorpusList(res.data);
    } catch (error) {
      message.error('加载语料列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 文本粘贴上传
  const handleTextUpload = async () => {
    if (!textContent.trim() || textContent.trim().length < 50) {
      message.warning('请至少输入50个字符以上的文本');
      return;
    }
    setUploading(true);
    try {
      await uploadCorpusText(textContent, `粘贴文本 ${new Date().toLocaleDateString()}`, selectedScene);
      message.success('上传成功！AI已分析你的写作风格');
      setTextContent('');
      fetchCorpusList();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 文件上传
  const handleFileUpload = async () => {
    console.log(1231)
    if (!selectedFile) {
      message.warning('请先选择文件');
      return;
    }
    setUploading(true);
    console.log(1321)
    try {
      await uploadCorpusFile(selectedFile, selectedScene);
      message.success('上传成功！AI已分析你的写作风格');
      setSelectedFile(null);
      // 重置文件 input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchCorpusList();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '上传失败');
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
          await deleteCorpusItem(id);
          message.success('删除成功');
          fetchCorpusList();
        } catch (error) {
          message.error('删除失败');
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
          await clearCorpus(filterScene);
          message.success('清空成功');
          fetchCorpusList();
        } catch (error) {
          message.error('清空失败');
        }
      },
      onCancel() {},
    });
  };

  const getSceneLabel = (scene: string) => {
    return SCENE_OPTIONS.find(s => s.value === scene)?.label || scene;
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
          {/* 场景选择（核心新增） */}
          <div className="choice-sence">
            <label className="choice-label">
              选择适用场景：
            </label>
            <Select
              value={selectedScene}
              onChange={setSelectedScene}
              options={SCENE_OPTIONS}
              style={{ width: 120 }}
              placeholder="选择场景"
            />
          </div>
          <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as 'text' | 'file')}>
            <TabPane tab="粘贴文本" key="text">
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
            </TabPane>
            <TabPane tab="上传文件" key="file">
              <p className="upload-tips">目前仅支持.doc、.txt文件</p>
              <div>
                <input
                  id="file-input"
                  type="file"
                  accept=".txt,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  style={{ display: 'block', marginBottom: 12 }}
                />
                {selectedFile && (
                  <div style={{ 
                    background: '#f5f5f5', 
                    padding: '8px 16px', 
                    borderRadius: 8, 
                    marginBottom: 12,
                    fontSize: 14
                  }}>
                    已选择：{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
                <div className="submit-container">
                  <button
                    onClick={handleFileUpload}
                    disabled={uploading || !selectedFile}
                    className="submit-btn"
                  >
                    {uploading ? '分析中...' : '上传并分析'}
                  </button>
                </div>
              </div>
            </TabPane>
          </Tabs>
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
                      <Tag color={SCENE_COLOR[item.scene] || 'default'}>
                        {getSceneLabel(item.scene)}
                      </Tag>
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