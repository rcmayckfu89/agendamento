import React, { createContext, useContext, useEffect, useState } from 'react';
import { systemSettingsService, SystemSettingsState } from '../services/systemSettingsService';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabaseClient';
import { isAdminEmail } from '../constants/admin';

interface SystemLockContextType extends SystemSettingsState {
    loading: boolean;
    error: string | null;
    refreshSystemLock: () => Promise<void>;
    setSystemBlocked: (isBlocked: boolean) => Promise<void>;
    setPaymentNoticeVisible: (isVisible: boolean) => Promise<void>;
    forceUserRelogin: () => Promise<void>;
}

const SystemLockContext = createContext<SystemLockContextType | undefined>(undefined);

export const SystemLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session, user, signOut } = useAuth();
    const [isBlocked, setIsBlocked] = useState(false);
    const [isPaymentNoticeVisible, setIsPaymentNoticeVisible] = useState(false);
    const [forceReloginAt, setForceReloginAt] = useState<string | null>(null);
    const [storageMode, setStorageMode] = useState<SystemSettingsState['storageMode']>('remote');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const applyState = (state: SystemSettingsState) => {
        setIsBlocked(state.isBlocked);
        setIsPaymentNoticeVisible(state.isPaymentNoticeVisible);
        setForceReloginAt(state.forceReloginAt);
        setStorageMode(state.storageMode);
    };

    const refreshSystemLock = async () => {
        if (!session) {
            setIsBlocked(false);
            setIsPaymentNoticeVisible(false);
            setForceReloginAt(null);
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

    const forceUserRelogin = async () => {
        setLoading(true);
        try {
            const state = await systemSettingsService.forceUserRelogin();
            applyState(state);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Erro ao forçar novo login dos usuários.');
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

        const channel = supabase
            .channel('app-settings-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'app_settings' },
                () => {
                    refreshSystemLock();
                }
            )
            .subscribe();

        const intervalId = window.setInterval(refreshSystemLock, 5000);

        refreshSystemLock();

        return () => {
            window.clearInterval(intervalId);
            supabase.removeChannel(channel);
        };
    }, [session]);

    useEffect(() => {
        if (!session || !forceReloginAt || isAdminEmail(user?.email)) return;

        const lastSignInAt = user?.last_sign_in_at || session.user?.last_sign_in_at;
        if (!lastSignInAt) return;

        if (new Date(lastSignInAt).getTime() < new Date(forceReloginAt).getTime()) {
            signOut().finally(() => {
                window.location.hash = '/login';
            });
        }
    }, [session, user?.email, user?.last_sign_in_at, forceReloginAt]);

    return (
        <SystemLockContext.Provider value={{
            isBlocked,
            isPaymentNoticeVisible,
            forceReloginAt,
            storageMode,
            loading,
            error,
            refreshSystemLock,
            setSystemBlocked,
            setPaymentNoticeVisible,
            forceUserRelogin
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
