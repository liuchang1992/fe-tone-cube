import React from 'react';
import { useAppStore } from '@/store/appStore';
import './index.less';

interface QuotaAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export const QuotaAlert: React.FC<QuotaAlertProps> = ({ isOpen, onClose, onLogin }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="quoat-alert" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">×</button>
        
        <div className="text-6xl mb-4">😅</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">今日免费次数已用完</h3>
        <p className="text-gray-500 text-sm mb-6">
          登录后可以获取每日赠送次数
        </p>
        <div className="go-login flex flex-col gap-3">
          <button
            onClick={onLogin}
            className="btn-primary text-white font-semibold py-3 rounded-xl text-base w-full"
          >
            登录 / 注册
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            明天再来
          </button>
        </div>
      </div>
    </div>
  );
};