import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { InputArea } from '@/components/InputArea/InputArea';
import { StyleSelector } from '@/components/StyleSelector/StyleSelector';
import { OutputArea } from '@/components/OutputArea/OutputArea';
import { LoginModal } from '@/components/Auth/LoginModal';
import { RegisterModal } from '@/components/Auth/RegisterModal';
import { QuotaAlert } from '@/components/Quota/QuotaAlert';
import { Pay } from '@/pages/Pay';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { useAppStore } from '@/store/appStore';
import { History } from '@/pages/History';
import { Corpus } from '@/pages/Corpus';
import { Layout } from '@/components/Layout/Layout';
import './App.css';

// ========== 主页组件（包含弹窗） ==========
function HomePage() {
  const {
    convert,
    isLoading,
    // error,
    // setError,
    fetchQuota,
    // showLoginModal,
    // showRegisterModal,
    // showQuotaAlert,
    // setShowLoginModal,
    // setShowRegisterModal,
    // setShowQuotaAlert,
    user,
  } = useAppStore();

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  useEffect(() => {
    if (user.isLoggedIn) {
      fetchQuota();
    }
  }, [user.isLoggedIn, fetchQuota]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-start justify-center">
      <div className="w-full mx-auto">
        <div className="content">
          <div className="banner-tips">让每一句话，更有你的温度</div>
          <div className="agent-context">
            <div className="agent-input-area">
              <div className="agent-input-area-container">
                <div className="container-title">
                  <h2 className="title">输入原文</h2>
                </div>
                <InputArea />
              </div>
            </div>
            <div className="transform-icon">
              <i className="ts-icon"></i>
            </div>
            <div className="agent-output-area">
              <div className="agent-output-area-container">
                <div className="container-title">
                  <h2 className="title">转换结果</h2>
                  {isLoading && (
                    <div className="text-xs text-purple-500 flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                      <span>生成中…</span>
                    </div>
                  )}
                </div>
                <OutputArea />
              </div>
            </div>
          </div>

          <div className="quick-transform">
            <p className="quick-title">快速转换模板</p>
            <div className="flex flex-col ">
              <div className="flex-1">
                <StyleSelector />
              </div>
              <div className="transform-btn">
                <button
                  onClick={convert}
                  disabled={isLoading}
                  className="btn"
                >
                  {isLoading ? (
                    <>
                      <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      转换中…
                    </>
                  ) : (
                    <>
                      一键转换
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="ai-content-tips">
            <span>AI 生成内容仅供参考</span>
            <span>·</span>
            <span>语气魔方 v1.0</span>
            <span>·</span>
            <span>数据仅用于本次转换</span>
          </div>
        </div>
        
      </div>

      
    </div>
  );
}

// ========== 主 App ==========
function App() {
   const {
    showLoginModal,
    showRegisterModal,
    showQuotaAlert,
    setShowLoginModal,
    setShowRegisterModal,
    setShowQuotaAlert,
  } = useAppStore();

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#7c3aed', // 设置品牌色为紫色
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
      <Routes>
        <Route  path="/" element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pay" element={<Pay />} />
          <Route path="/history" element={<History />} />
          <Route path="/corpus" element={<Corpus />} />
        </Route>
      </Routes>

      {/* 弹窗 */}
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