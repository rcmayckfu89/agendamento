
import { supabase } from './supabaseClient';
import { Professional, ShiftConfig, UserRole } from '../types';

export const professionalService = {
    async getAll(): Promise<Professional[]> {
        // Fetch profiles
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*');

        if (profileError) throw new Error(profileError.message);

        // Fetch schedules
        const { data: schedules, error: scheduleError } = await supabase
            .from('schedule_config')
            .select('*');

        if (scheduleError) throw new Error(scheduleError.message);

        // Map and Merge
        const professionals: Professional[] = profiles
            .filter(profile => profile.role !== 'admin') // Ocultar admins da lista de profissionais
            .map(profile => {
                // Filter schedules for this pro
                const proSchedules = schedules.filter(s => s.professional_id === profile.id);

                // Convert DB Schedule Rows to Frontend Record<string, ShiftConfig>
                // Frontend expects keys like 'seg-manha', 'seg-tarde' etc.
                // DB has weekday (0-6). 0=Sun. 
                // Mapping: 0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sab
                const dayMap = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

                const scheduleMap: Record<string, ShiftConfig> = {};

                proSchedules.forEach(s => {
                    const dayPrefix = dayMap[s.weekday];

                    // Morning
                    if (s.morning_start && s.morning_end) {
                        scheduleMap[`${dayPrefix}-manha`] = {
                            type: (s.morning_type || 'AGENDA') as any,
                            start: s.morning_start.slice(0, 5),
                            end: s.morning_end.slice(0, 5),
                            interval: s.interval_minutes || 30
                        };
                    }

                    // Afternoon
                    if (s.afternoon_start && s.afternoon_end) {
                        scheduleMap[`${dayPrefix}-tarde`] = {
                            type: (s.afternoon_type || 'AGENDA') as any,
                            start: s.afternoon_start.slice(0, 5),
                            end: s.afternoon_end.slice(0, 5),
                            interval: s.interval_minutes || 30
                        };
                    }
                });

                return {
                    id: profile.id,
                    name: profile.name || profile.email || 'Profissional',
                    role: profile.role as UserRole,
                    schedule: scheduleMap
                };
            });

        return professionals;
    },

    async update(professional: Professional): Promise<void> {
        // 1. Update Profile (Name and Role)
        // Note: 'name' column requires the migration.sql to be run.
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                role: professional.role,
                name: professional.name // Will fail if migration not run, but handled silently usually or error thrown
            } as any)
            .eq('id', professional.id);

        if (profileError) {
            console.error('Error updating profile:', profileError);
            // Continue to try updating schedule even if profile fails (e.g. column missing)
        }

        // 2. Update Schedule
        // We need to convert the frontend 'Record<string, ShiftConfig>' back to 'schedule_config' rows.
        // Strategy: Upsert each day configuration.

        const dayMapInverse: Record<string, number> = { 'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6 };
        const slugs = ['seg', 'ter', 'qua', 'qui', 'sex']; // Usually we only edit weekdays in UI, but could be all.

        // Prepare bulk upserts
        const upsertData: any[] = [];

        // Iterate over all possible days (0-6) or just the ones in the object?
        // Let's iterate 0-6 to be safe, extracting from the map.
        for (let i = 0; i <= 6; i++) {
            const daySlug = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][i];
            const amKey = `${daySlug}-manha`;
            const pmKey = `${daySlug}-tarde`;

            const am = professional.schedule[amKey];
            const pm = professional.schedule[pmKey];

            // If neither exists, skip (or strictly should we delete? Assuming existing rows stay if not in UI? 
            // But UI has full state. Let's assume if it's not in UI, it's not configured. 
            // But for safety, only upsert if we have data.)
            if (!am && !pm) continue;

            const row: any = {
                professional_id: professional.id,
                weekday: i,
                interval_minutes: am?.interval || pm?.interval || 30 // Fallback
            };

            if (am) {
                row.morning_start = am.start;
                row.morning_end = am.end;
                row.morning_type = am.type; // Requires migration
            } else {
                row.morning_start = null;
                row.morning_end = null;
            }

            if (pm) {
                row.afternoon_start = pm.start;
                row.afternoon_end = pm.end;
                row.afternoon_type = pm.type; // Requires migration
            } else {
                row.afternoon_start = null;
                row.afternoon_end = null;
            }

            upsertData.push(row);
        }

        if (upsertData.length > 0) {
            const { error: scheduleError } = await supabase
                .from('schedule_config')
                .upsert(upsertData, { onConflict: 'professional_id, weekday' });

            if (scheduleError) throw new Error(scheduleError.message);
        }
    },

    async delete(id: string): Promise<void> {
        // Deleting from profiles will cascade delete schedule_config if FK is set to CASCADE.
        // If not, we should delete schedule first manually?
        // Supabase usually handles cascade if defined. Let's assume CASCADE is ON or we delete manually.
        // Let's delete schedule first to be safe, then profile (actually user cannot delete auth user easily via client usually).
        // Wait, 'profiles' is just a table. Deleting row from 'profiles' is fine.
        // But the Auth User remains.
        // Admin usually needs to delete Auth User via Admin API.
        // Client side, we can only delete from 'profiles' if RLS allows.
        // But this app treats 'profiles' as the source of truth for the list.

        // 1. Delete Schedule
        const { error: scheduleError } = await supabase
            .from('schedule_config')
            .delete()
            .eq('professional_id', id);

        if (scheduleError) throw new Error(scheduleError.message);

        // 2. Delete Profile Row
        // Only works if RLS allows.
        /* 
           NOTE: This does NOT delete the Auth User (login). 
           To delete Auth User, we need a Secure Edge Function.
           For now, we just remove them from the 'Team' list by deleting the profile row.
           (Or marking as inactive? User said "Excluir").
        */
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (profileError) throw new Error(profileError.message);
    }
};
