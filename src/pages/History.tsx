import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, message, Pagination, Spin, Empty } from 'antd';
import {
  ExclamationCircleFilled,
  ArrowLeftOutlined
} from '@ant-design/icons';
import apiClient from '@/api/client';
import { useAppStore } from '@/store/appStore';
import { getHistoryList, deleteHistoryItem, clearAllHistory, HistoryItem } from '@/api/history';

import './History.less';

const confirm = Modal.confirm;

export const History: React.FC = () => {
  const navigate = useNavigate();
  const { user, setShowLoginModal } = useAppStore();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    if (!user.isLoggedIn) {
      // navigate('/login');
      setShowLoginModal(true);
    }
  }, [user, navigate]);

  // 加载数据
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

  const deleteHistory = async (id: number) => {
    confirm({
      title: '提示',
      icon: <ExclamationCircleFilled />,
      content: '确定删除这条记录吗？',
      onOk: async() => {
        try {
          await deleteHistoryItem(id);
          message.success('删除成功');
          // 重新加载当前页
          fetchHistory(currentPage, pageSize);
        } catch (error) {
          message.error('删除失败');
        }
      },
      onCancel() {},
    });
  };

  // ========== 新增：清空所有历史 ==========
  const clearAllHistoryList = async () => {
    confirm({
      title: '提示',
      icon: <ExclamationCircleFilled />,
      content: '确定清空所有历史记录吗？此操作不可撤销',
      onOk: async() => {
        try {
          await clearAllHistory();
          message.success('已清空所有历史记录');
          setHistory([]);
          setTotal(0);
          setCurrentPage(1);
          fetchHistory(1, pageSize);
        } catch (error) {
          message.error('清空失败');
        }
      },
      onCancel() {},
    });
  };

  const copyText = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      message.info('复制失败，请手动复制');
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

  const onPageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1); // 改变每页条数时重置到第一页
    }
  };

  return (
    <div className="history-pages">
      <div className="history-wrapper">
        <div className="page-navigation">
          <div className="navigation" onClick={() => navigate('/')}>
            <ArrowLeftOutlined className="back-icon" />
            <h1 className="navigation-text">转换历史</h1>
          </div>
            {history.length > 0 && (
              <button
                onClick={clearAllHistoryList}
                className="delete-all"
              >
                清空所有
              </button>
            )}
        </div>
        {history.length === 0 ? (
          <div className="empty-history">
            <div className="empty-icon">📭</div>
            <p className="empty-tips">还没有转换记录</p>
            <p className="empty-sub-tips">去首页使用一次转换，记录会自动保存</p>
            <button
              onClick={() => navigate('/')}
              className="go-home-btn"
            >
              去转换
            </button>
          </div>
        ) : (
          <div>
              <p className="user-tips">用户转换记录目前只保存3天，使用时请注意。</p>
              <div className="history-list">
                {history.map((item) => (
                  <div key={item.id} className="list-item">
                    <div className="item-info">
                      <div className="time-info">
                        <p className="time">{formatDate(item.created_at)}</p>
                        <p className="style">{item.style}</p>
                      </div>
                      <div className="operate-context">
                        <button
                          onClick={() => copyText(item.output_text, item.id)}
                          className={`copy-item ${
                            copiedId === item.id
                              ? 'success'
                              : 'info'
                          }`}
                          title="复制转换结果"
                        >
                          {copiedId === item.id ? '已复制' : '复制'}
                        </button>
                        <button
                          onClick={() => deleteHistory(item.id)}
                          className="delete-item"
                          title="删除"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    <div className="source-text">
                        原文：{item.input_text}
                    </div>
                    <div className="transform-text">
                        转换：{item.output_text}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={total}
                    onChange={onPageChange}
                    showSizeChanger
                    pageSizeOptions={['5', '10', '20', '50']}
                    showTotal={(total) => `共 ${total} 条记录`}
                  />
                </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};