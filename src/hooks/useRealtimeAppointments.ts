import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Appointment } from '../types';

interface UseRealtimeAppointmentsProps {
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    onInsert?: (appointment: any) => void;
    onUpdate?: (appointment: any) => void;
    onDelete?: (appointmentId: string) => void;
    enabled?: boolean;
}

export const useRealtimeAppointments = ({
    startDate,
    endDate,
    onInsert,
    onUpdate,
    onDelete,
    enabled = true
}: UseRealtimeAppointmentsProps) => {
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!enabled) {
            console.log('🔇 [Realtime] Disabled, skipping subscription');
            return;
        }

        console.log(`🔔 [Realtime] Subscribing to appointments from ${startDate} to ${endDate}`);

        // Create unique channel name based on date range
        const channelName = `appointments:${startDate}:${endDate}`;

        // Unsubscribe from previous channel if exists
        if (channelRef.current) {
            console.log('🔄 [Realtime] Unsubscribing from previous channel');
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        // Create new channel with filter
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'appointments',
                    filter: `date=gte.${startDate},date=lte.${endDate}`
                },
                (payload) => {
                    console.log('✨ [Realtime] INSERT received:', payload.new);
                    if (onInsert) {
                        onInsert(payload.new);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'appointments',
                    filter: `date=gte.${startDate},date=lte.${endDate}`
                },
                (payload) => {
                    console.log('🔄 [Realtime] UPDATE received:', payload.new);
                    if (onUpdate) {
                        onUpdate(payload.new);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'appointments'
                },
                (payload) => {
                    console.log('🗑️ [Realtime] DELETE received:', payload.old);
                    if (onDelete && payload.old?.id) {
                        onDelete(payload.old.id);
                    }
                }
            )
            .subscribe((status) => {
                console.log(`📡 [Realtime] Subscription status: ${status}`);
            });

        channelRef.current = channel;

        // Cleanup on unmount or when dependencies change
        return () => {
            console.log('🔌 [Realtime] Cleaning up subscription');
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [startDate, endDate, enabled, onInsert, onUpdate, onDelete]);

    return {
        channel: channelRef.current
    };
};
