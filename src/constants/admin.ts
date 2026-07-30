export const ADMIN_EMAIL = 'owner@example.com';

export const isAdminEmail = (email?: string | null) => {
    return email?.toLowerCase() === ADMIN_EMAIL;
};
