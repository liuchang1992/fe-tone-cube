import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from '@/components/Layout/Header';
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

// ========== 主页组件（包含弹窗） ==========
function HomePage() {
  const {
    convert,
    isLoading,
    error,
    setError,
    fetchQuota,
    showLoginModal,
    showRegisterModal,
    showQuotaAlert,
    setShowLoginModal,
    setShowRegisterModal,
    setShowQuotaAlert,
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
    <div className="min-h-screen bg-[#f0f2f5] py-6 px-4 md:py-10 flex items-start justify-center">
      <div className="w-full max-w-6xl mx-auto">
        <Header
          onLoginClick={() => setShowLoginModal(true)}
          onRegisterClick={() => setShowRegisterModal(true)}
        />

        {error && (
          <div className="toast mb-4 p-4 bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-2xl text-red-600 flex justify-between items-center shadow-sm">
            <span className="flex items-center gap-2 text-sm">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-4">
          <div className="lg:col-span-2">
            <div className="glass-card rounded-3xl p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <span>📝</span> 输入原文
                </h2>
                <span className="text-xs text-gray-400 bg-white/40 px-2 py-0.5 rounded-full">支持 2000 字</span>
              </div>
              <InputArea />
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="glass-card rounded-3xl p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <span>✨</span> 转换结果
                </h2>
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

        <div className="mt-6 glass-card rounded-3xl p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <StyleSelector />
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={convert}
                disabled={isLoading}
                className="btn-primary text-white font-semibold px-8 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-purple-200/60 w-full md:w-auto justify-center text-base"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    转换中…
                  </>
                ) : (
                  <>
                    <span className="text-xl">✨</span> 一键转换
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400/70 flex flex-wrap justify-center gap-x-4 gap-y-1">
          <span>AI 生成内容仅供参考</span>
          <span>·</span>
          <span>语气魔方 v1.0</span>
          <span>·</span>
          <span>数据仅用于本次转换</span>
        </div>
      </div>

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
    </div>
  );
}

// ========== 主 App ==========
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pay" element={<Pay />} />
        <Route path="/history" element={<History />} />
        <Route path="/corpus" element={<Corpus />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;