
import { supabase } from './supabaseClient';
import { Patient, PatientRow } from '../types';

export const patientService = {
    async getAll(): Promise<Patient[]> {
        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw new Error(error.message);

        // Map DB Row to Frontend Patient Domain
        return (data as PatientRow[]).map(row => ({
            ...row,
            // UI Computed Fields
            initials: (row.name || 'Unknown')
                .split(' ')
                .map(n => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase(),
            registeredAt: row.created_at || undefined,
            cpfOrCns: row.cpf || row.cns || '',
            comorbidities: row.comorbidities || [], // CRITICAL: Ensure array
            name: row.name || 'Sem Nome'
        }));
    },

    async update(id: string, patient: Partial<Patient>): Promise<PatientRow> {
        const { initials, registeredAt, nextAppointment, color, cpfOrCns, ...rest } = patient;

        // Map cpfOrCns logic matches create for consistency, though usually update comes with separated fields
        // But if the UI sends cpfOrCns only, we should handle it. 
        // Ideally the UI should send cpf or cns separately, but let's support the UI pattern.

        let cpf = patient.cpf;
        let cns = patient.cns;

        if (cpfOrCns) {
            const cleanDoc = cpfOrCns.replace(/\D/g, '');
            if (cleanDoc.length === 11) {
                cpf = cpfOrCns;
            } else {
                cns = cpfOrCns;
            }
        }

        const updateData: any = { ...rest };
        if (cpf !== undefined) updateData.cpf = cpf;
        if (cns !== undefined) updateData.cns = cns;

        const { data, error } = await supabase
            .from('patients')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async create(patient: Partial<Patient>): Promise<PatientRow> {
        // Remove UI computed fields
        const { initials, registeredAt, nextAppointment, color, cpfOrCns, ...rest } = patient;

        let cpf: string | null = null;
        let cns: string | null = null;

        // Verify if explicit fields were passed or via the UI helper
        if (patient.cpf) cpf = patient.cpf;
        if (patient.cns) cns = patient.cns;

        if (cpfOrCns && !cpf && !cns) {
            const cleanDoc = cpfOrCns.replace(/\D/g, '');
            if (cleanDoc.length === 11) {
                cpf = cpfOrCns;
            } else {
                cns = cpfOrCns;
            }
        }

        // Prepare insert payload
        const insertData = {
            ...rest,
            cpf,
            cns,
            // Ensure comorbidities is an array if present
            comorbidities: patient.comorbidities || []
        };

        const { data, error } = await supabase
            .from('patients')
            .insert(insertData as any) // Type assertion to bypass strict Partial<Patient> vs Insert mismatches
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('patients')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    }
};
