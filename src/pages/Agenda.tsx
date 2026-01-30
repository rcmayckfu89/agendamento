
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Appointment, ServiceType } from '../types';
import { daysOfWeek, weekDaySlugs } from '../constants/weekConfig';
import { formatDateToYYYYMMDD, getTodayLocalStr } from '../utils/dateUtils';
import { useRealtimeAppointments } from '../hooks/useRealtimeAppointments';

export const Agenda: React.FC = () => {
    const {
        professionals,
        patients,
        appointments,
        addAppointment,
        deleteAppointment,
        blockedDays,
        handleRealtimeInsert,
        handleRealtimeUpdate,
        handleRealtimeDelete
    } = useApp();

    // Mount/Unmount logging for debugging
    useEffect(() => {
        console.log('🟢 [Agenda] Mounted');
        return () => console.log('🔴 [Agenda] Unmounted');
    }, []);

    // UI State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedProfId, setSelectedProfId] = useState<string>(professionals[0]?.id || '');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [apptToDelete, setApptToDelete] = useState<Appointment | null>(null);

    // Modal Form State
    const [formPatientId, setFormPatientId] = useState('');
    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const [showPatientList, setShowPatientList] = useState(false);
    const [formDate, setFormDate] = useState('');
    const [formTime, setFormTime] = useState('');
    const [formType, setFormType] = useState<ServiceType>('AGENDA');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const selectedProf = professionals.find(p => p.id === selectedProfId);

    // --- Helper Functions ---
    const getWeekDates = (baseDate: Date) => {
        const startOfWeek = new Date(baseDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day;
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const week = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            week.push(d);
        }
        return week;
    };

    const weekDates = getWeekDates(currentDate);

    // Calculate date range for Realtime subscription
    const dateRange = useMemo(() => {
        if (weekDates.length === 0) return { startDate: '', endDate: '' };

        const startDate = formatDateToYYYYMMDD(weekDates[0]);
        const endDate = formatDateToYYYYMMDD(weekDates[weekDates.length - 1]);

        return { startDate, endDate };
    }, [weekDates]);

    // Subscribe to Realtime updates for the visible week
    useRealtimeAppointments({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        onInsert: handleRealtimeInsert,
        onUpdate: handleRealtimeUpdate,
        onDelete: handleRealtimeDelete,
        enabled: !!dateRange.startDate && !!dateRange.endDate
    });

    // --- Logic to check if a specific day/time is valid for a type ---
    const validateAppointment = (profId: string, dateStr: string, timeStr: string, type: ServiceType): { valid: boolean, error?: string } => {
        const prof = professionals.find(p => p.id === profId);
        if (!prof) return { valid: false, error: 'Profissional não encontrado' };

        // 0. Check Blocked Days (Holidays)
        const blockedDay = blockedDays.find(b => b.date === dateStr);
        if (blockedDay) {
            return { valid: false, error: `DATA BLOQUEADA: ${blockedDay.reason}` };
        }

        // 1. Check Shift Configuration
        const dateObj = new Date(dateStr + 'T00:00:00');
        const daySlug = weekDaySlugs[dateObj.getDay()];
        if (daySlug === 'dom' || daySlug === 'sab') return { valid: false, error: 'Fim de semana não configurado.' };

        const hour = parseInt(timeStr.split(':')[0]);
        const shiftKey = hour < 13 ? `${daySlug}-manha` : `${daySlug}-tarde`;
        const shiftConfig = prof.schedule[shiftKey];

        if (!shiftConfig || shiftConfig.type === 'LIVRE') {
            return { valid: false, error: `Horário bloqueado ou não configurado para este dia (${daySlug}).` };
        }

        if (shiftConfig.type !== type && shiftConfig.type !== 'AGENDA') {
            return { valid: false, error: `Este horário é exclusivo para ${shiftConfig.type}.` };
        }

        // 1.1 Check Time Range (Start/End)
        if (shiftConfig.start && shiftConfig.end) {
            const [startH, startM] = shiftConfig.start.split(':').map(Number);
            const [endH, endM] = shiftConfig.end.split(':').map(Number);
            const [reqH, reqM] = timeStr.split(':').map(Number);

            const startMins = startH * 60 + startM;
            const endMins = endH * 60 + endM;
            const reqMins = reqH * 60 + reqM;

            if (reqMins < startMins || reqMins >= endMins) {
                return { valid: false, error: `Horário fora do expediente (${shiftConfig.start} às ${shiftConfig.end}).` };
            }
        }

        // 2. Check Overlap
        const collision = appointments.find(a =>
            a.professional_id === profId &&
            a.date === dateStr &&
            a.time === timeStr &&
            a.status !== 'canceled'
        );

        if (collision) {
            return { valid: false, error: 'Já existe um agendamento neste horário.' };
        }

        return { valid: true };
    };

    const handleNewAppointment = () => {
        setErrorMessage(null);
        setSuccessMessage(null);
        const today = getTodayLocalStr();
        setFormDate(today);
        setFormTime('08:00');
        setFormPatientId('');
        setPatientSearchTerm('');
        setShowPatientList(false);
        setIsModalOpen(true);
    };

    const handleSaveAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        // Validation
        const validation = validateAppointment(selectedProfId, formDate, formTime, formType);
        if (!validation.valid) {
            setErrorMessage(validation.error || 'Erro desconhecido');
            return;
        }

        const patient = patients.find(p => p.id === formPatientId);
        const prof = professionals.find(p => p.id === selectedProfId);

        if (!patient || !prof) {
            setErrorMessage("Selecione paciente e profissional.");
            return;
        }

        const newAppt: Partial<Appointment> = {
            // id generated by DB
            patient_id: patient.id,
            patientName: patient.name,
            professional_id: prof.id,
            professionalName: prof.name,
            date: formDate,
            time: formTime,
            type: formType,
            status: 'scheduled'
        };

        await addAppointment(newAppt);
        setSuccessMessage("Agendamento confirmado com sucesso!");

        setTimeout(() => setIsModalOpen(false), 1500);
    };

    const handleOpenDelete = (appt: Appointment) => {
        setApptToDelete(appt);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (apptToDelete && apptToDelete.id) {
            await deleteAppointment(apptToDelete.id);
            setIsDeleteModalOpen(false);
            setApptToDelete(null);
        }
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    // --- Render Logic ---

    // Filter appointments for the visible week
    const getAppointmentsForDay = (date: Date) => {
        const dateStr = formatDateToYYYYMMDD(date);
        return appointments
            .filter(a => a.date === dateStr && a.professional_id === selectedProfId && a.status !== 'canceled')
            .sort((a, b) => a.time.localeCompare(b.time));
    };

    // Get configuration for the day to show labels
    const getDayConfig = (date: Date) => {
        if (!selectedProf) return null;
        const dateStr = formatDateToYYYYMMDD(date);

        // Check blocked
        const blocked = blockedDays.find(b => b.date === dateStr);
        if (blocked) return { blocked: true, reason: blocked.reason };

        const daySlug = weekDaySlugs[date.getDay()];
        if (daySlug === 'dom' || daySlug === 'sab') return null;

        // Safety Check: schedule might be missing if data is corrupted
        const schedule = selectedProf.schedule || {};

        return {
            am: schedule[`${daySlug}-manha`] || { type: 'LIVRE' },
            pm: schedule[`${daySlug}-tarde`] || { type: 'LIVRE' }
        };
    };

    return (
        <div className="flex flex-col h-full relative animate-precision-fade">
            {/* Header - responsive */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 md:mb-8">
                <div className="w-full lg:w-auto text-center lg:text-left">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter text-foreground font-display leading-tight">Agenda Clínica</h2>
                    <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">Sincronização de Atendimentos</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <div className="flex-1 sm:w-64">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Profissional:</label>
                        <select
                            value={selectedProfId}
                            onChange={(e) => setSelectedProfId(e.target.value)}
                            className="w-full bg-card border border-border rounded-lg py-2.5 px-3 text-xs font-bold font-display focus:ring-accent focus:border-accent outline-none uppercase tracking-wide transition-all shadow-sm"
                        >
                            {professionals.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleNewAppointment}
                        className="bg-accent text-accent-foreground font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-accent/90 transition-all shadow-md text-[10px] sm:text-xs uppercase tracking-widest active-click border border-white/10 sm:mt-4"
                    >
                        <span className="material-symbols-outlined text-xl text-white">add_circle</span>
                        Novo Agendamento
                    </button>
                </div>
            </header>

            <div className="flex-1 flex flex-col bg-card border border-border rounded-xl shadow-sm min-h-[400px] md:min-h-[600px] overflow-hidden">
                {/* Navigation Header - responsive */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-3 md:p-4 border-b border-border bg-muted/20 gap-3">
                    <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto justify-between sm:justify-start">
                        <h3 className="text-sm sm:text-base md:text-lg font-bold text-foreground capitalize font-display tracking-tight">
                            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </h3>
                        <div className="flex items-center gap-1 bg-background rounded-lg border border-border p-0.5 shadow-sm">
                            <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))} className="p-1 px-2 rounded-lg hover:bg-accent hover:text-white transition-colors"><span className="material-symbols-outlined text-base md:text-lg">chevron_left</span></button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-3 text-[9px] md:text-[10px] font-bold uppercase tracking-wider hover:bg-accent hover:text-white rounded-md transition-colors h-7 flex items-center">Hoje</button>
                            <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))} className="p-1 px-2 rounded-lg hover:bg-accent hover:text-white transition-colors"><span className="material-symbols-outlined text-base md:text-lg">chevron_right</span></button>
                        </div>
                    </div>
                    {/* Legend - hidden on very small screens, scrollable on mobile */}
                    <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5 min-w-fit"><div className="w-2 h-2 bg-primary border border-white/10"></div><span>Geral</span></div>
                        <div className="flex items-center gap-1.5 min-w-fit"><div className="w-2 h-2 bg-orange-600 border border-white/10"></div><span>Hiperdia</span></div>
                        <div className="flex items-center gap-1.5 min-w-fit"><div className="w-2 h-2 bg-pink-600 border border-white/10"></div><span>Natal</span></div>
                        <div className="flex items-center gap-1.5 min-w-fit"><div className="w-2 h-2 bg-destructive border border-white/10"></div><span>Bloqueio</span></div>
                    </div>
                </div>

                {/* Calendar Container - scrollable on mobile */}
                <div className="flex-1 overflow-x-auto overflow-y-auto">
                    {/* Calendar Header Days */}
                    <div className="grid grid-cols-7 flex-none bg-background min-w-[700px] md:min-w-0">
                        {weekDates.map((date, idx) => {
                            const isCurrent = isToday(date);
                            const config = getDayConfig(date);
                            return (
                                <div key={idx} className={`border-r border-border text-center py-2 md:py-4 ${isCurrent ? 'bg-primary/10' : ''}`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isCurrent ? 'text-primary' : 'text-muted-foreground opacity-60'}`}>{daysOfWeek[idx]}</p>
                                    <p className={`text-xl md:text-2xl font-bold font-display tracking-tight ${isCurrent ? 'text-primary' : ''}`}>{date.getDate()}</p>
                                    {/* Mini Config Display - mono labels */}
                                    <div className="hidden md:block">
                                        {config && !('blocked' in config) && (
                                            <div className="flex flex-col gap-0.5 mt-2 px-1">
                                                <span className={`text-[8px] font-mono font-bold px-1 rounded-full uppercase tracking-tighter ${config.am.type === 'LIVRE' ? 'bg-muted text-muted-foreground opacity-30' : 'bg-primary text-primary-foreground'}`}>
                                                    M:{config.am.type === 'LIVRE' ? '—' : config.am.type}
                                                </span>
                                                <span className={`text-[8px] font-mono font-bold px-1 rounded-full uppercase tracking-tighter ${config.pm.type === 'LIVRE' ? 'bg-muted text-muted-foreground opacity-30' : 'bg-accent text-accent-foreground'}`}>
                                                    T:{config.pm.type === 'LIVRE' ? '—' : config.pm.type}
                                                </span>
                                            </div>
                                        )}
                                        {config && 'blocked' in config && (
                                            <div className="flex flex-col gap-0.5 mt-2 px-1">
                                                <span className="text-[8px] font-bold px-1 rounded-full bg-destructive text-destructive-foreground border border-white/10 uppercase tracking-tighter">
                                                    LOCK
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 flex-grow border-t border-border min-w-[700px] md:min-w-0">
                        {weekDates.map((date, idx) => {
                            const config = getDayConfig(date);
                            const isBlocked = config && 'blocked' in config;

                            if (isBlocked) {
                                return (
                                    <div key={idx} className="border-r border-border min-h-[200px] bg-red-50/50 flex flex-col items-center justify-center p-2 text-center">
                                        <span className="material-symbols-outlined text-red-300 text-3xl">event_busy</span>
                                        <p className="text-xs text-red-500 font-bold mt-2">{(config as any).reason}</p>
                                    </div>
                                )
                            }

                            const dayAppts = getAppointmentsForDay(date);
                            return (
                                <div key={idx} className="border-r border-border min-h-[200px] p-1 space-y-2 hover:bg-accent/5 transition-colors relative">
                                    {dayAppts.length > 0 ? (
                                        dayAppts.map(appt => {
                                            // Updated clinical colors
                                            const type = appt.type || 'AGENDA';
                                            let colorClass = 'bg-primary text-primary-foreground border-accent';
                                            if (type === 'HIPERDIA') colorClass = 'bg-orange-600 text-white border-orange-400';
                                            if (type === 'PRÉ-NATAL') colorClass = 'bg-pink-600 text-white border-pink-400';
                                            if (type === 'PUERICULTURA') colorClass = 'bg-teal-700 text-white border-teal-500';
                                            if (type === 'CITOPATOLÓGICO') colorClass = 'bg-cyan-600 text-white border-cyan-400';
                                            if (type === 'VISITA DOMICILIAR') colorClass = 'bg-indigo-600 text-white border-indigo-400';
                                            if (type === 'DEMANDA ESPONTÂNEA') colorClass = 'bg-red-600 text-white border-red-400';

                                            return (
                                                <div
                                                    onClick={() => handleOpenDelete(appt)}
                                                    key={appt.id}
                                                    className={`${colorClass} border-l-[3px] p-2.5 rounded-lg text-[12px] shadow-sm cursor-pointer hover:brightness-110 active-click animate-sync-slide outline-none`}
                                                    title={`${type} - ${appt.patientName || 'Sem Nome'}`}
                                                >
                                                    <div className="font-mono font-bold text-[13px] mb-1 tracking-tighter">
                                                        {appt.time}
                                                    </div>
                                                    <div className="truncate font-bold font-display uppercase tracking-tight text-[13px] leading-tight">{appt.patientName || 'Paciente'}</div>
                                                    <div className="opacity-80 truncate text-[10px] font-bold tracking-[0.1em] uppercase mt-0.5">{type}</div>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-muted-foreground/20 text-xs">
                                            Livre
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Modal de Novo Agendamento */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-card rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-precision-fade border border-border">
                            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-muted/30">
                                <h3 className="font-bold text-lg font-display tracking-tight text-foreground uppercase">Agendar Atendimento</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground active-click transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleSaveAppointment} className="p-6 space-y-5">
                                {errorMessage && (
                                    <div className="bg-destructive/10 border border-destructive px-4 py-3 rounded-lg text-xs font-bold text-destructive flex items-start gap-2 animate-sync-slide">
                                        <span className="material-symbols-outlined text-sm">report</span>
                                        {errorMessage}
                                    </div>
                                )}
                                {successMessage && (
                                    <div className="bg-accent/10 border border-accent px-4 py-3 rounded-lg text-xs font-bold text-accent flex items-start gap-2 animate-sync-slide">
                                        <span className="material-symbols-outlined text-sm">verified</span>
                                        {successMessage}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Profissional Responsável</label>
                                        <div className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-xs font-bold text-foreground font-display cursor-not-allowed uppercase">
                                            {selectedProf?.name || ''}
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Paciente</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="PESQUISAR NOME OU CPF..."
                                                value={patientSearchTerm}
                                                onChange={(e) => {
                                                    setPatientSearchTerm(e.target.value);
                                                    setShowPatientList(true);
                                                    if (e.target.value === '') setFormPatientId('');
                                                }}
                                                onFocus={() => setShowPatientList(true)}
                                                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 focus:border-accent focus:outline-none text-xs font-bold uppercase placeholder:text-muted-foreground/50 transition-all font-display"
                                            />
                                            {formPatientId && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-accent">
                                                    <span className="material-symbols-outlined text-lg">check_circle</span>
                                                </div>
                                            )}
                                        </div>

                                        {showPatientList && (
                                            <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-2xl max-h-52 overflow-auto custom-scrollbar">
                                                {patients.filter(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase())).length > 0 ? (
                                                    patients
                                                        .filter(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()))
                                                        .map(p => (
                                                            <div
                                                                key={p.id}
                                                                onClick={() => {
                                                                    setFormPatientId(p.id);
                                                                    setPatientSearchTerm(p.name);
                                                                    setShowPatientList(false);
                                                                }}
                                                                className="px-4 py-3 hover:bg-accent hover:text-white cursor-pointer transition-colors border-b border-border/50 last:border-0 flex flex-col gap-1"
                                                            >
                                                                <span className="font-bold text-xs uppercase tracking-tight">{p.name}</span>
                                                                <span className="text-[9px] font-mono opacity-60">DOC: {p.cpfOrCns}</span>
                                                            </div>
                                                        ))
                                                ) : (
                                                    <div className="px-4 py-4 text-[10px] font-bold text-muted-foreground text-center uppercase tracking-widest">
                                                        Nenhum registro encontrado
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {showPatientList && (
                                            <div className="fixed inset-0 z-0" onClick={() => setShowPatientList(false)}></div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Data</label>
                                            <input
                                                required
                                                type="date"
                                                value={formDate}
                                                onChange={(e) => setFormDate(e.target.value)}
                                                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs font-bold uppercase focus:border-accent outline-none font-display"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Horário</label>
                                            <input
                                                required
                                                type="time"
                                                value={formTime}
                                                onChange={(e) => setFormTime(e.target.value)}
                                                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs font-bold uppercase focus:border-accent outline-none font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Linha de Cuidado</label>
                                        <select
                                            required
                                            value={formType}
                                            onChange={(e) => setFormType(e.target.value as ServiceType)}
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs font-bold uppercase focus:border-accent outline-none font-display tracking-wide"
                                        >
                                            <option value="AGENDA">AGENDA GERAL</option>
                                            <option value="HIPERDIA">HIPERDIA (HAS/DM)</option>
                                            <option value="PRÉ-NATAL">PRÉ-NATAL</option>
                                            <option value="PUERICULTURA">PUERICULTURA</option>
                                            <option value="CITOPATOLÓGICO">CITOPATOLÓGICO</option>
                                            <option value="VISITA DOMICILIAR">VISITA DOMICILIAR</option>
                                            <option value="DEMANDA ESPONTÂNEA">DEMANDA ESPONTÂNEA</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-2 flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-muted transition-colors transition-all active-click">Cancelar</button>
                                    <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/95 transition-all shadow-md active-click border border-white/10">
                                        Validar e Confirmar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal de Exclusão de Agendamento */}
                {isDeleteModalOpen && apptToDelete && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-card rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-destructive/5">
                                <h3 className="font-bold text-lg text-destructive flex items-center gap-2">
                                    <span className="material-symbols-outlined">delete_forever</span>
                                    Cancelar Agendamento?
                                </h3>
                                <button onClick={() => setIsDeleteModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="mb-4 text-sm text-foreground space-y-2">
                                    <div className="p-3 bg-secondary/20 rounded-lg border border-border">
                                        <p><strong>Paciente:</strong> {apptToDelete.patientName}</p>
                                        {(() => {
                                            const patient = patients.find(p => p.id === apptToDelete.patient_id);
                                            if (patient) {
                                                return (
                                                    <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                                                        <p><strong>Nascimento:</strong> {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('pt-BR') : 'Não informado'}</p>
                                                        <p><strong>ACS:</strong> {patient.health_agent || 'Não informado'}</p>
                                                        <p><strong>Responsável:</strong> {patient.guardian_name || 'Não informado'}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                    <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-red-800">
                                        <p><strong>Agendamento:</strong> {apptToDelete.date.split('-').reverse().join('/')} às {apptToDelete.time}</p>
                                        <p className="mt-2 text-xs opacity-90">Esta ação cancelará o agendamento permanentemente.</p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
                                    >
                                        Manter
                                    </button>
                                    <button
                                        onClick={handleConfirmDelete}
                                        className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors shadow-sm"
                                    >
                                        Confirmar Cancelamento
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};