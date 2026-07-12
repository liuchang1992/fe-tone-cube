import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { ArrowRightOutlined } from '@ant-design/icons';

import { LoginModal } from '@/components/Auth/LoginModal';
import { RegisterModal } from '@/components/Auth/RegisterModal';
import { DocumentConvertButton } from '@/components/DocumentConvert/DocumentConvertButton';
import { InputArea } from '@/components/InputArea/InputArea';
import { Layout } from '@/components/Layout/Layout';
import { OutputArea } from '@/components/OutputArea/OutputArea';
import { QuotaAlert } from '@/components/Quota/QuotaAlert';
import { StyleSelector } from '@/components/StyleSelector/StyleSelector';
import { Corpus } from '@/pages/Corpus';
import { History } from '@/pages/History';
import { Login } from '@/pages/Login';
import { Pay } from '@/pages/Pay';
import { Privacy } from '@/pages/Privacy';
import { Register } from '@/pages/Register';
import { useAppStore } from '@/store/appStore';
import './App.less';

function HomePage() {
  const { convert, fetchQuota, isLoading, user } = useAppStore();

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
        <h1 className="banner-tips">让每一句文案，更像你</h1>

        <section className="agent-context" aria-label="文字语气转换">
          <div className="agent-panel">
            <div className="container-title">
              <h2 className="title">原始文本</h2>
              <DocumentConvertButton />
            </div>
            <InputArea />
          </div>

          <div className="transform-icon" aria-hidden="true">
            <ArrowRightOutlined />
          </div>

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

        <section className="quick-transform" aria-label="快速转换模板">
          <p className="quick-title">使用场景</p>
          <StyleSelector />
          <div className="transform-btn">
            <button onClick={convert} disabled={isLoading} className="btn">
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
      </main>
    </div>
  );
}

function RouteChangeReset() {
  const location = useLocation();
  const previousPath = useRef(location.pathname);
  const reset = useAppStore((state) => state.reset);

  useEffect(() => {
    if (previousPath.current !== location.pathname) {
      reset();
      previousPath.current = location.pathname;
    }
  }, [location.pathname, reset]);

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
  const {
    setShowLoginModal,
    setShowQuotaAlert,
    setShowRegisterModal,
    showLoginModal,
    showQuotaAlert,
    showRegisterModal,
  } = useAppStore();
  const isMobileDevice = useIsMobileDevice();

  if (isMobileDevice) {
    return (
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#7c3aed',
            borderRadius: 12,
            fontFamily: 'inherit',
          },
        }}
      >
        <MobileDeviceGuide />
      </ConfigProvider>
    );
  }

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
        <RouteChangeReset />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pay" element={<Pay />} />
            <Route path="/history" element={<History />} />
            <Route path="/corpus" element={<Corpus />} />
            <Route path="/privacy" element={<Privacy />} />
          </Route>
        </Routes>

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
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
