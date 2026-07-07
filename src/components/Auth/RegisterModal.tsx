import React, { useState } from 'react';
import { register } from '@/api/auth';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

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
    try {
      await register({ username, password });
      setSuccess('注册成功！请登录');
      setTimeout(() => {
        onClose();
        onSwitchToLogin();
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || '注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card rounded-3xl p-8 max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">×</button>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">注册</h2>
          <p className="text-sm text-gray-400 mt-1">创建你的账号</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
              placeholder="请设置用户名"
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
              placeholder="至少 6 位"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
              placeholder="再次输入密码"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full text-white font-semibold py-3 rounded-xl text-base"
          >
            {isLoading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-4">
          已有账号？{' '}
          <button onClick={onSwitchToLogin} className="text-purple-500 hover:underline">
            去登录
          </button>
        </p>
      </div>
    </div>
  );
};