import React, { useEffect } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

import { trackFeature } from '@/api/analytics';
import { useAppStore } from '@/store/appStore';
import './CorpusOnboarding.less';

interface PersonalStyleOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PersonalStyleOnboarding: React.FC<PersonalStyleOnboardingProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const setPreserveConversionDraft = useAppStore((state) => state.setPreserveConversionDraft);

  useEffect(() => {
    if (!isOpen) return;
    trackFeature('personal_style_onboarding_view');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        trackFeature('personal_style_onboarding_skip');
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSkip = () => {
    trackFeature('personal_style_onboarding_skip');
    onClose();
  };

  const handleStart = () => {
    trackFeature('personal_style_onboarding_start');
    if (location.pathname === '/convert') {
      setPreserveConversionDraft(true);
    }
    onClose();
    navigate('/personal-styles?create=1');
  };

  return (
    <div className="corpus-onboarding-mask" onMouseDown={handleSkip}>
      <section
        className="corpus-onboarding"
        role="dialog"
        aria-modal="true"
        aria-labelledby="corpus-onboarding-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="corpus-onboarding__close"
          onClick={handleSkip}
          aria-label="暂时跳过"
        >
          <CloseOutlined />
        </button>

        <p className="corpus-onboarding__eyebrow">注册完成 · 下一步</p>
        <h2 id="corpus-onboarding-title">创建第一套个人风格</h2>
        <p className="corpus-onboarding__description">
          为常用场景建立一套可复用的表达方式。可以添加本人作品作为关联素材生成风格画像，也可以直接手动配置。
        </p>

        <ol className="corpus-onboarding__steps" aria-label="建立个人风格的步骤">
          <li><span>1</span>创建个人风格</li>
          <li><span>2</span>添加关联素材</li>
          <li><span>3</span>生成并微调</li>
        </ol>

        <p className="corpus-onboarding__hint">
          单份关联素材至少 50 字即可分析（累计 300 字以上分析相对稳定）；也可以直接手动填写风格配置。
        </p>

        <div className="corpus-onboarding__actions">
          <button type="button" className="corpus-onboarding__primary" onClick={handleStart}>
            创建个人风格
          </button>
          <button type="button" className="corpus-onboarding__secondary" onClick={handleSkip}>
            先试试文案转换
          </button>
        </div>
      </section>
    </div>
  );
};
