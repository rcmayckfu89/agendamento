import React, { createContext, useContext, useEffect, useState } from 'react';
import { systemSettingsService, SystemSettingsState } from '../services/systemSettingsService';
import { useAuth } from './AuthContext';

interface SystemLockContextType extends SystemSettingsState {
    loading: boolean;
    error: string | null;
    refreshSystemLock: () => Promise<void>;
    setSystemBlocked: (isBlocked: boolean) => Promise<void>;
    setPaymentNoticeVisible: (isVisible: boolean) => Promise<void>;
}

const SystemLockContext = createContext<SystemLockContextType | undefined>(undefined);

export const SystemLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session } = useAuth();
    const [isBlocked, setIsBlocked] = useState(false);
    const [isPaymentNoticeVisible, setIsPaymentNoticeVisible] = useState(false);
    const [storageMode, setStorageMode] = useState<SystemSettingsState['storageMode']>('remote');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const applyState = (state: SystemSettingsState) => {
        setIsBlocked(state.isBlocked);
        setIsPaymentNoticeVisible(state.isPaymentNoticeVisible);
        setStorageMode(state.storageMode);
    };

    const refreshSystemLock = async () => {
        if (!session) {
            setIsBlocked(false);
            setIsPaymentNoticeVisible(false);
            setLoading(false);
            return;
        }

        try {
            const state = await systemSettingsService.getSystemSettings();
            applyState(state);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar status do sistema.');
        } finally {
            setLoading(false);
        }
    };

    const setSystemBlocked = async (nextBlocked: boolean) => {
        setLoading(true);
        try {
            const state = await systemSettingsService.updateSystemLock(nextBlocked);
            applyState(state);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar status de acesso.');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const setPaymentNoticeVisible = async (nextVisible: boolean) => {
        setLoading(true);
        try {
            const state = await systemSettingsService.updatePaymentNotice(nextVisible);
            applyState(state);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar aviso de mensalidade.');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshSystemLock();
    }, [session]);

    useEffect(() => {
        if (!session) return;

        const intervalId = window.setInterval(refreshSystemLock, 30000);
        return () => window.clearInterval(intervalId);
    }, [session]);

    return (
        <SystemLockContext.Provider value={{
            isBlocked,
            isPaymentNoticeVisible,
            storageMode,
            loading,
            error,
            refreshSystemLock,
            setSystemBlocked,
            setPaymentNoticeVisible
        }}>
            {children}
        </SystemLockContext.Provider>
    );
};

export const useSystemLock = () => {
    const context = useContext(SystemLockContext);
    if (!context) throw new Error('useSystemLock must be used within SystemLockProvider');
    return context;
};
