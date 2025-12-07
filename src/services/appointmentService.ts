
import { supabase } from './supabaseClient';
import { Appointment, AppointmentRow } from '../types';

export const appointmentService = {
    async getAll(): Promise<Appointment[]> {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
        *,
        patient:patients (
            id,
            name
        ),
        professional:profiles (
            id,
            email,
            role
        )
      `)
            .order('date', { ascending: false });

        if (error) throw new Error(error.message);

        return (data as any[]).map(item => ({
            ...item,
            patientName: item.patient?.name || 'Desconhecido',
            professionalName: item.professional?.email || 'Profissional',
            type: item.service || 'AGENDA' // Default to AGENDA if null
        }));
    },

    async create(appointment: Partial<Appointment>) {
        const payload = {
            patient_id: appointment.patient_id,
            professional_id: appointment.professional_id,
            date: appointment.date,
            time: appointment.time,
            service: appointment.service || appointment.type,
            status: appointment.status || 'scheduled',
            notes: appointment.notes
        };

        const { data, error } = await supabase
            .from('appointments')
            .insert(payload as any)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async update(id: string, appointment: Partial<Appointment>) {
        const payload: any = {};
        if (appointment.status) payload.status = appointment.status;
        if (appointment.date) payload.date = appointment.date;
        if (appointment.time) payload.time = appointment.time;
        if (appointment.type) payload.service = appointment.type;
        if (appointment.notes !== undefined) payload.notes = appointment.notes;

        const { data, error } = await supabase
            .from('appointments')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    }
};
