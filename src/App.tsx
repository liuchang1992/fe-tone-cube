import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ConfigProvider, Modal } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { ArrowRightOutlined, CloseOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';

import { LoginModal } from '@/components/Auth/LoginModal';
import { AnalyticsTracker } from '@/components/Analytics/AnalyticsTracker';
import { RegisterModal } from '@/components/Auth/RegisterModal';
import { DocumentConvertButton } from '@/components/DocumentConvert/DocumentConvertButton';
import { FeedbackWidget } from '@/components/Feedback/FeedbackWidget';
import { InputArea } from '@/components/InputArea/InputArea';
import { Layout } from '@/components/Layout/Layout';
import { PersonalStyleOnboarding } from '@/components/Onboarding/CorpusOnboarding';
import { OutputArea } from '@/components/OutputArea/OutputArea';
import { PrivacyReviewModal } from '@/components/PrivacyReview/PrivacyReviewModal';
import { QuotaAlert } from '@/components/Quota/QuotaAlert';
import { SEOManager } from '@/components/SEO/SEOManager';
import { StyleSelector } from '@/components/StyleSelector/StyleSelector';
import { Corpus } from '@/pages/Corpus';
import { History } from '@/pages/History';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Pay } from '@/pages/Pay';
import { PersonalStyleDetail } from '@/pages/PersonalStyleDetail';
import { PersonalStyles } from '@/pages/PersonalStyles';
import { Privacy } from '@/pages/Privacy';
import { Register } from '@/pages/Register';
import { useAppStore } from '@/store/appStore';
import { trackFeature } from '@/api/analytics';
import { getReleaseNote } from '@/config/releaseNotes';
import type { PrivacyMaskResult } from '@/utils/privacyMasking';
import packageJson from '../package.json';
import './App.less';

const currentReleaseNote = getReleaseNote(packageJson.version);
const CONVERT_UPDATE_ID = currentReleaseNote
  ? `convert-update-${currentReleaseNote.version}`
  : null;

const hasSeenConvertUpdate = () => {
  if (!CONVERT_UPDATE_ID) return true;
  try {
    return window.localStorage.getItem('seenConvertUpdate') === CONVERT_UPDATE_ID;
  } catch {
    return false;
  }
};

const rememberConvertUpdate = () => {
  if (!CONVERT_UPDATE_ID) return;
  try {
    window.localStorage.setItem('seenConvertUpdate', CONVERT_UPDATE_ID);
  } catch {
    // Storage may be unavailable in private browsing; the prompt remains dismissible this session.
  }
};

function HomePage() {
  const {
    convert,
    fetchQuota,
    isLoading,
    setShowLoginModal,
    setShowRegisterModal,
    user,
  } = useAppStore();
  const [showGuestStyleTip, setShowGuestStyleTip] = useState(false);
  const [showUpdateTip, setShowUpdateTip] = useState(() => !hasSeenConvertUpdate());
  const [updateOpen, setUpdateOpen] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [privacyReviewOpen, setPrivacyReviewOpen] = useState(false);

  const dismissUpdateTip = () => {
    rememberConvertUpdate();
    setShowUpdateTip(false);
  };

  const openUpdate = () => {
    dismissUpdateTip();
    setUpdateOpen(true);
  };

  const runTextConvert = async (privacy?: PrivacyMaskResult) => {
    trackFeature('text_convert');
    await convert(privacy ? { requestText: privacy.maskedText, mappings: privacy.mappings } : undefined);
    const conversion = useAppStore.getState();
    if (
      !conversion.user.isLoggedIn
      && conversion.outputText
      && !sessionStorage.getItem('guestPersonalStyleTipShown')
    ) {
      sessionStorage.setItem('guestPersonalStyleTipShown', '1');
      setShowGuestStyleTip(true);
    }
  };

  const handleTextConvert = async () => {
    if (privacyMode) {
      const { inputText } = useAppStore.getState();
      if (!inputText.trim() || inputText.length > 2000) {
        await runTextConvert();
        return;
      }
      setPrivacyReviewOpen(true);
      return;
    }
    await runTextConvert();
  };

  const confirmPrivacyConvert = async (result: PrivacyMaskResult) => {
    await runTextConvert(result);
    if (useAppStore.getState().outputText) setPrivacyReviewOpen(false);
  };

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  useEffect(() => {
    if (user.isLoggedIn) {
      fetchQuota();
    }
  }, [user.isLoggedIn, fetchQuota]);

  return (
    <div className="home-page">
      <main className="content">
        <div className="convert-intro">
          <h1 className="banner-tips">让每一句文案，更像你</h1>
          {showUpdateTip && currentReleaseNote && (
            <aside className="convert-update-tip" aria-label="版本更新提示">
              <span className="convert-update-tip__badge">新</span>
              <p className="convert-update-tip__copy">
                <strong>{currentReleaseNote.tipTitle}</strong>
                <span>{currentReleaseNote.tipDescription}</span>
                <button type="button" className="convert-update-tip__action" onClick={openUpdate}>
                  查看更新
                </button>
              </p>
              <button
                type="button"
                className="convert-update-tip__close"
                aria-label="关闭版本更新提示"
                onClick={dismissUpdateTip}
              >
                <CloseOutlined />
              </button>
            </aside>
          )}
        </div>

        <section className="agent-context" aria-label="文字语气转换">
          <div className="agent-panel">
            <div className="container-title">
              <h2 className="title">原始文本</h2>
              <div className="input-title-actions">
                <button
                  type="button"
                  className={`privacy-mode-toggle ${privacyMode ? 'is-active' : ''}`}
                  aria-pressed={privacyMode}
                  disabled={isLoading}
                  title="敏感字段在浏览器本地替换，脱敏后再发送"
                  onClick={() => {
                    setPrivacyMode((current) => !current);
                    setPrivacyReviewOpen(false);
                  }}
                >
                  <span className="privacy-mode-toggle__label">
                    <LockOutlined /> 本地脱敏
                  </span>
                  <span className="privacy-mode-toggle__switch" aria-hidden="true">
                    <i />
                  </span>
                </button>
                <DocumentConvertButton privacyMode={privacyMode} />
              </div>
            </div>
            <InputArea />
          </div>

          <button
            type="button"
            className="transform-icon"
            onClick={handleTextConvert}
            disabled={isLoading}
            aria-label={isLoading ? '正在转换' : '转换文本'}
            title={isLoading ? '正在转换' : '点击转换'}
          >
            {isLoading ? <span className="loading-spinner" /> : <ArrowRightOutlined />}
          </button>

          <div className="agent-panel">
            <div className="container-title">
              <h2 className="title">转换结果</h2>
              {isLoading && (
                <div className="loading-status">
                  <span className="pulse-dot" />
                  <span>生成中...</span>
                </div>
              )}
            </div>
            <OutputArea />
          </div>
        </section>

        {!user.isLoggedIn && showGuestStyleTip && (
          <aside className="guest-style-tip" aria-label="登录创建个人风格提示">
            <span className="guest-style-tip__icon"><UserOutlined /></span>
            <div className="guest-style-tip__copy">
              <strong>想让下一次转换更像你？</strong>
              <p>登录后可以创建多套个人风格，让魔方学习你的用词、句式和表达习惯。</p>
            </div>
            <div className="guest-style-tip__actions">
              <button
                type="button"
                className="is-primary"
                onClick={() => { setShowGuestStyleTip(false); setShowRegisterModal(true); }}
              >
                免费注册
              </button>
              <button
                type="button"
                onClick={() => { setShowGuestStyleTip(false); setShowLoginModal(true); }}
              >
                已有账号，登录
              </button>
            </div>
            <button
              type="button"
              className="guest-style-tip__close"
              aria-label="关闭提示"
              onClick={() => setShowGuestStyleTip(false)}
            >
              <CloseOutlined />
            </button>
          </aside>
        )}

        <section className="quick-transform" aria-label="快速转换模板">
          <p className="quick-title">使用场景</p>
          <StyleSelector />
          <div className="transform-btn">
            <button
              onClick={() => void handleTextConvert()}
              disabled={isLoading}
              className="btn"
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner" />
                  转换中...
                </>
              ) : (
                '一键转换'
              )}
            </button>
          </div>
          <p className="ai-disclaimer">语气魔方 · AI 辅助生成内容仅供参考。</p>
        </section>

        {currentReleaseNote && <Modal
          title={currentReleaseNote.modalTitle}
          open={updateOpen}
          onCancel={() => setUpdateOpen(false)}
          footer={null}
          width={560}
          centered
          className="convert-update-modal"
        >
          <p className="convert-update-modal__intro">
            {currentReleaseNote.introduction}
          </p>
          <div className="convert-update-list">
            {currentReleaseNote.items.map((item, index) => (
              <section key={`${currentReleaseNote.version}-${item.title}`}>
                <b>{String(index + 1).padStart(2, '0')}</b>
                <div><strong>{item.title}</strong><p>{item.description}</p></div>
              </section>
            ))}
          </div>
          <div className="convert-update-modal__footer">
            <span>{currentReleaseNote.footer}</span>
            <button type="button" onClick={() => setUpdateOpen(false)}>知道了</button>
          </div>
        </Modal>}

        {privacyReviewOpen && (
          <PrivacyReviewModal
            open
            text={useAppStore.getState().inputText}
            loading={isLoading}
            onCancel={() => setPrivacyReviewOpen(false)}
            onConfirm={(result) => void confirmPrivacyConvert(result)}
          />
        )}
      </main>
    </div>
  );
}

function RouteChangeReset() {
  const location = useLocation();
  const previousPath = useRef(location.pathname);
  const { preserveConversionDraft, reset, setPreserveConversionDraft } = useAppStore();

  useEffect(() => {
    if (previousPath.current !== location.pathname) {
      const previousIsPersonalStyle = previousPath.current.startsWith('/personal-styles');
      const nextIsPersonalStyle = location.pathname.startsWith('/personal-styles');
      const isProtectedDraftRoute =
        (previousPath.current === '/convert' && location.pathname === '/corpus') ||
        (previousPath.current === '/corpus' && location.pathname === '/convert') ||
        (previousPath.current === '/convert' && nextIsPersonalStyle) ||
        (previousIsPersonalStyle && location.pathname === '/convert') ||
        (previousIsPersonalStyle && nextIsPersonalStyle);

      if (preserveConversionDraft && isProtectedDraftRoute) {
        if (location.pathname === '/convert') setPreserveConversionDraft(false);
      } else {
        reset();
        if (preserveConversionDraft) setPreserveConversionDraft(false);
      }
      previousPath.current = location.pathname;
    }
  }, [location.pathname, preserveConversionDraft, reset, setPreserveConversionDraft]);

  return null;
}

function useIsMobileDevice() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUserAgent = /android|iphone|ipad|ipod|mobile|windows phone/.test(userAgent);

    const updateDeviceState = () => {
      setIsMobile(mobileQuery.matches || (coarsePointerQuery.matches && isMobileUserAgent));
    };

    updateDeviceState();
    mobileQuery.addEventListener('change', updateDeviceState);
    coarsePointerQuery.addEventListener('change', updateDeviceState);

    return () => {
      mobileQuery.removeEventListener('change', updateDeviceState);
      coarsePointerQuery.removeEventListener('change', updateDeviceState);
    };
  }, []);

  return isMobile;
}

function MobileDeviceGuide() {
  return (
    <main className="mobile-guide">
      <div className="mobile-guide__brand">
        <span className="mobile-guide__logo">
          <span />
        </span>
        <strong>语气魔方</strong>
      </div>

      <section className="mobile-guide__panel">
        <div className="mobile-guide__screen" aria-hidden="true">
          <span className="mobile-guide__screen-bar" />
          <span className="mobile-guide__screen-line mobile-guide__screen-line--wide" />
          <span className="mobile-guide__screen-line" />
          <span className="mobile-guide__screen-button" />
        </div>
        <h1>请在电脑端使用语气魔方</h1>
        <p>
          当前产品的文本编辑、语料分析和历史记录管理更适合在桌面端完成。请使用电脑浏览器打开当前网址，获得完整体验。
        </p>
      </section>
    </main>
  );
}

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#7c3aed',
          borderRadius: 12,
          fontFamily: 'inherit',
        },
        components: {
          Button: {
            borderRadius: 12,
            controlHeight: 40,
          },
          Input: {
            borderRadius: 12,
          },
        },
      }}
    >
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ConfigProvider>
  );
}

function AppContent() {
  const {
    setShowPersonalStyleOnboarding,
    setShowLoginModal,
    setShowQuotaAlert,
    setShowRegisterModal,
    showPersonalStyleOnboarding,
    showLoginModal,
    showQuotaAlert,
    showRegisterModal,
  } = useAppStore();
  const isMobileDevice = useIsMobileDevice();
  const mobileGuideEnabled = import.meta.env.VITE_MOBILE_GUIDE_ENABLED === 'true';
  const location = useLocation();
  const isMobileFriendlyPage = location.pathname === '/' || location.pathname === '/privacy';

  return (
    <>
      <AnalyticsTracker />
      <SEOManager />
      {mobileGuideEnabled && isMobileDevice && !isMobileFriendlyPage ? (
        <MobileDeviceGuide />
      ) : (
        <>
        <RouteChangeReset />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="convert" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pay" element={<Pay />} />
            <Route path="/history" element={<History />} />
            <Route path="/corpus" element={<Corpus />} />
            <Route path="/personal-styles" element={<PersonalStyles />} />
            <Route path="/personal-styles/:styleId" element={<PersonalStyleDetail />} />
            <Route path="/privacy" element={<Privacy />} />
          </Route>
        </Routes>
        <FeedbackWidget />

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
        />
        <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
        />
        <QuotaAlert
          isOpen={showQuotaAlert}
          onClose={() => setShowQuotaAlert(false)}
          onLogin={() => {
            setShowQuotaAlert(false);
            setShowLoginModal(true);
          }}
        />
        <PersonalStyleOnboarding
          isOpen={showPersonalStyleOnboarding}
          onClose={() => setShowPersonalStyleOnboarding(false)}
        />
        </>
      )}
    </>
  );
}

export default App;
