import React, { useState } from 'react';
import { Checkbox, message } from 'antd';
import { CloseOutlined, LockOutlined, UserAddOutlined, UserOutlined } from '@ant-design/icons';

import { register } from '@/api/auth';
import './RegisterModal.less';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
}) => {
  const [agreed, setAgreed] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setAgreed(false);
    setConfirmPassword('');
    setPassword('');
    setUsername('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!agreed) {
      message.warning('请先阅读并同意隐私政策');
      return;
    }
    if (password !== confirmPassword) {
      message.warning('两次输入的密码不一致');
      return;
    }
    if (password.length < 8) {
      message.warning('密码长度至少 8 位');
      return;
    }

    setIsLoading(true);
    try {
      await register({ username, password });
      message.success('注册成功，请登录');
      resetForm();
      onClose();
      onSwitchToLogin();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '注册失败，请稍后再试');
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
            <h2>创建账号</h2>
            <p>保存你的转换记录，训练更贴近你的写作风格</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span>用户名</span>
            <div className="auth-input-wrap">
              <UserOutlined />
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="3-32 位用户名"
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
                placeholder="至少 8 位"
                autoComplete="new-password"
                required
              />
            </div>
          </label>

          <label className="auth-field">
            <span>确认密码</span>
            <div className="auth-input-wrap">
              <UserAddOutlined />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="再次输入密码"
                autoComplete="new-password"
                required
              />
            </div>
          </label>

          <Checkbox checked={agreed} onChange={(event) => setAgreed(event.target.checked)}>
            <span className="auth-agreement">
              我已阅读并同意
              <a href="/privacy" target="_blank" rel="noreferrer">《隐私政策》</a>
            </span>
          </Checkbox>

          <button type="submit" disabled={isLoading} className="auth-submit">
            {isLoading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="auth-footer">
          已有账号？
          <button onClick={onSwitchToLogin}>去登录</button>
        </p>
      </div>
    </div>
  );
};
