import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import {
  BookOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

import { logout } from '@/api/auth';
import { trackFeature } from '@/api/analytics';
import { useAppStore } from '@/store/appStore';
import './index.less';

interface HeaderProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchQuota, logout: storeLogout, remainingQuota, user } = useAppStore();

  const handleLogout = () => {
    trackFeature('logout');
    logout();
    storeLogout();
    fetchQuota();

    if (['/history', '/pay', '/corpus'].includes(location.pathname)) {
      navigate('/');
    }

    message.success('退出成功');
  };

  const goProtected = (path: string) => {
    if (user.isLoggedIn) {
      navigate(path);
      return;
    }
    onLoginClick();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="header">
      <button className="logo-context" onClick={() => navigate('/')} aria-label="返回首页">
        <span className="logo">
          <span className="inner-logo" />
        </span>
        <span className="title">语气魔方</span>
      </button>
      {
        user.isLoggedIn ? (<nav className="operate-context" aria-label="主导航">
        <button
          className={`operate-item ${isActive('/history') ? 'active' : ''}`}
          onClick={() => goProtected('/history')}
        >
          <ClockCircleOutlined />
          <span>历史记录</span>
        </button>
        <button
          className={`operate-item ${isActive('/corpus') ? 'active' : ''}`}
          onClick={() => goProtected('/corpus')}
        >
          <BookOutlined />
          <span>语料库</span>
        </button>
        {/* <button
          className={`operate-item ${isActive('/pay') ? 'active' : ''}`}
          onClick={() => goProtected('/pay')}
        >
          <RocketOutlined />
          <span>升级会员</span>
        </button> */}
      </nav>) : null 
      }
      <div className="login-context">
        <div className="count-section">
          <span>剩余次数：</span>
          <strong>{remainingQuota < 0 ? '∞' : remainingQuota}</strong>
        </div>
        {/* <span className="user-avatar" aria-hidden="true">
          <UserOutlined />
        </span> */}
        {user.isLoggedIn ? (
          <button onClick={handleLogout} className="login-btn">退出</button>
        ) : (
          <button onClick={onLoginClick} className="login-btn">登录</button>
        )}
      </div>
    </header>
  );
};
