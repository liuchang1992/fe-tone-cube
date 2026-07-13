import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/components/Header/Header';
import { useAppStore } from '@/store/appStore';

export const Layout: React.FC = () => {
    const location = useLocation();
    const showMobileNavigation = ['/convert', '/history', '/corpus', '/pay'].includes(location.pathname);
    const {
        setShowLoginModal,
        setShowRegisterModal,
      } = useAppStore();
    return (
        <div className={showMobileNavigation ? 'app-layout app-layout--mobile-nav' : 'app-layout'}>
            <Header
                onLoginClick={() => setShowLoginModal(true)}
                onRegisterClick={() => setShowRegisterModal(true)}
                showMobileNavigation={showMobileNavigation}
            />
            <Outlet />
        </div>
    )
}
