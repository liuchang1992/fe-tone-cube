import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '@/api/auth';
import { useAppStore } from '@/store/appStore';
import './AuthPage.less';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAppStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await login({ username, password });
      setUser({ username: result.username, isLoggedIn: true });
      navigate('/');
    } catch (err: any) {
      setError(err.message || '登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <h1 className="auth-title">
            语气<span className="gradient-text">魔方</span>
          </h1>
          <p className="auth-subtitle">登录以继续使用</p>
        </div>

        {error && (
          <div className="alert-message alert-message--error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="field-stack">
          <div>
            <label className="form-label">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              placeholder="请输入用户名"
              required
            />
          </div>
          <div>
            <label className="form-label">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="请输入密码"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary form-submit"
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="form-footer">
          还没有账号？ <Link to="/register" className="text-link">立即注册</Link>
        </p>
      </div>
    </div>
  );
};
