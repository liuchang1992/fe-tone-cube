import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Pagination, Spin, message } from 'antd';
import {
  CheckOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  DownOutlined,
  FileTextOutlined,
  SwapOutlined,
} from '@ant-design/icons';

import {
  type HistoryItem,
  clearAllHistory,
  deleteHistoryItem,
  getHistoryComparison,
  getHistoryList,
  saveComparisonPreference,
} from '@/api/history';
import { trackFeature } from '@/api/analytics';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { useAppStore } from '@/store/appStore';
import { formatBackendDateTime } from '@/utils/dateTime';
import './History.less';

const STRENGTH_LABELS = {
  light: '仅润色',
  standard: '常规改写',
  deep: '结构重组',
} as const;

export const History: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonItems, setComparisonItems] = useState<HistoryItem[]>([]);
  const [comparisonPreference, setComparisonPreference] = useState<'personal' | 'baseline' | null>(null);

  const fetchHistory = useCallback(async (page: number, size: number) => {
    setLoading(true);
    try {
      const offset = (page - 1) * size;
      const data = await getHistoryList(size, offset);
      setHistory(data.items);
      setTotal(data.total);
    } catch (error) {
      message.error('加载历史记录失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user.isLoggedIn) {
      navigate('/');
    }
  }, [navigate, user.isLoggedIn]);

  useEffect(() => {
    if (!user.isLoggedIn) return;
    const timer = window.setTimeout(() => void fetchHistory(currentPage, pageSize), 0);
    return () => window.clearTimeout(timer);
  }, [user.isLoggedIn, currentPage, pageSize, fetchHistory]);

  const deleteHistory = (item: HistoryItem) => {
    Modal.confirm({
      title: '删除历史记录',
      content: '确定删除这条转换记录吗？此操作不可撤销。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        trackFeature('history_delete');
        try {
          await deleteHistoryItem(item.id);
          message.success('删除成功');
          await fetchHistory(currentPage, pageSize);
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

  const clearAllHistoryList = () => {
    Modal.confirm({
      title: '清空历史记录',
      content: '确定清空所有历史记录吗？此操作不可撤销。',
      okText: '清空',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        trackFeature('history_clear');
        try {
          await clearAllHistory();
          message.success('已清空所有历史记录');
          setExpandedId(null);
          setHistory([]);
          setTotal(0);
          setCurrentPage(1);
        } catch {
          message.error('清空失败');
        }
      },
    });
  };

  const copyText = async (text: string, id: number) => {
    trackFeature('history_copy');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      message.success('复制成功');
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      message.error('复制失败，请手动复制');
    }
  };

  const downloadResult = (item: HistoryItem) => {
    trackFeature('history_download');
    const sourceName = item.file_name?.replace(/\.[^.]+$/, '') || `文档转换-${item.id}`;
    const safeName = sourceName.replace(/[\\/:*?"<>|]/g, '-');
    const blob = new Blob([item.output_text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName}-转换结果.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    message.success('转换结果已下载');
  };

  const formatDate = (dateStr: string) => {
    return formatBackendDateTime(dateStr);
  };

  const onPageChange = (page: number, size?: number) => {
    if (size && size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1);
      setExpandedId(null);
      return;
    }
    setCurrentPage(page);
    setExpandedId(null);
  };

  const toggleExpanded = (id: number) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const openHistoryComparison = async (comparisonGroupId: string) => {
    setComparisonOpen(true);
    setComparisonLoading(true);
    setComparisonItems([]);
    try {
      const items = await getHistoryComparison(comparisonGroupId);
      setComparisonItems(items);
      setComparisonPreference(items[0]?.comparison_preference || null);
    } catch (error) {
      setComparisonOpen(false);
      message.error(error instanceof Error ? error.message : '对比记录加载失败');
    } finally {
      setComparisonLoading(false);
    }
  };

  const updateHistoryComparisonPreference = async (preference: 'personal' | 'baseline') => {
    const comparisonGroupId = comparisonItems[0]?.comparison_group_id;
    if (!comparisonGroupId || comparisonPreference) return;
    try {
      await saveComparisonPreference(comparisonGroupId, preference);
      setComparisonPreference(preference);
      setComparisonItems((items) => items.map((item) => ({ ...item, comparison_preference: preference })));
      setHistory((items) => items.map((item) => (
        item.comparison_group_id === comparisonGroupId
          ? { ...item, comparison_preference: preference }
          : item
      )));
      message.success('已记录你的选择，提交后不可修改');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '反馈保存失败');
    }
  };

  const baselineComparison = comparisonItems.find((item) => item.comparison_role === 'baseline');
  const personalComparison = comparisonItems.find((item) => item.comparison_role === 'personal');

  return (
    <div className="history-page">
      <main className="history-wrapper">
        <PageHeader
          title="历史记录"
          onBack={() => navigate('/convert')}
          action={history.length > 0 ? (
            <button onClick={clearAllHistoryList} className="clear-all-btn">
              清空所有
            </button>
          ) : undefined}
        />

        {/* <section className="history-summary-card">
          <div>
            <h1>你的转换历史</h1>
            <p>默认收起每条记录，展开后可查看完整原文与转换结果，浏览会更轻快。</p>
          </div>
          <div className="summary-count">
            <ClockCircleOutlined />
            <strong>{total}</strong>
            <span>条记录</span>
          </div>
        </section> */}

        {loading ? (
          <div className="history-empty">加载中...</div>
        ) : history.length === 0 ? (
          <section className="history-empty">
            <FileTextOutlined className="history-empty-icon" />
            <h2>还没有转换记录</h2>
            <p>去转换页完成一次转换，记录会自动保存在这里。</p>
            <button onClick={() => navigate('/convert')} className="go-home-btn">
              去转换
            </button>
          </section>
        ) : (
          <section className="history-section">
            <div className="history-list">
              {history.map((item) => {
                const expanded = expandedId === item.id;

                return (
                  <article key={item.id} className={`history-card ${expanded ? 'history-card--expanded' : ''}`}>
                    <button
                      className="history-card-summary"
                      onClick={() => toggleExpanded(item.id)}
                      aria-expanded={expanded}
                      aria-controls={`history-card-body-${item.id}`}
                    >
                      <div className="history-summary-main">
                        <div className="history-meta">
                          <span className="history-time">
                            {formatDate(item.created_at)}
                          </span>
                          <span className={`history-type-badge history-type-badge--${item.conversion_type}`}>
                            {item.conversion_type === 'document' ? '文档' : '文案'}
                          </span>
                          <span className="style-badge">{item.style}</span>
                          <span className="history-context-meta">
                            <span>{STRENGTH_LABELS[item.rewrite_strength] || '常规改写'}</span>
                            {item.custom_scene_name && (
                              <span>
                                自定义场景：{item.custom_scene_name}
                                {item.custom_scene_version ? ` v${item.custom_scene_version}` : ''}
                              </span>
                            )}
                            {item.personal_style_name && (
                              <span>
                                个人风格：{item.personal_style_name}
                                {item.personal_style_version ? ` v${item.personal_style_version}` : ''}
                              </span>
                            )}
                            {item.comparison_role && (
                              <span>
                                {item.comparison_role === 'baseline' ? '对比基准' : '对比个人版'}
                              </span>
                            )}
                            {item.file_name && (
                              <span className="history-file-name" title={item.file_name}>
                                {item.file_name}
                              </span>
                            )}
                          </span>
                        </div>
                        <p className="history-preview">{item.output_text}</p>
                      </div>
                      <span className="expand-indicator">
                        <DownOutlined />
                      </span>
                    </button>

                    {expanded && (
                      <div id={`history-card-body-${item.id}`} className="history-card-body">
                        <div className="history-actions">
                          <button
                            onClick={() => copyText(item.output_text, item.id)}
                            className={`copy-btn ${copiedId === item.id ? 'copy-btn--done' : ''}`}
                          >
                            {copiedId === item.id ? <CheckOutlined /> : <CopyOutlined />}
                            {copiedId === item.id ? '已复制' : '复制结果'}
                          </button>
                          {item.conversion_type === 'document' && (
                            <button onClick={() => downloadResult(item)} className="download-btn">
                              <DownloadOutlined />
                              下载结果
                            </button>
                          )}
                          {item.comparison_group_id && item.comparison_role && (
                            <button
                              onClick={() => void openHistoryComparison(item.comparison_group_id as string)}
                              className="compare-history-btn"
                            >
                              <SwapOutlined /> 查看对比
                            </button>
                          )}
                          <button onClick={() => deleteHistory(item)} className="delete-btn">
                            <DeleteOutlined />
                            删除
                          </button>
                        </div>

                        <div className="history-text-grid">
                          <div className="text-block source-block">
                            <h3>{item.conversion_type === 'document' ? '文档原文' : '原文'}</h3>
                            <p>{item.input_text}</p>
                          </div>
                          <div className="text-block result-block">
                            <h3>
                              完整转换结果
                              {item.personal_style_name && (
                                <small>
                                  · {item.personal_style_name}
                                  {item.personal_style_version ? ` v${item.personal_style_version}` : ''}
                                </small>
                              )}
                            </h3>
                            <p>{item.output_text}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="history-pagination">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                onChange={onPageChange}
                showSizeChanger
                pageSizeOptions={['5', '10', '20', '50']}
                showTotal={(count) => `共 ${count} 条记录`}
              />
            </div>
          </section>
        )}
      </main>

      <Modal
        title="历史效果对比"
        open={comparisonOpen}
        onCancel={() => !comparisonLoading && setComparisonOpen(false)}
        width={960}
        centered
        className="conversion-compare-modal history-compare-modal"
        footer={null}
      >
        {comparisonLoading ? (
          <div className="conversion-compare-loading"><Spin /><span>正在加载对比记录...</span></div>
        ) : baselineComparison && personalComparison ? (
          <div className="conversion-compare-grid">
            <section>
              <div className="conversion-compare-heading">
                <div><span>基准</span><strong>仅使用场景语气</strong></div>
                <small>{baselineComparison.output_text.length} 字</small>
              </div>
              <article>{baselineComparison.output_text}</article>
              <div className="conversion-compare-actions">
                <button type="button" onClick={() => void copyText(baselineComparison.output_text, baselineComparison.id)}>复制结果</button>
              </div>
            </section>
            <section className="is-personal">
              <div className="conversion-compare-heading">
                <div>
                  <span>个人风格</span>
                  <strong>{personalComparison.personal_style_name || '个人风格'}</strong>
                  {personalComparison.personal_style_version && <small>v{personalComparison.personal_style_version}</small>}
                </div>
                <small>{personalComparison.output_text.length} 字</small>
              </div>
              <article>{personalComparison.output_text}</article>
              <div className="conversion-compare-actions">
                <button type="button" onClick={() => void copyText(personalComparison.output_text, personalComparison.id)}>复制结果</button>
              </div>
            </section>
            <div className="conversion-compare-feedback">
              <span>{comparisonPreference ? '偏好已提交，不可修改' : '哪一个效果更好？'}</span>
              <button
                type="button"
                className={comparisonPreference === 'baseline' ? 'active' : ''}
                disabled={comparisonPreference !== null}
                onClick={() => void updateHistoryComparisonPreference('baseline')}
              >
                默认效果更好
              </button>
              <button
                type="button"
                className={comparisonPreference === 'personal' ? 'active' : ''}
                disabled={comparisonPreference !== null}
                onClick={() => void updateHistoryComparisonPreference('personal')}
              >
                个人风格更好
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
