import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Pagination, message } from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownOutlined,
  FileTextOutlined,
  UpOutlined,
} from '@ant-design/icons';

import {
  type HistoryItem,
  clearAllHistory,
  deleteHistoryItem,
  getHistoryList,
} from '@/api/history';
import { trackFeature } from '@/api/analytics';
import { useAppStore } from '@/store/appStore';
import { formatBackendDateTime } from '@/utils/dateTime';
import './History.less';

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

  useEffect(() => {
    if (!user.isLoggedIn) {
      navigate('/');
    }
  }, [navigate, user.isLoggedIn]);

  useEffect(() => {
    if (user.isLoggedIn) {
      fetchHistory(currentPage, pageSize);
    }
  }, [user.isLoggedIn, currentPage, pageSize]);

  const fetchHistory = async (page: number, size: number) => {
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
  };

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

  return (
    <div className="history-page">
      <main className="history-wrapper">
        <div className="history-header">
          <button className="page-navigation" onClick={() => navigate('/')}>
            <ArrowLeftOutlined className="back-icon" />
            <span>历史记录</span>
          </button>

          {history.length > 0 && (
            <button onClick={clearAllHistoryList} className="clear-all-btn">
              清空所有
            </button>
          )}
        </div>

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
            <p>去首页完成一次转换，记录会自动保存在这里。</p>
            <button onClick={() => navigate('/')} className="go-home-btn">
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
                    <button className="history-card-summary" onClick={() => toggleExpanded(item.id)}>
                      <div className="history-summary-main">
                        <div className="history-meta">
                          <span className="history-time">
                            {formatDate(item.created_at)}
                          </span>
                          <span className="style-badge">{item.style}</span>
                        </div>
                        <p className="history-preview">{item.output_text}</p>
                      </div>
                      <span className="expand-indicator">
                        {expanded ? <UpOutlined /> : <DownOutlined />}
                      </span>
                    </button>

                    {expanded && (
                      <div className="history-card-body">
                        <div className="history-actions">
                          <button
                            onClick={() => copyText(item.output_text, item.id)}
                            className={`copy-btn ${copiedId === item.id ? 'copy-btn--done' : ''}`}
                          >
                            {copiedId === item.id ? <CheckOutlined /> : <CopyOutlined />}
                            {copiedId === item.id ? '已复制' : '复制结果'}
                          </button>
                          <button onClick={() => deleteHistory(item)} className="delete-btn">
                            <DeleteOutlined />
                            删除
                          </button>
                        </div>

                        <div className="history-text-grid">
                          <div className="text-block source-block">
                            <h3>原文</h3>
                            <p>{item.input_text}</p>
                          </div>
                          <div className="text-block result-block">
                            <h3>转换结果</h3>
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
    </div>
  );
};
