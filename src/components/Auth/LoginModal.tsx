import React, { useState } from 'react';
import { CloseOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';

import { login } from '@/api/auth';
import { useAppStore } from '@/store/appStore';
import './LoginModal.less';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
}) => {
  const { fetchQuota, setUser } = useAppStore();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setError('');
    setPassword('');
    setUsername('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login({ username, password });
      setUser({ username: result.username, isLoggedIn: true });
      await fetchQuota();
      handleClose();
    } catch (err: any) {
      setError(err.message || '登录失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-mask" onClick={handleClose}>
      <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
        <button onClick={handleClose} className="auth-close" aria-label="关闭">
          <CloseOutlined />
        </button>

        <div className="auth-brand">
          {/* <span className="auth-logo">
            <span />
          </span> */}
          <div>
            <h2>欢迎回来</h2>
            <p>登录后同步你的转换历史与专属语料库</p>
          </div>
        </div>

        {error && <div className="auth-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span>用户名</span>
            <div className="auth-input-wrap">
              <UserOutlined />
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="请输入用户名"
                autoComplete="username"
                required
              />
            </div>
          </label>

          <label className="auth-field">
            <span>密码</span>
            <div className="auth-input-wrap">
              <LockOutlined />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
                autoComplete="current-password"
                required
              />
            </div>
          </label>

          <p className="auth-policy">
            登录即代表你已阅读并同意
            <a href="/privacy" target="_blank" rel="noreferrer">《隐私政策》</a>
          </p>

          <button type="submit" disabled={isLoading} className="auth-submit">
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="auth-footer">
          还没有账号？
          <button onClick={onSwitchToRegister}>立即注册</button>
        </p>
      </div>
    </div>
  );
};
