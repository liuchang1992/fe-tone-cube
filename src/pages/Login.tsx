import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '@/api/auth';
import { useAppStore } from '@/store/appStore';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800">
            语气<span className="gradient-text">魔方</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">登录以继续使用</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
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
          还没有账号？ <Link to="/register" className="text-purple-500 hover:underline">立即注册</Link>
        </p>
      </div>
    </div>
  );
};