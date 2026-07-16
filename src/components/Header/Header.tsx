import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import {
  BookOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  SwapOutlined,
} from '@ant-design/icons';

import { logout } from '@/api/auth';
import { trackFeature } from '@/api/analytics';
import { useAppStore } from '@/store/appStore';
import './index.less';

interface HeaderProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
  showMobileNavigation?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onLoginClick, showMobileNavigation = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout: storeLogout, remainingQuota, user } = useAppStore();
  const isLandingPage = location.pathname === '/';

  const handleLogout = () => {
    trackFeature('logout');
    logout();
    storeLogout();

    if (['/history', '/pay', '/corpus'].includes(location.pathname)) {
      navigate('/convert', { replace: true });
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
    <>
    <header className="header">
      <button className="logo-context" onClick={() => navigate('/')} aria-label="返回首页">
        <span className="logo">
          <span className="inner-logo" />
        </span>
        <span className="title">语气魔方</span>
      </button>
      {!isLandingPage && <nav className="operate-context" aria-label="主导航">
        <button
          className={`operate-item ${isActive('/') ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          <HomeOutlined />
          <span>首页</span>
        </button>
        <button
          className={`operate-item ${isActive('/convert') ? 'active' : ''}`}
          onClick={() => navigate('/convert')}
        >
          <SwapOutlined />
          <span>开始转换</span>
        </button>
        {user.isLoggedIn ? <>
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
        </> : null}
      </nav>}
      {isLandingPage ? (
        <button
          type="button"
          className="landing-header-cta"
          onClick={() => {
            trackFeature('landing_start_convert');
            navigate('/convert');
          }}
        >
          开始使用
        </button>
      ) : (
        <div className="login-context">
          <div className="count-section">
            <span className="count-label-desktop">剩余次数：</span>
            <span className="count-label-mobile">剩余&nbsp;</span>
            <strong>{remainingQuota < 0 ? '∞' : remainingQuota}</strong>
          </div>
          {user.isLoggedIn ? (
            <button onClick={handleLogout} className="login-btn">退出</button>
          ) : (
            <button onClick={onLoginClick} className="login-btn">登录</button>
          )}
        </div>
      )}
    </header>
    {showMobileNavigation && (
      <nav className="mobile-bottom-nav" aria-label="移动端主导航">
        <button
          type="button"
          className={`mobile-nav-item ${isActive('/convert') ? 'active' : ''}`}
          onClick={() => navigate('/convert')}
        >
          <SwapOutlined />
          <span>转换</span>
        </button>
        <button
          type="button"
          className={`mobile-nav-item ${isActive('/history') ? 'active' : ''}`}
          onClick={() => goProtected('/history')}
        >
          <ClockCircleOutlined />
          <span>历史</span>
        </button>
        <button
          type="button"
          className={`mobile-nav-item ${isActive('/corpus') ? 'active' : ''}`}
          onClick={() => goProtected('/corpus')}
        >
          <BookOutlined />
          <span>语料库</span>
        </button>
      </nav>
    )}
    </>
  );
};
