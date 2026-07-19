import React, { useRef, useState } from 'react';
import { CloseOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { message } from 'antd';

import { login } from '@/api/auth';
import { trackFeature } from '@/api/analytics';
import { useAppStore } from '@/store/appStore';
import './LoginModal.less';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

interface LoginFieldErrors {
  username?: string;
  password?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
}) => {
  const { fetchQuota, setUser } = useAppStore();
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setFieldErrors({});
    setPassword('');
    setUsername('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedUsername = username.trim();
    const nextErrors: LoginFieldErrors = {};
    if (!normalizedUsername) nextErrors.username = '请输入用户名';
    else if (normalizedUsername.length < 3 || normalizedUsername.length > 32) {
      nextErrors.username = '用户名长度应为 3～32 位';
    }
    if (!password) nextErrors.password = '请输入密码';

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (nextErrors.username) usernameInputRef.current?.focus();
      else passwordInputRef.current?.focus();
      return;
    }

    setIsLoading(true);

    try {
      const result = await login({ username: normalizedUsername, password });
      trackFeature('login_success');
      setUser({ username: result.username, isLoggedIn: true });
      await fetchQuota();
      handleClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '登录失败，请稍后再试';
      if (errorMessage.includes('尚未注册')) {
        setFieldErrors({ username: errorMessage });
        usernameInputRef.current?.focus();
      } else if (errorMessage.includes('密码错误')) {
        setFieldErrors({ password: errorMessage });
        passwordInputRef.current?.focus();
      } else {
        message.error(errorMessage);
      }
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

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <label className={`auth-field ${fieldErrors.username ? 'auth-field--error' : ''}`}>
            <span>用户名</span>
            <div className="auth-input-wrap">
              <UserOutlined />
              <input
                ref={usernameInputRef}
                type="text"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  if (fieldErrors.username) {
                    setFieldErrors((current) => ({ ...current, username: undefined }));
                  }
                }}
                placeholder="请输入用户名"
                autoComplete="username"
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={fieldErrors.username ? 'login-username-error' : undefined}
              />
            </div>
            {fieldErrors.username && (
              <span className="auth-field-error" id="login-username-error" role="alert">
                {fieldErrors.username}
              </span>
            )}
          </label>

          <label className={`auth-field ${fieldErrors.password ? 'auth-field--error' : ''}`}>
            <span>密码</span>
            <div className="auth-input-wrap">
              <LockOutlined />
              <input
                ref={passwordInputRef}
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((current) => ({ ...current, password: undefined }));
                  }
                }}
                placeholder="请输入密码"
                autoComplete="current-password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
              />
            </div>
            {fieldErrors.password && (
              <span className="auth-field-error" id="login-password-error" role="alert">
                {fieldErrors.password}
              </span>
            )}
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
          <button onClick={() => { resetForm(); onSwitchToRegister(); }}>立即注册</button>
        </p>
      </div>
    </div>
  );
};
