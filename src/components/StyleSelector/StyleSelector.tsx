import React, { useState } from 'react';
import {
  MailOutlined,
  MessageOutlined,
  SmileOutlined,
  SunOutlined,
  ToolOutlined,
  ReadOutlined
} from '@ant-design/icons';
import { FiHeart } from 'react-icons/fi';

import { useAppStore } from '@/store/appStore';
import './index.less';

const STYLE_OPTIONS = [
  { key: 'work-report', style: 'formal', label: '职场汇报', icon: ToolOutlined, color: '#3b82f6' },
  { key: 'xiaohongshu', style: 'xiaohongshu', label: '小红书种草', icon: FiHeart, color: '#ec4899' },
  { key: 'wechat', style: 'wechat', label: '微信聊天', icon: MessageOutlined, color: '#22c55e' },
  { key: 'humor', style: 'academic', label: '学术严谨', icon: ReadOutlined, color: '#eab308' },
  { key: 'greeting', style: 'marketing', label: '营销文案', icon: SunOutlined, color: '#f97316' },
];

export const StyleSelector: React.FC = () => {
  const { isLoading, selectedStyle, setStyle } = useAppStore();
  const [selectedTemplate, setSelectedTemplate] = useState('work-report');

  return (
    <div className="style-context">
      {STYLE_OPTIONS.map((style) => {
        const Icon = style.icon;
        const isActive = selectedTemplate === style.key || (!selectedTemplate && selectedStyle === style.style);

        return (
          <button
            key={style.key}
            onClick={() => {
              if (isLoading) return;
              setSelectedTemplate(style.key);
              setStyle(style.style);
            }}
            className={`style-item ${isActive ? 'style-active' : ''}`}
            disabled={isLoading}
          >
            <Icon className="style-icon" style={{ color: style.color }} />
            <span>{style.label}</span>
          </button>
        );
      })}
    </div>
  );
};
