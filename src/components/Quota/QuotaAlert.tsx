import React from 'react';
import './index.less';

interface QuotaAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export const QuotaAlert: React.FC<QuotaAlertProps> = ({ isOpen, onClose, onLogin }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="quoat-alert" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="quota-close">×</button>
        
        <div className="quota-icon">😅</div>
        <h3 className="quota-title">今日免费次数已用完</h3>
        <p className="quota-desc">
          登录后可以获取每日赠送次数
        </p>
        <div className="go-login">
          <button
            onClick={onLogin}
            className="btn-primary quota-primary"
          >
            登录 / 注册
          </button>
          <button
            onClick={onClose}
            className="quota-secondary"
          >
            明天再来
          </button>
        </div>
      </div>
    </div>
  );
};
