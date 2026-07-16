import React, { useEffect } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

import { trackFeature } from '@/api/analytics';
import { useAppStore } from '@/store/appStore';
import './CorpusOnboarding.less';

interface CorpusOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CorpusOnboarding: React.FC<CorpusOnboardingProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const setPreserveConversionDraft = useAppStore((state) => state.setPreserveConversionDraft);

  useEffect(() => {
    if (!isOpen) return;
    trackFeature('corpus_onboarding_view');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        trackFeature('corpus_onboarding_skip');
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSkip = () => {
    trackFeature('corpus_onboarding_skip');
    onClose();
  };

  const handleStart = () => {
    trackFeature('corpus_onboarding_start');
    if (location.pathname === '/convert') {
      setPreserveConversionDraft(true);
    }
    onClose();
    navigate('/corpus');
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
        <h2 id="corpus-onboarding-title">让 AI 写得更像你</h2>
        <p className="corpus-onboarding__description">
          上传一篇你写过的文章或文案，AI 会分析你的用词、句式和表达习惯。之后转换文案时，会优先参考你的个人语气。
        </p>

        <ol className="corpus-onboarding__steps" aria-label="建立个人语气的步骤">
          <li><span>1</span>上传代表性语料</li>
          <li><span>2</span>分析表达习惯</li>
          <li><span>3</span>转换时自动参考</li>
        </ol>

        <p className="corpus-onboarding__hint">
          支持 50～15000 个字符，建议提供 500 字以上的完整内容，分析效果更准确。
        </p>

        <div className="corpus-onboarding__actions">
          <button type="button" className="corpus-onboarding__primary" onClick={handleStart}>
            建立我的语气
          </button>
          <button type="button" className="corpus-onboarding__secondary" onClick={handleSkip}>
            先试试文案转换
          </button>
        </div>
      </section>
    </div>
  );
};
