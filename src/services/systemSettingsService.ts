import { supabase } from './supabaseClient';

const SYSTEM_BLOCKED_KEY = 'system_blocked';
const LOCAL_STORAGE_KEY = 'agenda_system_blocked';

export interface SystemLockState {
    isBlocked: boolean;
    storageMode: 'remote' | 'local';
}

const readLocalLock = (): SystemLockState => ({
    isBlocked: localStorage.getItem(LOCAL_STORAGE_KEY) === 'true',
    storageMode: 'local'
});

const writeLocalLock = (isBlocked: boolean): SystemLockState => {
    localStorage.setItem(LOCAL_STORAGE_KEY, String(isBlocked));
    return { isBlocked, storageMode: 'local' };
};

export const systemSettingsService = {
    async getSystemLock(): Promise<SystemLockState> {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', SYSTEM_BLOCKED_KEY)
            .maybeSingle();

        if (error) {
            console.warn('Configuracao global indisponivel, usando modo local:', error.message);
            return readLocalLock();
        }

        return {
            isBlocked: Boolean((data?.value as { isBlocked?: boolean } | null)?.isBlocked),
            storageMode: 'remote'
        };
    },

    async updateSystemLock(isBlocked: boolean): Promise<SystemLockState> {
        const { error } = await supabase
            .from('app_settings')
            .upsert({
                key: SYSTEM_BLOCKED_KEY,
                value: { isBlocked },
                updated_at: new Date().toISOString()
            } as any, { onConflict: 'key' });

        if (error) {
            console.warn('Nao foi possivel salvar no Supabase, usando modo local:', error.message);
            return writeLocalLock(isBlocked);
        }

        return { isBlocked, storageMode: 'remote' };
    }
};
