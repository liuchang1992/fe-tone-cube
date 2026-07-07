import React, { useState } from 'react';
import { login } from '@/api/auth';
import { useAppStore } from '@/store/appStore';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToRegister }) => {
  const { setUser, fetchQuota } = useAppStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await login({ username, password });
      setUser({ username: result.username, isLoggedIn: true });
      await fetchQuota();
      onClose();
      // 重置表单
      setUsername('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || '登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card rounded-3xl p-8 max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">×</button>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">登录</h2>
          <p className="text-sm text-gray-400 mt-1">登录后可使用更多次数</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
              placeholder="请输入用户名"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
              placeholder="请输入密码"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full text-white font-semibold py-3 rounded-xl text-base"
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-4">
          还没有账号？{' '}
          <button onClick={onSwitchToRegister} className="text-purple-500 hover:underline">
            立即注册
          </button>
        </p>
      </div>
    </div>
  );
};