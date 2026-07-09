import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { logout } from '@/api/auth';
import {
  ClockCircleOutlined,
  ClusterOutlined,
  RocketOutlined
} from '@ant-design/icons';
import './index.less';

interface HeaderProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { remainingQuota, user, logout: storeLogout, fetchQuota } = useAppStore();

  const isVip = user.isVip || false;

  const handleLogout = () => {
    // 1. 清除本地 token 和用户名
    logout();
    // 2. 清除 store 中的用户状态
    storeLogout();
    // 3. 重新获取访客配额（变为访客模式）
    fetchQuota();

    // 4. 如果当前在需要登录的页面，跳转到首页
    const protectedPaths = ['/history', '/pay'];
    if (protectedPaths.includes(location.pathname)) {
      navigate('/');
    }
    // 否则停留在当前页面（首页会自动切换为未登录状态）
  };

  // const handleUpgrade = () => {
  //   if (user.isLoggedIn) {
  //     navigate('/pay');
  //   } else {
  //     onLoginClick();
  //   }
  // };

  // 判断当前路径是否匹配
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="header">
        <div className="logo-context cursor-pointer" onClick={() => navigate('/')}>
          <div className="logo">
            <span className="inner-logo"></span>
          </div>
          <h1 className="title">语气魔方</h1>
        </div>
        {user.isLoggedIn && (<div className="opreate-context">
            <div className={`opreate-item ${isActive('/history') ? 'active' : ''}`} onClick={() => navigate('/history')}>
              {/* <img src={historySvg} className="history-icon"/> */}
              <ClockCircleOutlined className="history-icon"/>
              <span className="item-text">历史记录</span>
            </div>
            <div className={`opreate-item ${isActive('/corpus') ? 'active' : ''}`} onClick={() => navigate('/corpus')}>
              <ClusterOutlined className="library-icon"/>
              <span className="item-text">个人语料库</span>
            </div>
            {/* <div className={`opreate-item ${isActive('/pay') ? 'active' : ''}`} onClick={handleUpgrade}>
              <RocketOutlined className="rocket-icon"/>
              <span className="item-text">升级会员</span>
            </div> */}
        </div>)}
        <div className="login-context">
          <div className="count-section">
            <span className="">剩余次数：</span>
            <span className="">{remainingQuota}</span>
          </div>
          {
            !user.isLoggedIn ? 
              (<button onClick={onLoginClick} className="login-btn">登录</button>) : 
              (<button onClick={handleLogout} className="login-btn">退出</button>)
          }
        </div>
      </header>
    </>
  );
};