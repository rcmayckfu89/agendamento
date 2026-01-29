
import { supabase } from './supabaseClient';
import { Medication, MedicationRow } from '../types';
import { formatDateToYYYYMMDD } from '../utils/dateUtils';

export const medicationService = {
    async getAll(): Promise<Medication[]> {
        const { data, error } = await supabase
            .from('medications')
            .select(`
                *,
                patient:patients(*)
            `)
            .order('renewal_date', { ascending: true });

        if (error) throw new Error(error.message);

        // Map DB Row to Frontend Medication Domain
        return (data as any[]).map(row => {
            const renewalDate = row.renewal_date ? new Date(row.renewal_date) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let daysUntilRenewal: number | undefined;
            if (renewalDate) {
                const diffTime = renewalDate.getTime() - today.getTime();
                daysUntilRenewal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            return {
                ...row,
                patientName: row.patient?.name || 'Desconhecido',
                daysUntilRenewal
            };
        });
    },

    async create(medication: Partial<Medication>): Promise<MedicationRow> {
        // Remove UI computed fields
        const { patient, patientName, daysUntilRenewal, ...rest } = medication;

        // Calculate renewal_date from prescription_date + duration_days
        let renewal_date = null;
        if (medication.prescription_date && medication.duration_days) {
            const prescDate = new Date(medication.prescription_date);
            prescDate.setDate(prescDate.getDate() + medication.duration_days);
            renewal_date = formatDateToYYYYMMDD(prescDate);
        }

        const insertData = {
            ...rest,
            renewal_date
        };

        const { data, error } = await supabase
            .from('medications')
            .insert(insertData as any)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async update(id: string, medication: Partial<Medication>): Promise<MedicationRow> {
        const { patient, patientName, daysUntilRenewal, ...rest } = medication;

        // Recalculate renewal_date if prescription_date or duration_days changed
        let renewal_date = medication.renewal_date || null;
        if (medication.prescription_date && medication.duration_days) {
            const prescDate = new Date(medication.prescription_date);
            prescDate.setDate(prescDate.getDate() + medication.duration_days);
            renewal_date = formatDateToYYYYMMDD(prescDate);
        }

        const updateData: any = { ...rest };
        if (renewal_date !== null) {
            updateData.renewal_date = renewal_date;
        }

        const { data, error } = await supabase
            .from('medications')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },


    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('medications')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    },

    async renew(id: string, newDurationDays: number): Promise<MedicationRow> {
        // Get today's date for the new prescription date
        const today = new Date();
        const prescriptionDate = formatDateToYYYYMMDD(today);

        // Calculate new renewal date
        const renewalDateObj = new Date(today);
        renewalDateObj.setDate(renewalDateObj.getDate() + newDurationDays);
        const renewalDate = formatDateToYYYYMMDD(renewalDateObj);

        const { data, error } = await supabase
            .from('medications')
            .update({
                prescription_date: prescriptionDate,
                duration_days: newDurationDays,
                renewal_date: renewalDate,
                status: 'active'
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }
};
