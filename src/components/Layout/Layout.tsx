import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header/Header';
import { useAppStore } from '@/store/appStore';

export const Layout: React.FC = () => {
    const {
        setShowLoginModal,
        setShowRegisterModal,
      } = useAppStore();
    return (
        <div>
            <Header
                onLoginClick={() => setShowLoginModal(true)}
                onRegisterClick={() => setShowRegisterModal(true)}
            />
            <Outlet />
        </div>
    )
}