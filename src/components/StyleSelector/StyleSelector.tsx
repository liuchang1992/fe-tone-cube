import React, { useEffect, useMemo, useState } from 'react';
import {
  BankOutlined,
  CustomerServiceOutlined,
  DownOutlined,
  EditOutlined,
  ExperimentOutlined,
  FileDoneOutlined,
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
  SwapOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Modal } from 'antd';
import { FiHeart } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import type { RewriteStrength } from '@/api/convert';
import { listPersonalStyles, type PersonalStyle } from '@/api/personalStyles';
import { useAppStore } from '@/store/appStore';
import './index.less';

const STYLE_OPTIONS = [
  { style: 'formal', label: '职场汇报', description: '工作进展、复盘与内部通知', icon: ToolOutlined, color: '#3b82f6' },
  { style: 'email', label: '邮件沟通', description: '结构清楚、措辞得体的邮件', icon: MailOutlined, color: '#2563eb' },
  { style: 'business', label: '商务沟通', description: '合作、方案与行动安排', icon: TeamOutlined, color: '#4f46e5' },
  { style: 'customer_service', label: '客户沟通', description: '专业回应客户问题与诉求', icon: CustomerServiceOutlined, color: '#0ea5e9' },
  { style: 'concise', label: '简洁直接', description: '压缩冗余，突出核心信息', icon: EditOutlined, color: '#64748b' },
  { style: 'polite', label: '温和礼貌', description: '降低冲突感，表达更有分寸', icon: SmileOutlined, color: '#14b8a6' },
  { style: 'government', label: '政务汇报', description: '规范稳健、口径统一的政务材料', icon: BankOutlined, color: '#b45309' },
  { style: 'research', label: '科研表达', description: '客观呈现问题、方法与研究结论', icon: ExperimentOutlined, color: '#0891b2' },
  { style: 'paper', label: '论文写作', description: '强化概念、论证和段落衔接', icon: FileDoneOutlined, color: '#7c3aed' },
  { style: 'academic', label: '专业严谨', description: '适合通用专业说明与知识表达', icon: ReadOutlined, color: '#ca8a04' },
  { style: 'wechat', label: '微信聊天', description: '自然简短的即时沟通', icon: MessageOutlined, color: '#22c55e' },
  { style: 'xiaohongshu', label: '小红书种草', description: '轻松、有重点的内容分享', icon: FiHeart, color: '#ec4899' },
  { style: 'moments', label: '朋友圈分享', description: '适合熟人社交的日常表达', icon: PictureOutlined, color: '#f43f5e' },
  { style: 'marketing', label: '营销文案', description: '突出价值与行动引导', icon: SunOutlined, color: '#f97316' },
  { style: 'short_video', label: '短视频口播', description: '短句、有节奏、适合口头表达', icon: NotificationOutlined, color: '#8b5cf6' },
];

const STYLE_GROUPS = [
  { key: 'work', title: '职场商务', description: '工作、客户与合作沟通', styles: ['formal', 'email', 'business', 'customer_service', 'concise', 'polite'] },
  { key: 'professional', title: '政务学术', description: '规范材料、科研与论文表达', styles: ['government', 'research', 'paper', 'academic'] },
  { key: 'social', title: '内容社交', description: '社交平台、营销与口播内容', styles: ['wechat', 'xiaohongshu', 'moments', 'marketing', 'short_video'] },
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
  const [sceneOpen, setSceneOpen] = useState(false);
  const [expandedSceneGroup, setExpandedSceneGroup] = useState('work');
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
  const selectedScene = STYLE_OPTIONS.find((item) => item.style === selectedStyle) || STYLE_OPTIONS[0];
  const SelectedSceneIcon = selectedScene.icon;
  const selectedSceneGroup = STYLE_GROUPS.find((group) => group.styles.includes(selectedScene.style));

  const openScenePicker = () => {
    setExpandedSceneGroup(selectedSceneGroup?.key || STYLE_GROUPS[0].key);
    setSceneOpen(true);
  };

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
      <div className="scene-picker" aria-label="使用场景">
        <span className="scene-picker__label">使用场景</span>
        <span className="scene-picker__icon">
          <SelectedSceneIcon style={{ color: selectedScene.color }} />
        </span>
        <div className="scene-picker__copy">
          <strong>{selectedScene.label}</strong>
          <span>{selectedScene.description}</span>
        </div>
        <button type="button" disabled={selectionDisabled} onClick={openScenePicker}>
          <SwapOutlined /> 更换场景
        </button>
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

      <Modal
        title="选择使用场景"
        open={sceneOpen}
        onCancel={() => setSceneOpen(false)}
        footer={null}
        width={760}
        centered
        className="scene-picker-modal"
      >
        <p className="scene-picker-modal__intro">场景决定文案用途和常规表达方式，个人风格仍会优先控制你的用词与习惯。</p>
        <div className="scene-picker-groups">
          {STYLE_GROUPS.map((group) => {
            const expanded = expandedSceneGroup === group.key;
            return (
            <section key={group.key} className={`scene-picker-group ${expanded ? 'is-expanded' : ''}`}>
              <button
                type="button"
                className="scene-picker-group__heading"
                aria-expanded={expanded}
                aria-controls={`scene-picker-group-${group.key}`}
                onClick={() => setExpandedSceneGroup(group.key)}
              >
                <span className="scene-picker-group__copy">
                  <strong>{group.title}</strong>
                  <small>{group.description}</small>
                </span>
                <DownOutlined />
              </button>
              {expanded && <div id={`scene-picker-group-${group.key}`} className="scene-picker-group__options">
                {group.styles.map((styleKey) => {
                  const option = STYLE_OPTIONS.find((item) => item.style === styleKey);
                  if (!option) return null;
                  const Icon = option.icon;
                  const active = selectedStyle === option.style;
                  return (
                    <button
                      type="button"
                      key={option.style}
                      className={active ? 'is-active' : ''}
                      onClick={() => {
                        setStyle(option.style);
                        setSceneOpen(false);
                      }}
                    >
                      <span><Icon style={{ color: option.color }} /></span>
                      <div><strong>{option.label}</strong><small>{option.description}</small></div>
                    </button>
                  );
                })}
              </div>}
            </section>
            );
          })}
        </div>
      </Modal>
    </>
  );
};
