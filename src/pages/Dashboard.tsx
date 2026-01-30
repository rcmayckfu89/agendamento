
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatDateToYYYYMMDD, getTodayLocalStr } from '../utils/dateUtils';
import { Appointment, StatData } from '../types';
import { PatientQueueItem } from '../types/queue';
import { useRealtimeAppointments } from '../hooks/useRealtimeAppointments';

// Components
import { DateSelector } from '../components/features/DateSelector';
import { StatCard } from '../components/features/StatCard';
import { QueueColumn } from '../components/features/QueueColumn';
import { QueueActionModal } from '../components/features/QueueActionModal';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const {
        appointments,
        professionals,
        updateAppointment,
        refreshData,
        handleRealtimeInsert,
        handleRealtimeUpdate,
        handleRealtimeDelete
    } = useApp();

    // --- State ---
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedPatient, setSelectedPatient] = useState<PatientQueueItem | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);

    // --- Helpers ---
    const todayStr = getTodayLocalStr();
    const selectedDateStr = formatDateToYYYYMMDD(selectedDate);
    const isToday = selectedDateStr === todayStr;

    // --- Realtime Subscription ---
    useRealtimeAppointments({
        startDate: selectedDateStr,
        endDate: selectedDateStr,
        onInsert: handleRealtimeInsert,
        onUpdate: handleRealtimeUpdate,
        onDelete: handleRealtimeDelete,
        enabled: true
    });

    // mount/refresh logic
    useEffect(() => {
        refreshData();
    }, []);

    // --- Data Processing (Memoized) ---

    // 1. Appointments for Selected Date - Now includes ALL statuses for processing
    const dayAppointments = useMemo(() => {
        return appointments.filter(a => {
            const rowDate = a.date ? a.date.split('T')[0] : '';
            return rowDate === selectedDateStr;
        }).sort((a, b) => a.time.localeCompare(b.time));
    }, [appointments, selectedDateStr]);

    // 2. Stats Calculation
    const stats: StatData[] = useMemo(() => {
        const countByRole = (role: string) => {
            return dayAppointments.filter(a => {
                const prof = professionals.find(p => p.id === a.professional_id);
                return prof?.role === role && (a.status === 'scheduled' || a.status === 'in-call');
            }).length;
        };

        const currentDocs = countByRole('medico');
        const currentNurses = countByRole('enfermeiro');
        const urgentCount = dayAppointments.filter(a => (a.type === 'DEMANDA ESPONTÂNEA' || a.type === 'HIPERDIA') && a.status !== 'finished' && a.status !== 'canceled').length;

        // Total capacity placeholder
        const totalDocs = professionals.filter(p => p.role === 'medico').length * 15;
        const totalNurses = professionals.filter(p => p.role === 'enfermeiro' || p.role === 'tecnico').length * 15;

        return [
            { category: 'Doctor', current: currentDocs, total: Math.max(currentDocs, totalDocs), label: 'Pacientes em Espera', icon: 'medical_services', colorClass: 'bg-primary', ringColorClass: 'ring-primary/20' },
            { category: 'Nurse', current: currentNurses, total: Math.max(currentNurses, totalNurses), label: 'Triagem / Procedimentos', icon: 'vaccines', colorClass: 'bg-teal-500', ringColorClass: 'ring-teal-500/20' },
            { category: 'Urgent', current: urgentCount, total: 0, label: 'Demandas do Dia', icon: 'priority_high', colorClass: 'bg-orange-500', ringColorClass: 'ring-orange-500/20' },
        ];
    }, [dayAppointments, professionals]);

    // 3. Queue Mapping
    // This transforms Appointment[] -> PatientQueueItem[] for columns
    const mapToQueueItem = (appt: Appointment): PatientQueueItem => {
        // Mocking age/id logic since we don't have it fully populated yet in type
        const patientAge = 35; // placeholder

        let status: PatientQueueItem['status'] = 'waiting';
        // Use real queue status from DB if available
        if (appt.queue_status) {
            status = appt.queue_status as PatientQueueItem['status'];
        } else {
            // Fallback logic for legacy data
            if (appt.type === 'DEMANDA ESPONTÂNEA') status = 'urgent';
            if (appt.status === 'finished') status = 'return';
            if (appt.type === 'PRÉ-NATAL' || appt.type === 'CITOPATOLÓGICO') status = 'procedure';
        }

        return {
            id: appt.id!,
            originalAppointmentId: appt.id!,
            name: appt.patientName || 'Paciente',
            patientId: appt.patient_id?.substring(0, 4) || '0000',
            age: patientAge,
            status: status,
            time: appt.called_at ? new Date(appt.called_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : appt.time,
            professionalName: appt.professionalName,
            location: appt.service_location || undefined,
            duration: appt.duration_minutes ? `${appt.duration_minutes}min` : undefined,
            serviceType: appt.type
        };
    };

    const medicalQueue = useMemo(() => {
        return dayAppointments
            .filter(a => {
                const prof = professionals.find(p => p.id === a.professional_id);
                // Only show active appointments (not finished/canceled/no_show)
                const isActive = ['scheduled', 'in-call', 'waiting'].includes(a.status as string) || (a.queue_status && a.queue_status !== 'waiting');
                // Backwards compatibility for status
                const isNotHistory = !['finished', 'canceled', 'no_show', 'auto_closed'].includes(a.status as string);
                return prof?.role === 'medico' && isNotHistory;
            })
            .map(mapToQueueItem);
    }, [dayAppointments, professionals]);

    const nurseQueue = useMemo(() => {
        return dayAppointments
            .filter(a => {
                const prof = professionals.find(p => p.id === a.professional_id);
                const isNotHistory = !['finished', 'canceled', 'no_show', 'auto_closed'].includes(a.status as string);
                return (prof?.role === 'enfermeiro' || prof?.role === 'tecnico') && isNotHistory;
            })
            .map(mapToQueueItem);
    }, [dayAppointments, professionals]);

    // 4. Daily History (Finished for the selected day)
    const dayHistory = useMemo(() => {
        return dayAppointments
            .filter(a => ['finished', 'canceled', 'no_show', 'auto_closed'].includes(a.status as string))
            .sort((a, b) => b.time.localeCompare(a.time)); // Recent first
    }, [dayAppointments]);


    // --- Handlers ---
    const handlePatientClick = (patient: PatientQueueItem) => {
        setSelectedPatient(patient);
        setIsActionModalOpen(true);
    };

    const handleCallPatient = async (location: string) => {
        if (!selectedPatient) return;

        await updateAppointment({
            id: selectedPatient.originalAppointmentId,
            queue_status: 'in-call', // Using new DB Enum
            called_at: new Date().toISOString(),
            service_location: location
        });

        setIsActionModalOpen(false);
        refreshData();
    };

    const handleFinishPatient = async () => {
        if (!selectedPatient) return;

        await updateAppointment({
            id: selectedPatient.originalAppointmentId,
            status: 'finished',
            queue_status: 'waiting' // Remove from queue view or keep as 'return'? Let's clear it from active
        });

        setIsActionModalOpen(false);
        refreshData();
    };

    const handleNoShow = async () => {
        if (!selectedPatient) return;

        await updateAppointment({
            id: selectedPatient.originalAppointmentId,
            status: 'no_show',
            queue_status: 'waiting' // Effectively removes from active board if we filter
        });

        setIsActionModalOpen(false);
        refreshData();
    };

    const handleCancel = async () => {
        if (!selectedPatient) return;

        await updateAppointment({
            id: selectedPatient.originalAppointmentId,
            status: 'canceled',
            queue_status: 'waiting'
        });

        setIsActionModalOpen(false);
        refreshData();
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-10 lg:px-12 animate-fade-in">
            {/* Header */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 md:mb-12">
                <div className="text-center lg:text-left">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 md:mb-3 font-display leading-tight">
                        Visão Geral
                    </h1>
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-3">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            Eficiência Clínica • {isToday ? 'Hoje' : selectedDate.toLocaleDateString()}
                        </span>
                        <DateSelector
                            selectedDate={selectedDate}
                            onDateChange={setSelectedDate}
                            isToday={isToday}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 lg:flex items-center gap-3">
                    <button
                        onClick={() => navigate('/agenda')}
                        className="flex items-center justify-center gap-2 px-3 sm:px-6 py-3 bg-primary text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity active-click"
                    >
                        <span className="material-symbols-outlined text-lg sm:text-xl">event_note</span>
                        AGENDA
                    </button>
                    <button
                        onClick={() => navigate('/patients')}
                        className="flex items-center justify-center gap-2 px-3 sm:px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active-click"
                    >
                        <span className="material-symbols-outlined text-lg sm:text-xl">group</span>
                        PACIENTES
                    </button>
                </div>
            </header>

            {/* Stats Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {stats.map((stat, idx) => (
                    <StatCard key={idx} data={stat} />
                ))}
            </section>

            {/* Queue Section */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">Fila de Atendimento</h2>
                        {isToday && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full animate-pulse">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Tempo Real</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <QueueColumn
                        title="Consultório Médico"
                        icon="medical_services"
                        iconBgClass="bg-purple-100 dark:bg-purple-900/30"
                        iconTextClass="text-accent-purple"
                        patientCount={medicalQueue.length}
                        patients={medicalQueue}
                        onLinkNewPatient={() => navigate('/agenda')}
                        onPatientClick={handlePatientClick}
                    />

                    <QueueColumn
                        title="Enfermeira / Triagem"
                        icon="vaccines"
                        iconBgClass="bg-teal-100 dark:bg-teal-900/30"
                        iconTextClass="text-accent-teal"
                        patientCount={nurseQueue.length}
                        patients={nurseQueue}
                        onLinkNewPatient={() => navigate('/agenda')}
                        onPatientClick={handlePatientClick}
                    />
                </div>
            </section>

            {/* Daily History Section */}
            <section className="mt-16 mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <span className="material-symbols-outlined text-2xl">history</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">Histórico do Dia</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Registros de Encerramento e Baixas</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    {dayHistory.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {dayHistory.map((item) => (
                                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 text-center">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{item.time}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{parseInt(item.time.split(':')[0]) < 12 ? 'AM' : 'PM'}</p>
                                        </div>
                                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200">{item.patientName}</h4>
                                            <p className="text-xs text-slate-400 font-medium">{item.type} • {item.professionalName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {item.status === 'finished' ? (
                                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                                Concluído
                                            </span>
                                        ) : item.status === 'canceled' ? (
                                            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm">cancel</span>
                                                Cancelado
                                            </span>
                                        ) : item.status === 'no_show' ? (
                                            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm">person_off</span>
                                                Faltou
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm">smart_toy</span>
                                                Auto-Encerrado
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <span className="material-symbols-outlined text-slate-200 dark:text-slate-700 text-5xl mb-3">history_toggle_off</span>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Nenhum histórico para este dia</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Action Modal */}
            <QueueActionModal
                isOpen={isActionModalOpen}
                onClose={() => setIsActionModalOpen(false)}
                patient={selectedPatient}
                onCall={handleCallPatient}
                onFinish={handleFinishPatient}
                onNoShow={handleNoShow}
                onCancel={handleCancel}
            />
        </div>
    );
};
