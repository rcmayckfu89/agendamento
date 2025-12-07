
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

    // Actions - Patients
    const addPatient = async (patient: Partial<Patient>) => {
        try {
            const newPatientData = await patientService.create(patient);
            // Optimistic update or re-fetch? Let's assume we can merge returned row with Partial
            // ACTUALLY, simpler to re-fetch or construct the object fully
            // Re-fetch is safer for consistency
            await refreshData();
        } catch (err: any) {
            console.error(err);
            throw err;
        }
    };

    const updatePatient = async (patient: Partial<Patient>) => {
        if (!patient.id) return;
        try {
            await patientService.update(patient.id, patient);
            await refreshData();
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
        // Assuming we might need a dedicated UI for managing professionals
        console.warn('addProfessional not fully implemented in backend');
        setProfessionals(prev => [...prev, professional]);
    };

    const updateProfessional = async (professional: Professional) => {
        try {
            await professionalService.update(professional);
            // Optimistic update
            setProfessionals(prev => prev.map(p => p.id === professional.id ? professional : p));
            // Or refresh to be sure
            // await refreshData(); 
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
            // Usually we can't easily revert optimistic delete without re-fetching, 
            // but user sees error and refresh will fix consistency.
            setError('Erro ao remover profissional.');
            await refreshData();
        }
    };

    // Actions - Appointments
    const addAppointment = async (appointment: Partial<Appointment>) => {
        try {
            await appointmentService.create(appointment);
            await refreshData();
        } catch (err: any) {
            console.error(err);
            throw err;
        }
    };

    const updateAppointment = async (appointment: Partial<Appointment>) => {
        if (!appointment.id) return;
        try {
            await appointmentService.update(appointment.id, appointment);
            await refreshData();
        } catch (err: any) {
            console.error(err);
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
            await settingsService.addBlockedDay(day);
            await refreshData();
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