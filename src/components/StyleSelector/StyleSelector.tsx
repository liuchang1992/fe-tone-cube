import React, { useEffect, useMemo, useState } from 'react';
import {
  CustomerServiceOutlined,
  EditOutlined,
  PictureOutlined,
  MailOutlined,
  MessageOutlined,
  NotificationOutlined,
  SmileOutlined,
  SunOutlined,
  ToolOutlined,
  ReadOutlined,
  PlusOutlined,
  StarFilled,
  UserOutlined,
} from '@ant-design/icons';
import { FiHeart } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import type { RewriteStrength } from '@/api/convert';
import { listPersonalStyles, type PersonalStyle } from '@/api/personalStyles';
import { useAppStore } from '@/store/appStore';
import './index.less';

const STYLE_OPTIONS = [
  { key: 'work-report', style: 'formal', label: '职场汇报', icon: ToolOutlined, color: '#3b82f6' },
  { key: 'email', style: 'email', label: '邮件沟通', icon: MailOutlined, color: '#2563eb' },
  { key: 'concise', style: 'concise', label: '简洁直接', icon: EditOutlined, color: '#64748b' },
  { key: 'polite', style: 'polite', label: '温和礼貌', icon: SmileOutlined, color: '#14b8a6' },
  { key: 'wechat', style: 'wechat', label: '微信聊天', icon: MessageOutlined, color: '#22c55e' },
  { key: 'greeting', style: 'marketing', label: '营销文案', icon: SunOutlined, color: '#f97316' },
  { key: 'customer-service', style: 'customer_service', label: '客户沟通', icon: CustomerServiceOutlined, color: '#0ea5e9' },
  { key: 'xiaohongshu', style: 'xiaohongshu', label: '小红书种草', icon: FiHeart, color: '#ec4899' },
  { key: 'short-video', style: 'short_video', label: '短视频口播', icon: NotificationOutlined, color: '#8b5cf6' },
  { key: 'professional', style: 'academic', label: '专业严谨', icon: ReadOutlined, color: '#eab308' },
  { key: 'moments', style: 'moments', label: '朋友圈分享', icon: PictureOutlined, color: '#f43f5e' },
];

const STRENGTH_OPTIONS: Array<{
  value: RewriteStrength;
  label: string;
  description: string;
}> = [
  { value: 'light', label: '仅润色', description: '替换措辞、调整语气，保留原有句式和段落' },
  { value: 'standard', label: '常规改写', description: '可以重写句子、调整局部顺序，适合多数内容' },
  { value: 'deep', label: '结构重组', description: '可以重排句子和段落，但不改变事实与原意' },
];

export const StyleSelector: React.FC = () => {
  const navigate = useNavigate();
  const {
    isLoading,
    isDocumentLoading,
    selectedStyle,
    selectedPersonalStyleId,
    selectedRewriteStrength,
    setStyle,
    setPersonalStyle,
    setRewriteStrength,
    user,
  } = useAppStore();
  const [selectedTemplate, setSelectedTemplate] = useState('work-report');
  const [personalStyles, setPersonalStyles] = useState<PersonalStyle[]>([]);
  const [stylesOwner, setStylesOwner] = useState('');
  const selectionDisabled = isLoading || isDocumentLoading;
  const availablePersonalStyles = useMemo(
    () => (stylesOwner === user.username ? personalStyles : []),
    [personalStyles, stylesOwner, user.username],
  );

  useEffect(() => {
    let active = true;
    if (!user.isLoggedIn) {
      return () => { active = false; };
    }
    listPersonalStyles()
      .then((items) => {
        if (!active) return;
        const activeStyles = items.filter((item) => item.status === 'active' && item.current_version > 0);
        setPersonalStyles(activeStyles);
        setStylesOwner(user.username);
        const defaultStyle = activeStyles.find((item) => item.is_default);
        if (!useAppStore.getState().selectedPersonalStyleId && defaultStyle) {
          setPersonalStyle(defaultStyle.id, defaultStyle.name, defaultStyle.current_version);
        }
      })
      .catch(() => {
        if (active) {
          setPersonalStyles([]);
          setStylesOwner(user.username);
        }
      });
    return () => { active = false; };
  }, [setPersonalStyle, user.isLoggedIn, user.username]);

  const selectedPersonalStyle = useMemo(
    () => availablePersonalStyles.find((item) => item.id === selectedPersonalStyleId),
    [availablePersonalStyles, selectedPersonalStyleId],
  );
  const selectedStrength = STRENGTH_OPTIONS.find(
    (item) => item.value === selectedRewriteStrength,
  ) || STRENGTH_OPTIONS[1];

  useEffect(() => {
    if (selectedPersonalStyleId && stylesOwner === user.username && !selectedPersonalStyle) {
      const defaultStyle = availablePersonalStyles.find((item) => item.is_default);
      setPersonalStyle(
        defaultStyle?.id || null,
        defaultStyle?.name,
        defaultStyle?.current_version,
      );
    }
  }, [availablePersonalStyles, selectedPersonalStyle, selectedPersonalStyleId, setPersonalStyle, stylesOwner, user.username]);

  return (
    <>
      <div className="style-context">
        {STYLE_OPTIONS.map((style) => {
          const Icon = style.icon;
          const isActive = selectedTemplate === style.key || (!selectedTemplate && selectedStyle === style.style);

          return (
            <button
              key={style.key}
              onClick={() => {
                if (selectionDisabled) return;
                setSelectedTemplate(style.key);
                setStyle(style.style);
              }}
              className={`style-item ${isActive ? 'style-active' : ''}`}
              disabled={selectionDisabled}
            >
              <Icon className="style-icon" style={{ color: style.color }} />
              <span>{style.label}</span>
            </button>
          );
        })}
      </div>

      <div className="rewrite-strength" aria-label="改写方式">
        <span className="rewrite-strength__label">改写方式</span>
        <div className="rewrite-strength__options">
          {STRENGTH_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.value}
              className={selectedRewriteStrength === option.value ? 'active' : ''}
              aria-pressed={selectedRewriteStrength === option.value}
              disabled={selectionDisabled}
              onClick={() => setRewriteStrength(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p><span>决定允许怎样改</span>{selectedStrength.description}；个人风格仍决定表达习惯</p>
      </div>

      {user.isLoggedIn && (
        <div className="personal-style-picker">
          <div className="personal-style-picker__heading">
            <strong><UserOutlined /> 个人风格</strong>
            <span>控制用词、语气和表达习惯</span>
          </div>
          <div className="personal-style-picker__options">
            <button
              type="button"
              className={!selectedPersonalStyleId ? 'active' : ''}
              disabled={selectionDisabled}
              onClick={() => setPersonalStyle(null)}
            >
              不使用个人风格
            </button>
            {availablePersonalStyles.map((style) => (
              <button
                type="button"
                key={style.id}
                className={selectedPersonalStyleId === style.id ? 'active' : ''}
                disabled={selectionDisabled}
              onClick={() => setPersonalStyle(style.id, style.name, style.current_version)}
              >
                {style.name}
                {style.is_default && <small className="is-default"><StarFilled /> 默认</small>}
                <small>v{style.current_version}</small>
              </button>
            ))}
            {availablePersonalStyles.length === 0 && (
              <span className="personal-style-picker__empty">生成风格画像后，就可以在这里选择</span>
            )}
          </div>
          <button
            type="button"
            className="personal-style-picker__manage"
            onClick={() => navigate('/personal-styles')}
          >
            <PlusOutlined /> 管理
          </button>
        </div>
      )}
    </>
  );
};
