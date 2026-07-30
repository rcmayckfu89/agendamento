export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || '';

export const isAdminEmail = (email?: string | null) => {
    return Boolean(ADMIN_EMAIL) && email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
};
