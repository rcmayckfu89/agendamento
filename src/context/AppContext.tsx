
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { Patient, Professional, Appointment, BlockedDay, AppContextType } from '../types';
import { patientService } from '../services/patientService';
import { appointmentService } from '../services/appointmentService';
import { professionalService } from '../services/professionalService';
import { settingsService } from '../services/settingsService';
import { useAuth } from './AuthContext';
import { useSystemLock } from './SystemLockContext';
import { useToast } from './ToastContext';
import { isAdminEmail } from '../constants/admin';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { session, user } = useAuth();
    const { isBlocked, loading: lockLoading } = useSystemLock();
    const { showToast } = useToast();

    // State
    const [patients, setPatients] = useState<Patient[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [blockedDays, setBlockedDays] = useState<BlockedDay[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Concurrency Guard
    const fetchingRef = React.useRef(false);

    // Realtime Loop Prevention
    const localUpdateIdsRef = useRef<Set<string>>(new Set());
    const addLocalUpdateId = (id: string) => {
        localUpdateIdsRef.current.add(id);
        // Clear after 2 seconds to prevent memory leak
        setTimeout(() => {
            localUpdateIdsRef.current.delete(id);
        }, 2000);
    };

    const refreshData = useCallback(async () => {
        if (lockLoading) {
            return;
        }

        if (!session) {
            setIsLoading(false);
            return;
        }

        if (isBlocked && !isAdminEmail(user?.email)) {
            setPatients([]);
            setProfessionals([]);
            setAppointments([]);
            setBlockedDays([]);
            setIsLoading(false);
            return;
        }

        if (fetchingRef.current) {
            return;
        }

        fetchingRef.current = true;
        setIsLoading(true);
        setError(null);

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Tempo limite de conexão excedido (15s)')), 15000)
        );

        try {
            await Promise.race([
                (async () => {
                    try {
                        const fetchedPatients = await patientService.getAll();
                        setPatients(fetchedPatients);
                    } catch (err: any) {
                        console.error('Erro ao carregar pacientes:', err);
                    }

                    try {
                        const fetchedProfessionals = await professionalService.getAll();
                        setProfessionals(fetchedProfessionals);
                    } catch (err: any) {
                        console.error('Erro ao carregar profissionais:', err);
                    }

                    try {
                        const fetchedAppointments = await appointmentService.getAll();
                        setAppointments(fetchedAppointments);
                    } catch (err: any) {
                        console.error('Erro ao carregar agendamentos:', err);
                    }

                    try {
                        const fetchedBlockedDays = await settingsService.getBlockedDays();
                        setBlockedDays(fetchedBlockedDays);
                    } catch (err: any) {
                        console.error('Erro ao carregar dias bloqueados:', err);
                    }
                })(),
                timeoutPromise
            ]);

        } catch (err: any) {
            console.error('Erro crítico em refreshData:', err);
            setError(err.message || 'Erro ao carregar dados.');
        } finally {
            fetchingRef.current = false;
            setIsLoading(false);
        }
    }, [session, user?.email, isBlocked, lockLoading]);

    useEffect(() => {
        refreshData();
    }, [session]);

    const handleRealtimeInsert = useCallback((newAppointment: any) => {
        if (localUpdateIdsRef.current.has(newAppointment.id)) return;

        setAppointments(prev => {
            if (prev.some(a => a.id === newAppointment.id)) return prev;

            // Resolve names dentro do setter para pegar o estado mais recente
            const fullAppointment: Appointment = {
                ...newAppointment,
                patientName: newAppointment.patientName || 'Desconhecido',
                professionalName: newAppointment.professionalName || 'Profissional',
                type: newAppointment.service || 'AGENDA'
            };
            return [fullAppointment, ...prev];
        });

        showToast(
            `Novo agendamento registrado às ${newAppointment.time}`,
            'info',
            4000
        );
    }, [showToast]);

    const handleRealtimeUpdate = useCallback((updatedAppointment: any) => {
        if (localUpdateIdsRef.current.has(updatedAppointment.id)) return;

        setAppointments(prev => prev.map(a => {
            if (a.id === updatedAppointment.id) {
                return {
                    ...a,
                    ...updatedAppointment,
                    patientName: a.patientName,
                    professionalName: a.professionalName,
                    type: updatedAppointment.service || a.type || 'AGENDA'
                };
            }
            return a;
        }));
    }, []);

    const handleRealtimeDelete = useCallback((appointmentId: string) => {
        if (localUpdateIdsRef.current.has(appointmentId)) return;
        setAppointments(prev => prev.filter(a => a.id !== appointmentId));
    }, []);

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

            // Mark as local update to prevent Realtime loop
            addLocalUpdateId(newAppointmentData.id);

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

            // Mark as local update to prevent Realtime loop
            addLocalUpdateId(appointment.id);

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
            // Mark as local update to prevent Realtime loop
            addLocalUpdateId(id);

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
            refreshData,
            isLoading, error,
            // Realtime handlers
            handleRealtimeInsert,
            handleRealtimeUpdate,
            handleRealtimeDelete
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
