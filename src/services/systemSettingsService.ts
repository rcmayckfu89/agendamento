import { supabase } from './supabaseClient';

const SYSTEM_BLOCKED_KEY = 'system_blocked';
const PAYMENT_NOTICE_KEY = 'payment_notice_visible';
const FORCE_RELOGIN_KEY = 'force_relogin_at';
const LOCAL_SYSTEM_BLOCKED_KEY = 'agenda_system_blocked';
const LOCAL_PAYMENT_NOTICE_KEY = 'agenda_payment_notice_visible';
const LOCAL_FORCE_RELOGIN_KEY = 'agenda_force_relogin_at';

export interface SystemSettingsState {
    isBlocked: boolean;
    isPaymentNoticeVisible: boolean;
    forceReloginAt: string | null;
    storageMode: 'remote' | 'local';
}

const readLocalSettings = (): SystemSettingsState => ({
    isBlocked: localStorage.getItem(LOCAL_SYSTEM_BLOCKED_KEY) === 'true',
    isPaymentNoticeVisible: localStorage.getItem(LOCAL_PAYMENT_NOTICE_KEY) === 'true',
    forceReloginAt: localStorage.getItem(LOCAL_FORCE_RELOGIN_KEY),
    storageMode: 'local'
});

const writeLocalSetting = (
    key: typeof LOCAL_SYSTEM_BLOCKED_KEY | typeof LOCAL_PAYMENT_NOTICE_KEY | typeof LOCAL_FORCE_RELOGIN_KEY,
    value: boolean | string
) => {
    localStorage.setItem(key, String(value));
};

const getSettingValue = (rows: any[] | null, key: string, valueName: string) => {
    const row = rows?.find(item => item.key === key);
    return Boolean((row?.value as Record<string, boolean> | null)?.[valueName]);
};

const getSettingString = (rows: any[] | null, key: string, valueName: string) => {
    const row = rows?.find(item => item.key === key);
    const value = (row?.value as Record<string, string> | null)?.[valueName];
    return value || null;
};

export const systemSettingsService = {
    async getSystemSettings(): Promise<SystemSettingsState> {
        const { data, error } = await supabase
            .from('app_settings')
            .select('key, value')
            .in('key', [SYSTEM_BLOCKED_KEY, PAYMENT_NOTICE_KEY, FORCE_RELOGIN_KEY]);

        if (error) {
            console.warn('Configuracao global indisponivel, usando modo local:', error.message);
            return readLocalSettings();
        }

        return {
            isBlocked: getSettingValue(data, SYSTEM_BLOCKED_KEY, 'isBlocked'),
            isPaymentNoticeVisible: getSettingValue(data, PAYMENT_NOTICE_KEY, 'isVisible'),
            forceReloginAt: getSettingString(data, FORCE_RELOGIN_KEY, 'at'),
            storageMode: 'remote'
        };
    },

    async updateSystemLock(isBlocked: boolean): Promise<SystemSettingsState> {
        const { error } = await supabase
            .from('app_settings')
            .upsert({
                key: SYSTEM_BLOCKED_KEY,
                value: { isBlocked },
                updated_at: new Date().toISOString()
            } as any, { onConflict: 'key' });

        if (error) {
            console.warn('Nao foi possivel salvar no Supabase, usando modo local:', error.message);
            writeLocalSetting(LOCAL_SYSTEM_BLOCKED_KEY, isBlocked);
            return readLocalSettings();
        }

        return this.getSystemSettings();
    },

    async updatePaymentNotice(isVisible: boolean): Promise<SystemSettingsState> {
        const { error } = await supabase
            .from('app_settings')
            .upsert({
                key: PAYMENT_NOTICE_KEY,
                value: { isVisible },
                updated_at: new Date().toISOString()
            } as any, { onConflict: 'key' });

        if (error) {
            console.warn('Nao foi possivel salvar no Supabase, usando modo local:', error.message);
            writeLocalSetting(LOCAL_PAYMENT_NOTICE_KEY, isVisible);
            return readLocalSettings();
        }

        return this.getSystemSettings();
    },

    async forceUserRelogin(): Promise<SystemSettingsState> {
        const forcedAt = new Date().toISOString();
        const { error } = await supabase
            .from('app_settings')
            .upsert({
                key: FORCE_RELOGIN_KEY,
                value: { at: forcedAt },
                updated_at: forcedAt
            } as any, { onConflict: 'key' });

        if (error) {
            console.warn('Nao foi possivel salvar no Supabase, usando modo local:', error.message);
            writeLocalSetting(LOCAL_FORCE_RELOGIN_KEY, forcedAt);
            return readLocalSettings();
        }

        return this.getSystemSettings();
    }
};
