
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient, Professional, Appointment, BlockedDay, AppContextType } from '../types';
import { patientService } from '../services/patientService';
import { appointmentService } from '../services/appointmentService';
import { professionalService } from '../services/professionalService';
import { settingsService } from '../services/settingsService';
import { useAuth } from './AuthContext';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { session } = useAuth();

    // State
    const [patients, setPatients] = useState<Patient[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [blockedDays, setBlockedDays] = useState<BlockedDay[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Concurrency Guard
    const fetchingRef = React.useRef(false);

    // Fetch Data on Mount / Auth Change
    const refreshData = async () => {
        if (!session) {
            setIsLoading(false);
            return;
        }

        // Prevent overlapping requests
        if (fetchingRef.current) {
            console.log('⚠️ refreshData skipped: already fetching');
            return;
        }

        fetchingRef.current = true;
        setIsLoading(true);
        setError(null);
        console.log('🚀 refreshData started for user:', session.user.email);

        // Safety Timeout Promise
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Tempo limite de conexão excedido (15s)')), 15000)
        );

        try {
            // Wrap all fetches in a race with timeout
            await Promise.race([
                (async () => {
                    // 1. Patients
                    try {
                        const fetchedPatients = await patientService.getAll();
                        console.log('✅ Patients loaded:', fetchedPatients.length);
                        setPatients(fetchedPatients);
                    } catch (err: any) {
                        console.error('❌ Error loading patients:', err);
                        // Don't set global error here to allow other data to load
                    }

                    // 2. Professionals
                    try {
                        const fetchedProfessionals = await professionalService.getAll();
                        console.log('✅ Professionals loaded:', fetchedProfessionals.length);
                        setProfessionals(fetchedProfessionals);
                    } catch (err: any) {
                        console.error('❌ Error loading professionals:', err);
                    }

                    // 3. Appointments
                    try {
                        const fetchedAppointments = await appointmentService.getAll();
                        console.log('✅ Appointments loaded:', fetchedAppointments.length);
                        setAppointments(fetchedAppointments);
                    } catch (err: any) {
                        console.error('❌ Error loading appointments:', err);
                    }

                    // 4. Blocked Days
                    try {
                        const fetchedBlockedDays = await settingsService.getBlockedDays();
                        setBlockedDays(fetchedBlockedDays);
                    } catch (err: any) {
                        console.error('❌ Error loading blocked days:', err);
                    }
                })(),
                timeoutPromise
            ]);

        } catch (err: any) {
            console.error('CRITICAL Error in refreshData wrapper:', err);
            setError(err.message || 'Erro ao carregar dados.');
        } finally {
            fetchingRef.current = false;
            setIsLoading(false);
            console.log('🏁 refreshData finished');
        }
    };

    useEffect(() => {
        refreshData();
    }, [session]);

    // ============================================
    // AUTO-CLOSE: Encerramento automático às 00:01
    // ============================================
    const autoCloseExecutedRef = React.useRef(false);

    useEffect(() => {
        if (!session) return;

        // Evitar execução múltipla
        if (autoCloseExecutedRef.current) return;

        const autoCloseYesterdayAppointments = async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            const pendingAppointments = appointments.filter(
                a => a.date === yesterdayStr && a.status === 'scheduled'
            );

            if (pendingAppointments.length > 0) {
                console.log(`🔒 [Auto-Close] Encerrando ${pendingAppointments.length} agendamentos de ${yesterdayStr}`);
                autoCloseExecutedRef.current = true; // Marcar como executado ANTES de fazer as atualizações

                for (const app of pendingAppointments) {
                    try {
                        await appointmentService.update(app.id, { status: 'auto_closed' });
                        console.log(`✅ [Auto-Close] Agendamento ${app.id} encerrado automaticamente`);
                    } catch (err) {
                        console.error(`❌ [Auto-Close] Erro ao encerrar agendamento ${app.id}:`, err);
                    }
                }

                // Atualizar lista local após encerramento
                setAppointments(prev => prev.map(a =>
                    pendingAppointments.some(p => p.id === a.id)
                        ? { ...a, status: 'auto_closed' }
                        : a
                ));
            }
        };

        // Calcular tempo até 00:01 do próximo dia
        const scheduleAutoClose = () => {
            const now = new Date();
            const nextMidnight = new Date(now);
            nextMidnight.setDate(nextMidnight.getDate() + 1);
            nextMidnight.setHours(0, 1, 0, 0); // 00:01:00

            const msUntilMidnight = nextMidnight.getTime() - now.getTime();
            console.log(`⏰ [Auto-Close] Próxima verificação em ${Math.round(msUntilMidnight / 1000 / 60)} minutos`);

            return setTimeout(() => {
                autoCloseExecutedRef.current = false; // Reset para permitir nova execução
                autoCloseYesterdayAppointments();
                scheduleAutoClose(); // Reagendar para o próximo dia
            }, msUntilMidnight);
        };

        // Verificar ao montar se há agendamentos pendentes do dia anterior (apenas se houver appointments carregados)
        if (appointments.length > 0) {
            autoCloseYesterdayAppointments();
        }

        const timerId = scheduleAutoClose();
        return () => clearTimeout(timerId);
    }, [session]); // Remover appointments.length da dependência para evitar loop

    // Actions - Patients
    const addPatient = async (patient: Partial<Patient>) => {
        try {
            const newPatientData = await patientService.create(patient);

            // Optimistic Update
            setPatients(prev => {
                const newPatient: Patient = {
                    ...newPatientData,
                    initials: newPatientData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                };
                return [newPatient, ...prev];
            });

        } catch (err: any) {
            console.error(err);
            throw err;
        }
    };

    const updatePatient = async (patient: Partial<Patient>) => {
        if (!patient.id) return;
        try {
            const updatedData = await patientService.update(patient.id, patient);

            // Optimistic Update
            setPatients(prev => prev.map(p => p.id === patient.id ? { ...p, ...updatedData } : p));

        } catch (err: any) {
            console.error(err);
            throw err;
        }
    };

    const deletePatient = async (id: string) => {
        try {
            await patientService.delete(id);
            setPatients(prev => prev.filter(p => p.id !== id));
        } catch (err: any) {
            console.error(err);
            throw err;
        }
    };

    // Actions - Professionals
    const addProfessional = async (professional: Professional) => {
        // Not implemented fully in service yet (create), but interface exists
        console.warn('addProfessional not fully implemented in backend');
        setProfessionals(prev => [...prev, professional]);
    };

    const updateProfessional = async (professional: Professional) => {
        try {
            await professionalService.update(professional);
            // Optimistic update
            setProfessionals(prev => prev.map(p => p.id === professional.id ? professional : p));
        } catch (err: any) {
            console.error('Error updating professional:', err);
            setError('Erro ao salvar profissional. Verifique se o banco foi atualizado (SQL).');
        }
    };

    const deleteProfessional = async (id: string) => {
        try {
            await professionalService.delete(id);
            // Optimistic update
            setProfessionals(prev => prev.filter(p => p.id !== id));
        } catch (err: any) {
            console.error('Error deleting professional:', err);
            setError('Erro ao remover profissional.');
            await refreshData();
        }
    };

    // Actions - Appointments
    const addAppointment = async (appointment: Partial<Appointment>) => {
        try {
            const newAppointmentData = await appointmentService.create(appointment);

            // Resolve Names for UI
            const patientObj = patients.find(p => p.id === newAppointmentData.patient_id);
            const professionalObj = professionals.find(p => p.id === newAppointmentData.professional_id);

            const fullAppointment: Appointment = {
                ...newAppointmentData,
                patientName: patientObj?.name || 'Desconhecido',
                professionalName: professionalObj?.name || professionalObj?.email || 'Profissional',
                type: newAppointmentData.service || 'AGENDA'
            };

            setAppointments(prev => [fullAppointment, ...prev]);

        } catch (err: any) {
            console.error(err);
            throw err;
        }
    };

    const updateAppointment = async (appointment: Partial<Appointment>) => {
        if (!appointment.id) return;
        try {
            console.log('🔄 [AppContext] Iniciando atualização de agendamento:', appointment);
            const updatedData = await appointmentService.update(appointment.id, appointment);
            console.log('✅ [AppContext] Agendamento atualizado no banco:', updatedData);

            setAppointments(prev => prev.map(a => {
                if (a.id === appointment.id) {
                    // Re-resolve names if IDs changed (unlikely but safe)
                    // Or mostly just update status/time
                    const patientObj = patients.find(p => p.id === updatedData.patient_id) || a.patient;
                    const professionalObj = professionals.find(p => p.id === updatedData.professional_id) || a.professional; // Keep existing if not found? No, should be found.

                    // If logic is complex, just merging `a` and `updatedData` usually works for simple fields
                    const updated = {
                        ...a,
                        ...updatedData,
                        status: updatedData.status, // Ensure status enum is correct
                        // Only update names if IDs changed, else keep existing to avoid flickering
                        // But actually, we don't have the objects in updatedData, only IDs.
                        // We must rely on `a.patientName` unless we want to re-lookup.
                        // Since we have global patients/pros lists, we can re-lookup cheaply.
                        patientName: patients.find(p => p.id === updatedData.patient_id)?.name || a.patientName,
                        professionalName: professionals.find(p => p.id === updatedData.professional_id)?.name || professionals.find(p => p.id === updatedData.professional_id)?.email || a.professionalName
                    };
                    console.log('🔄 [AppContext] Agendamento atualizado no state local:', updated);
                    return updated;
                }
                return a;
            }));

        } catch (err: any) {
            console.error('❌ [AppContext] Erro ao atualizar agendamento:', err);
            throw err;
        }
    };

    const deleteAppointment = async (id: string) => {
        try {
            await appointmentService.delete(id);
            setAppointments(prev => prev.filter(a => a.id !== id));
        } catch (err: any) {
            console.error(err);
            throw err;
        }
    };

    // Actions - Blocked Days
    const addBlockedDay = async (day: Partial<BlockedDay>) => {
        try {
            const newDay = await settingsService.addBlockedDay(day);
            setBlockedDays(prev => [...prev, newDay]);
        } catch (err: any) {
            console.error(err);
            throw err;
        }
    };

    const removeBlockedDay = async (id: string) => {
        try {
            await settingsService.removeBlockedDay(id);
            setBlockedDays(prev => prev.filter(d => d.id !== id));
        } catch (err: any) {
            console.error(err);
            throw err;
        }
    };

    return (
        <AppContext.Provider value={{
            patients, professionals, appointments, blockedDays,
            addPatient, updatePatient, deletePatient,
            addProfessional, updateProfessional, deleteProfessional,
            addAppointment, updateAppointment, deleteAppointment,
            addBlockedDay, removeBlockedDay,
            isLoading, error
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
};