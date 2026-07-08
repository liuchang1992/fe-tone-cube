import React from 'react';
import { useAppStore } from '@/store/appStore';
import workImg from './../../assets/work.png';
import xhsImg from './../../assets/xhs.png';
import wechatImg from './../../assets/wechat.png';
import academicImg from './../../assets/greet.png';
import greetImg from './../../assets/greet.png';

import './index.less';

const STYLE_OPTIONS = [
  { id: 'formal', label: '职场汇报', icon:  workImg},
  { id: 'xiaohongshu', label: '小红书种草', icon: xhsImg },
  { id: 'wechat', label: '微信私聊', icon: wechatImg },
  { id: 'academic', label: '学术严谨', icon: academicImg },
  { id: 'marketing', label: '营销文案', icon: greetImg },
];

export const StyleSelector: React.FC = () => {
  const { selectedStyle, setStyle, isLoading } = useAppStore();

  return (
    <div className="style-context">
      {STYLE_OPTIONS.map((style) => (
        <button
          key={style.id}
          onClick={() => !isLoading && setStyle(style.id)}
          className={`
            style-btn style-item
            ${selectedStyle === style.id ? 'style-active' : ''}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          disabled={isLoading}
        >
          <img src={style.icon} className="style-icon" />
          <span>{style.label}</span>
        </button>
      ))}
    </div>
  );
};