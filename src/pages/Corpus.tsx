import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  FileTextOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { Modal, Pagination, message } from 'antd';

import {
  type CorpusItem,
  deleteCorpusItem,
  getCorpusList,
  uploadCorpusFile,
  uploadCorpusText,
} from '@/api/corpus';
import { useAppStore } from '@/store/appStore';
import './Corpus.less';

const MIN_TEXT_LENGTH = 50;

const SCENE_OPTIONS = [
  { value: 'all', label: '全部场景' },
  { value: 'formal', label: '职场汇报' },
  { value: 'xiaohongshu', label: '小红书种草' },
  { value: 'wechat', label: '微信聊天' },
  { value: 'academic', label: '学术严谨' },
  { value: 'marketing', label: '营销文案' },
];

export const Corpus: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAppStore();

  const [activeMode, setActiveMode] = useState<'text' | 'file'>('text');
  const [corpusList, setCorpusList] = useState<CorpusItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterScene, setFilterScene] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedScene, setSelectedScene] = useState('all');
  const [textContent, setTextContent] = useState('');
  const [total, setTotal] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user.isLoggedIn) {
      navigate('/');
    }
  }, [navigate, user.isLoggedIn]);

  useEffect(() => {
    if (user.isLoggedIn) {
      fetchCorpusList(currentPage, pageSize, filterScene);
    }
  }, [user.isLoggedIn, currentPage, pageSize, filterScene]);

  const fetchCorpusList = async (page: number, size: number, scene?: string) => {
    setLoading(true);
    try {
      const data = await getCorpusList(page, size, scene);
      setCorpusList(data.items);
      setTotal(data.total);
    } catch (error) {
      message.error('加载语料库失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const refreshFirstPage = async () => {
    setCurrentPage(1);
    await fetchCorpusList(1, pageSize, filterScene);
  };

  const handleSubmit = async () => {
    if (activeMode === 'text') {
      await handleTextUpload();
      return;
    }
    await handleFileUpload();
  };

  const handleTextUpload = async () => {
    const content = textContent.trim();
    if (content.length < MIN_TEXT_LENGTH) {
      message.warning(`请至少输入 ${MIN_TEXT_LENGTH} 个字符`);
      return;
    }

    setUploading(true);
    try {
      await uploadCorpusText(content, `粘贴文案 ${new Date().toLocaleDateString()}`, selectedScene);
      message.success('提交成功，魔方已完成风格分析');
      setTextContent('');
      await refreshFirstPage();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '提交失败');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      message.warning('请先选择文件');
      return;
    }

    setUploading(true);
    try {
      await uploadCorpusFile(selectedFile, selectedScene);
      message.success('上传成功，魔方已完成风格分析');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await refreshFirstPage();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (item: CorpusItem) => {
    Modal.confirm({
      title: '删除语料',
      content: `确定删除「${item.file_name}」吗？此操作不可撤销。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteCorpusItem(item.id);
          message.success('删除成功');
          const nextPage = corpusList.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
          setCurrentPage(nextPage);
          await fetchCorpusList(nextPage, pageSize, filterScene);
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

  const handleViewReport = (item: CorpusItem) => {
    Modal.info({
      title: item.file_name,
      content: (
        <div className="report-content">
          {item.style_summary || '暂无分析报告'}
        </div>
      ),
      okText: '知道了',
    });
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      setSelectedFile(droppedFile);
      setActiveMode('file');
    }
  };

  const onPageChange = (page: number, size?: number) => {
    if (size && size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1);
      return;
    }
    setCurrentPage(page);
  };

  const changeFilterScene = (scene: string) => {
    setFilterScene(scene === 'all' ? undefined : scene);
    setCurrentPage(1);
  };

  const getSceneLabel = (scene: string) => {
    return SCENE_OPTIONS.find((item) => item.value === scene)?.label || scene;
  };

  const formatMeta = (item: CorpusItem) => {
    const createdAt = new Date(item.created_at);
    const dateText = Number.isNaN(createdAt.getTime())
      ? item.created_at
      : createdAt.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
    return `${dateText} · ${getSceneLabel(item.scene)} · 已分析`;
  };

  return (
    <div className="library-page">
      <main className="library-wrapper">
        <button className="page-navigation" onClick={() => navigate('/')}>
          <ArrowLeftOutlined className="back-icon" />
          <span>语料库</span>
        </button>

        <section className="upload-card">
          <h1>让魔方学习你的写作风格</h1>
          <p className="upload-subtitle">上传你的文章或文案，魔方将分析你的语言风格特点</p>

          <div className="scene-selector">
            <span>适用类型</span>
            <div className="scene-options">
              {SCENE_OPTIONS.map((scene) => (
                <button
                  key={scene.value}
                  className={selectedScene === scene.value ? 'scene-option scene-option--active' : 'scene-option'}
                  onClick={() => setSelectedScene(scene.value)}
                >
                  {scene.label}
                </button>
              ))}
            </div>
          </div>

          <div className="upload-grid">
            <div className="paste-column">
              <h2>方式一：粘贴文案</h2>
              <button
                className={`mode-button ${activeMode === 'text' ? 'mode-button--active' : ''}`}
                onClick={() => setActiveMode('text')}
              >
                <FileTextOutlined />
                粘贴文案
              </button>
              <textarea
                value={textContent}
                onChange={(event) => {
                  setTextContent(event.target.value);
                  setActiveMode('text');
                }}
                className="corpus-textarea"
                placeholder="在此粘贴你的文章内容..."
              />
            </div>

            <div className="file-column">
              <h2>方式二：上传文档</h2>
              <p className="file-hint">支持 .doc .txt 格式</p>
              <div
                className={`drop-zone ${selectedFile ? 'drop-zone--selected' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
              >
                <InboxOutlined className="drop-icon" />
                <span>{selectedFile ? selectedFile.name : '点击或拖拽文件到此处'}</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.doc,.docx"
                className="hidden-file-input"
                onChange={(event) => {
                  setSelectedFile(event.target.files?.[0] || null);
                  setActiveMode('file');
                }}
              />
              <button className="upload-file-button" onClick={() => fileInputRef.current?.click()}>
                选择文件上传
              </button>
            </div>
          </div>

          <div className="submit-row">
            <button
              className="submit-analysis"
              onClick={handleSubmit}
              disabled={
                uploading ||
                (activeMode === 'text' && textContent.trim().length < MIN_TEXT_LENGTH) ||
                (activeMode === 'file' && !selectedFile)
              }
            >
              {uploading ? '分析中...' : '提交且分析'}
            </button>
          </div>
        </section>

        <section className="records-section">
          <div className="records-header">
            <h2>已上传语料分析记录</h2>
            <div className="filter-options">
              {SCENE_OPTIONS.map((scene) => {
                const activeValue = filterScene || 'all';
                return (
                  <button
                    key={scene.value}
                    className={activeValue === scene.value ? 'filter-option filter-option--active' : 'filter-option'}
                    onClick={() => changeFilterScene(scene.value)}
                  >
                    {scene.label}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="records-empty">加载中...</div>
          ) : corpusList.length === 0 ? (
            <div className="records-empty">还没有上传记录</div>
          ) : (
            <>
              <div className="records-list">
                {corpusList.map((item) => (
                  <article className="record-card" key={item.id}>
                    <div className="record-main">
                      <FileTextOutlined className="record-icon" />
                      <div className="record-info">
                        <h3>{item.file_name}</h3>
                        <p>{formatMeta(item)}</p>
                        <span className="status-badge">
                          <CheckCircleFilled />
                          已完成
                        </span>
                      </div>
                    </div>

                    <div className="record-actions">
                      <button onClick={() => handleViewReport(item)} className="view-report">
                        查看报告
                      </button>
                      <button onClick={() => handleDelete(item)} className="delete-record">
                        删除
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="corpus-pagination">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={total}
                  onChange={onPageChange}
                  showSizeChanger
                  pageSizeOptions={['5', '10', '20', '50']}
                  showTotal={(count) => `共 ${count} 条语料`}
                />
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
};
