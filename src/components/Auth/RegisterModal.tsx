import React, { useRef, useState } from 'react';
import { Checkbox, message } from 'antd';
import { CloseOutlined, LockOutlined, UserAddOutlined, UserOutlined } from '@ant-design/icons';

import { login, register } from '@/api/auth';
import { trackFeature } from '@/api/analytics';
import { useAppStore } from '@/store/appStore';
import './RegisterModal.less';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

interface RegisterFieldErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
  agreed?: string;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
}) => {
  const { fetchQuota, setShowPersonalStyleOnboarding, setUser } = useAppStore();
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);
  const [agreed, setAgreed] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});

  if (!isOpen) return null;

  const resetForm = () => {
    setAgreed(false);
    setConfirmPassword('');
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
    const nextErrors: RegisterFieldErrors = {};

    if (!normalizedUsername) nextErrors.username = '请输入用户名';
    else if (normalizedUsername.length < 3 || normalizedUsername.length > 32) {
      nextErrors.username = '用户名长度应为 3～32 位';
    } else if (!/^[A-Za-z0-9_@.-]+$/.test(normalizedUsername)) {
      nextErrors.username = '用户名仅支持字母、数字及 _ @ . -';
    }

    if (!password) nextErrors.password = '请输入密码';
    else if (password.length < 8) nextErrors.password = '密码至少需要 8 位';
    else if (password.length > 128) nextErrors.password = '密码最多支持 128 位';

    if (!confirmPassword) nextErrors.confirmPassword = '请再次输入密码';
    else if (password !== confirmPassword) nextErrors.confirmPassword = '两次输入的密码不一致';

    if (!agreed) nextErrors.agreed = '请先阅读并同意隐私政策';

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (nextErrors.username) usernameInputRef.current?.focus();
      else if (nextErrors.password) passwordInputRef.current?.focus();
      else if (nextErrors.confirmPassword) confirmPasswordInputRef.current?.focus();
      else agreementRef.current?.focus();
      return;
    }

    setIsLoading(true);
    let registrationCompleted = false;
    try {
      await register({ username: normalizedUsername, password });
      registrationCompleted = true;
      trackFeature('register_success');

      const result = await login({ username: normalizedUsername, password });
      trackFeature('login_success');
      setUser({ username: result.username, isLoggedIn: true });
      await fetchQuota();

      message.success('注册成功，已自动登录');
      handleClose();
      window.setTimeout(() => setShowPersonalStyleOnboarding(true), 350);
    } catch (err: unknown) {
      if (registrationCompleted) {
        message.warning('注册成功，但自动登录失败，请手动登录');
        resetForm();
        onClose();
        onSwitchToLogin();
      } else {
        message.error(err instanceof Error ? err.message : '注册失败，请稍后再试');
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
            <h2>创建账号</h2>
            <p>保存转换记录，建立更贴近你的个人表达风格</p>
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
                placeholder="3-32 位用户名"
                autoComplete="username"
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={fieldErrors.username ? 'register-username-error' : undefined}
              />
            </div>
            {fieldErrors.username && (
              <span className="auth-field-error" id="register-username-error" role="alert">
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
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
                  }
                }}
                placeholder="至少 8 位"
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'register-password-error' : undefined}
              />
            </div>
            {fieldErrors.password && (
              <span className="auth-field-error" id="register-password-error" role="alert">
                {fieldErrors.password}
              </span>
            )}
          </label>

          <label className={`auth-field ${fieldErrors.confirmPassword ? 'auth-field--error' : ''}`}>
            <span>确认密码</span>
            <div className="auth-input-wrap">
              <UserAddOutlined />
              <input
                ref={confirmPasswordInputRef}
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
                  }
                }}
                placeholder="再次输入密码"
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={fieldErrors.confirmPassword ? 'register-confirm-password-error' : undefined}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <span className="auth-field-error" id="register-confirm-password-error" role="alert">
                {fieldErrors.confirmPassword}
              </span>
            )}
          </label>

          <div
            ref={agreementRef}
            tabIndex={-1}
            className={`auth-agreement-field ${fieldErrors.agreed ? 'auth-agreement-field--error' : ''}`}
          >
            <Checkbox
              checked={agreed}
              onChange={(event) => {
                setAgreed(event.target.checked);
                if (event.target.checked && fieldErrors.agreed) {
                  setFieldErrors((current) => ({ ...current, agreed: undefined }));
                }
              }}
            >
              <span className="auth-agreement">
                我已阅读并同意
                <a href="/privacy" target="_blank" rel="noreferrer">《隐私政策》</a>
              </span>
            </Checkbox>
            {fieldErrors.agreed && (
              <span className="auth-field-error" role="alert">{fieldErrors.agreed}</span>
            )}
          </div>

          <button type="submit" disabled={isLoading} className="auth-submit">
            {isLoading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="auth-footer">
          已有账号？
          <button onClick={() => { resetForm(); onSwitchToLogin(); }}>去登录</button>
        </p>
      </div>
    </div>
  );
};
