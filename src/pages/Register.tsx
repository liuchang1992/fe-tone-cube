import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { message } from 'antd';
import { login, register } from '@/api/auth';
import { useAppStore } from '@/store/appStore';
import './AuthPage.less';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { fetchQuota, setShowPersonalStyleOnboarding, setUser } = useAppStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (password.length < 6) {
      setError('密码长度至少 6 位');
      return;
    }

    setIsLoading(true);
    let registrationCompleted = false;
    try {
      await register({ username, password });
      registrationCompleted = true;

      const result = await login({ username, password });
      setUser({ username: result.username, isLoggedIn: true });
      await fetchQuota();

      message.success('注册成功，已自动登录');
      navigate('/convert');
      window.setTimeout(() => setShowPersonalStyleOnboarding(true), 350);
    } catch (err: unknown) {
      if (registrationCompleted) {
        setSuccess('注册成功，但自动登录失败，即将前往登录页...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(err instanceof Error ? err.message : '注册失败，请稍后重试');
      }
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
          <p className="auth-subtitle">创建你的账号</p>
        </div>

        {error && (
          <div className="alert-message alert-message--error">
            {error}
          </div>
        )}
        {success && (
          <div className="alert-message alert-message--success">
            {success}
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
              placeholder="请设置用户名"
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
              placeholder="至少 6 位"
              required
            />
          </div>
          <div>
            <label className="form-label">确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              placeholder="再次输入密码"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary form-submit"
          >
            {isLoading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="form-footer">
          已有账号？ <Link to="/login" className="text-link">去登录</Link>
        </p>
      </div>
    </div>
  );
};
