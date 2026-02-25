
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
            name,
            email,
            role
        )
      `)
            .order('date', { ascending: false });

        if (error) throw new Error(error.message);

        return (data as any[]).map(item => ({
            ...item,
            patientName: item.patient?.name || 'Desconhecido',
            professionalName: item.professional?.name || item.professional?.email || 'Profissional',
            type: item.service || 'AGENDA'
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
            notes: appointment.notes,
            queue_status: appointment.queue_status || 'waiting',
            called_at: appointment.called_at,
            service_location: appointment.service_location,
            duration_minutes: appointment.duration_minutes
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
        if (appointment.queue_status) payload.queue_status = appointment.queue_status;
        if (appointment.called_at) payload.called_at = appointment.called_at;
        if (appointment.service_location) payload.service_location = appointment.service_location;
        if (appointment.duration_minutes !== undefined) payload.duration_minutes = appointment.duration_minutes;

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
