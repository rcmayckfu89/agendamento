
import { supabase } from './supabaseClient';
import { BlockedDay } from '../types';

export const settingsService = {
    async getBlockedDays(): Promise<BlockedDay[]> {
        const { data, error } = await supabase
            .from('blocked_days')
            .select('*')
            .order('date', { ascending: true });

        if (error) throw new Error(error.message);
        return data as BlockedDay[];
    },

    async addBlockedDay(day: Partial<BlockedDay>) {
        const { data, error } = await supabase
            .from('blocked_days')
            .insert(day as any)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async removeBlockedDay(id: string) {
        const { error } = await supabase
            .from('blocked_days')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    }
};
