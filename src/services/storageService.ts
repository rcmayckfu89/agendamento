/**
 * Serviço genérico para localStorage
 */

const STORAGE_PREFIX = 'agenda_';

/**
 * Salva um item no localStorage
 */
export const set = <T>(key: string, value: T): void => {
    try {
        const serialized = JSON.stringify(value);
        localStorage.setItem(STORAGE_PREFIX + key, serialized);
    } catch (error) {
        console.error(`Error saving to localStorage (${key}):`, error);
    }
};

/**
 * Obtém um item do localStorage
 */
export const get = <T>(key: string, defaultValue?: T): T | null => {
    try {
        const item = localStorage.getItem(STORAGE_PREFIX + key);
        if (item === null) {
            return defaultValue !== undefined ? defaultValue : null;
        }
        return JSON.parse(item) as T;
    } catch (error) {
        console.error(`Error reading from localStorage (${key}):`, error);
        return defaultValue !== undefined ? defaultValue : null;
    }
};

/**
 * Remove um item do localStorage
 */
export const remove = (key: string): void => {
    try {
        localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (error) {
        console.error(`Error removing from localStorage (${key}):`, error);
    }
};

/**
 * Limpa todos os itens do aplicativo no localStorage
 */
export const clear = (): void => {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(STORAGE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
};
