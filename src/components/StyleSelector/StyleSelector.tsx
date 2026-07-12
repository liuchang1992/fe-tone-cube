import React, { useState } from 'react';
import {
  CustomerServiceOutlined,
  EditOutlined,
  PictureOutlined,
  HeartOutlined,
  MailOutlined,
  MessageOutlined,
  NotificationOutlined,
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
  { key: 'email', style: 'email', label: '邮件沟通', icon: MailOutlined, color: '#2563eb' },
  { key: 'professional', style: 'academic', label: '专业严谨', icon: ReadOutlined, color: '#eab308' },
  { key: 'greeting', style: 'marketing', label: '营销文案', icon: SunOutlined, color: '#f97316' },
  { key: 'customer-service', style: 'customer_service', label: '客户沟通', icon: CustomerServiceOutlined, color: '#0ea5e9' },
  { key: 'concise', style: 'concise', label: '简洁直接', icon: EditOutlined, color: '#64748b' },
  { key: 'polite', style: 'polite', label: '温和礼貌', icon: SmileOutlined, color: '#14b8a6' },
  { key: 'moments', style: 'moments', label: '朋友圈分享', icon: PictureOutlined, color: '#f43f5e' },
  { key: 'short-video', style: 'short_video', label: '短视频口播', icon: NotificationOutlined, color: '#8b5cf6' },
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
