import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { logout } from '@/api/auth';

interface HeaderProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLoginClick, onRegisterClick }) => {
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

  const handleUpgrade = () => {
    if (user.isLoggedIn) {
      navigate('/pay');
    } else {
      onLoginClick();
    }
  };

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* Logo */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200/50">
          <span className="text-2xl">🎲</span>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight leading-tight">
            语气<span className="gradient-text">魔方</span>
          </h1>
          <p className="text-xs text-gray-400/80 font-medium tracking-wider mt-1">
            ✦ 一键切换文本语气 · AI 驱动
          </p>
        </div>
      </div>

      {/* 右侧操作区 */}
      <div className="flex items-center gap-3 flex-wrap">
        {user.isLoggedIn ? (
          // ===== 登录用户 =====
          <>
            <span className="text-sm text-gray-500">👤 {user.username}</span>

            {/* 历史记录按钮 */}
            <button
              onClick={() => navigate('/history')}
              className="px-4 py-2 text-sm font-medium text-gray-500 bg-white/50 backdrop-blur-sm rounded-full hover:bg-gray-100 transition-all border border-gray-200/50"
            >
              📜 历史
            </button>
            <button
              onClick={() => navigate('/corpus')}
              className="px-4 py-2 text-sm font-medium text-gray-500 bg-white/50 backdrop-blur-sm rounded-full hover:bg-gray-100 transition-all border border-gray-200/50"
            >
              📂 语料库
            </button>
            {isVip ? (
              <span className="px-3 py-1 text-xs font-bold text-yellow-700 bg-yellow-100 rounded-full border border-yellow-300">
                ⭐ 会员
              </span>
            ) : (
              <button
                onClick={handleUpgrade}
                className="px-3 py-1 text-xs font-bold text-purple-600 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors"
              >
                🔓 升级会员
              </button>
            )}

            <div className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full shadow-sm border border-white/50">
              <span className="text-sm text-gray-500 font-medium">今日剩余</span>
              <span className="text-sm font-bold text-purple-600">
                {remainingQuota === -1 ? '∞' : remainingQuota}
              </span>
              <span className="text-xs text-gray-400">次</span>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-500 bg-white/50 backdrop-blur-sm rounded-full hover:bg-gray-100 transition-all border border-gray-200/50"
            >
              退出
            </button>
          </>
        ) : (
          // ===== 未登录用户 =====
          <>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full shadow-sm border border-white/50">
              <span className="text-sm text-gray-500 font-medium">今日剩余</span>
              <span className="text-sm font-bold text-purple-600">{remainingQuota}</span>
              <span className="text-xs text-gray-400">次</span>
            </div>

            <button
              onClick={onLoginClick}
              className="px-5 py-2 text-sm font-semibold text-purple-600 bg-purple-50/80 backdrop-blur-sm rounded-full hover:bg-purple-100 transition-all border border-purple-200/50"
            >
              登录
            </button>
            <button
              onClick={onRegisterClick}
              className="px-5 py-2 text-sm font-semibold text-white btn-primary rounded-full"
            >
              注册
            </button>
          </>
        )}
      </div>
    </header>
  );
};