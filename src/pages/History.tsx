import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, message } from 'antd';
import {
  ExclamationCircleFilled,
  ArrowLeftOutlined
} from '@ant-design/icons';
import apiClient from '@/api/client';
import { useAppStore } from '@/store/appStore';

import './History.less';

const confirm = Modal.confirm;

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
    confirm({
      title: '提示',
      icon: <ExclamationCircleFilled />,
      content: '确定删除这条记录吗？',
      onOk: async() => {
        try {
          await apiClient.delete(`/api/history/${id}`);
          setHistory(history.filter(item => item.id !== id));
        } catch (err: any) {
          message.info('删除失败');
        }
      },
      onCancel() {},
    });
  };

  // ========== 新增：清空所有历史 ==========
  const clearAllHistory = async () => {
    confirm({
      title: '提示',
      icon: <ExclamationCircleFilled />,
      content: '确定清空所有历史记录吗？此操作不可撤销',
      onOk: async() => {
        try {
          await apiClient.delete('/api/history/clear');
          setHistory([]);
          message.info('已清空所有历史记录');
        } catch (err: any) {
          message.info('清空失败');
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

  return (
    <div className="history-pages">
      <div className="history-wrapper">
        <div className="page-navigation" onClick={() => navigate('/')}>
          <div className="navigation">
            <ArrowLeftOutlined className="back-icon" />
            <h1 className="navigation-text">转换历史</h1>
          </div>
            {history.length > 0 && (
              <button
                onClick={clearAllHistory}
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
          </div>
        )}
      </div>
    </div>
  );
};