
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Appointment, ServiceType } from '../types';
import { daysOfWeek, weekDaySlugs } from '../constants/weekConfig';

export const Agenda: React.FC = () => {
    const { professionals, patients, appointments, addAppointment, deleteAppointment, blockedDays } = useApp();

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
            a.status !== 'cancelled'
        );

        if (collision) {
            return { valid: false, error: 'Já existe um agendamento neste horário.' };
        }

        return { valid: true };
    };

    const handleNewAppointment = () => {
        setErrorMessage(null);
        setSuccessMessage(null);
        const today = new Date().toISOString().split('T')[0];
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
        const dateStr = date.toISOString().split('T')[0];
        return appointments
            .filter(a => a.date === dateStr && a.professional_id === selectedProfId && a.status !== 'cancelled')
            .sort((a, b) => a.time.localeCompare(b.time));
    };

    // Get configuration for the day to show labels
    const getDayConfig = (date: Date) => {
        if (!selectedProf) return null;
        const dateStr = date.toISOString().split('T')[0];

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
        <div className="flex flex-col h-full relative animate-slide-in-up">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Agenda Semanal</h2>
                    <p className="text-muted-foreground mt-1">Gerencie os agendamentos da semana.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <label className="text-xs font-semibold text-muted-foreground mb-1">Visualizando Agenda de:</label>
                        <select
                            value={selectedProfId}
                            onChange={(e) => setSelectedProfId(e.target.value)}
                            className="bg-card border border-border rounded-lg py-2 px-3 text-sm font-medium focus:ring-primary"
                        >
                            {professionals.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleNewAppointment}
                        className="bg-primary text-primary-foreground font-semibold py-2.5 px-5 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-soft h-fit mt-5"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Novo Agendamento
                    </button>
                </div>
            </header>

            <div className="flex-1 flex flex-col bg-card border border-border rounded-xl shadow-soft min-h-[600px] overflow-hidden">
                {/* Navigation Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/10">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl font-semibold text-foreground capitalize">
                            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </h3>
                        <div className="flex items-center gap-1 bg-background rounded-md border border-border p-1">
                            <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))} className="p-1 rounded hover:bg-accent"><span className="material-symbols-outlined">chevron_left</span></button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-3 text-sm font-semibold hover:bg-accent rounded">Hoje</button>
                            <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))} className="p-1 rounded hover:bg-accent"><span className="material-symbols-outlined">chevron_right</span></button>
                        </div>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-violet-100 border-l-2 border-violet-500 rounded-sm"></div><span>Consulta</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-100 border-l-2 border-orange-500 rounded-sm"></div><span>Hiperdia</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-pink-100 border-l-2 border-pink-500 rounded-sm"></div><span>Pré-Natal</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-100 border-l-2 border-red-500 rounded-sm"></div><span>Bloqueado</span></div>
                    </div>
                </div>

                {/* Calendar Header Days */}
                <div className="grid grid-cols-7 flex-none bg-background">
                    {weekDates.map((date, idx) => {
                        const isCurrent = isToday(date);
                        const config = getDayConfig(date);
                        return (
                            <div key={idx} className={`border-r border-border text-center py-3 ${isCurrent ? 'bg-primary/5' : ''}`}>
                                <p className={`text-xs font-bold uppercase ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>{daysOfWeek[idx]}</p>
                                <p className={`text-xl font-bold ${isCurrent ? 'text-primary' : ''}`}>{date.getDate()}</p>
                                {/* Mini Config Display */}
                                {config && !('blocked' in config) && (
                                    <div className="flex flex-col gap-0.5 mt-1 px-1">
                                        <span className={`text-[9px] px-1 rounded truncate ${config.am.type === 'LIVRE' ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-700 font-medium'}`}>
                                            M: {config.am.type === 'LIVRE' ? 'X' : config.am.type}
                                        </span>
                                        <span className={`text-[9px] px-1 rounded truncate ${config.pm.type === 'LIVRE' ? 'bg-gray-100 text-gray-400' : 'bg-indigo-50 text-indigo-700 font-medium'}`}>
                                            T: {config.pm.type === 'LIVRE' ? 'X' : config.pm.type}
                                        </span>
                                    </div>
                                )}
                                {config && 'blocked' in config && (
                                    <div className="flex flex-col gap-0.5 mt-1 px-1">
                                        <span className="text-[9px] px-1 rounded truncate bg-red-100 text-red-700 font-bold border border-red-200">
                                            BLOQUEADO
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 flex-grow overflow-y-auto border-t border-border">
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
                                        // Dynamic styling based on type
                                        const type = appt.type || 'AGENDA'; // Safety Default
                                        let colorClass = 'bg-violet-100 border-violet-500 text-violet-800';
                                        if (type === 'HIPERDIA') colorClass = 'bg-orange-100 border-orange-500 text-orange-800';
                                        if (type === 'PRÉ-NATAL') colorClass = 'bg-pink-100 border-pink-500 text-pink-800';
                                        if (type === 'PUERICULTURA') colorClass = 'bg-green-100 border-green-500 text-green-800';

                                        return (
                                            <div
                                                onClick={() => handleOpenDelete(appt)}
                                                key={appt.id}
                                                className={`${colorClass} border-l-4 p-2 rounded text-xs shadow-sm cursor-pointer hover:brightness-95`}
                                                title={`${type} - ${appt.patientName || 'Sem Nome'}`}
                                            >
                                                <div className="flex justify-between font-bold">
                                                    <span>{appt.time}</span>
                                                </div>
                                                <div className="truncate font-medium">{appt.patientName || 'Paciente Desconhecido'}</div>
                                                <div className="opacity-75 truncate text-[10px] uppercase">{type}</div>
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
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
                            <h3 className="font-bold text-lg">Novo Agendamento</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSaveAppointment} className="p-6 space-y-4">
                            {errorMessage && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm flex items-start gap-2">
                                    <span className="material-symbols-outlined text-base mt-0.5">error</span>
                                    {errorMessage}
                                </div>
                            )}
                            {successMessage && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm flex items-start gap-2">
                                    <span className="material-symbols-outlined text-base mt-0.5">check_circle</span>
                                    {successMessage}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Profissional</label>
                                <input
                                    disabled
                                    value={selectedProf?.name || ''}
                                    className="w-full rounded-md border border-border bg-muted text-muted-foreground px-3 py-2 cursor-not-allowed"
                                />
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-medium mb-1">Paciente</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Digite o nome do paciente..."
                                        value={patientSearchTerm}
                                        onChange={(e) => {
                                            setPatientSearchTerm(e.target.value);
                                            setShowPatientList(true);
                                            if (e.target.value === '') setFormPatientId('');
                                        }}
                                        onFocus={() => setShowPatientList(true)}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 pr-10 focus:ring-2 focus:ring-primary focus:outline-none"
                                    />
                                    {formPatientId && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                                            <span className="material-symbols-outlined text-lg">check_circle</span>
                                        </div>
                                    )}
                                </div>

                                {showPatientList && (
                                    <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
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
                                                        className="px-4 py-2 hover:bg-accent cursor-pointer text-sm border-b border-border/50 last:border-0 flex flex-col"
                                                    >
                                                        <span className="font-medium">{p.name}</span>
                                                        <span className="text-xs text-muted-foreground">CPF: {p.cpfOrCns}</span>
                                                    </div>
                                                ))
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                                Nenhum paciente encontrado.
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* Overlay to close list when clicking outside (simple version) */}
                                {showPatientList && (
                                    <div className="fixed inset-0 z-0" onClick={() => setShowPatientList(false)}></div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Data</label>
                                    <input
                                        required
                                        type="date"
                                        value={formDate}
                                        onChange={(e) => setFormDate(e.target.value)}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Horário</label>
                                    <input
                                        required
                                        type="time"
                                        value={formTime}
                                        onChange={(e) => setFormTime(e.target.value)}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Tipo de Atendimento</label>
                                <select
                                    required
                                    value={formType}
                                    onChange={(e) => setFormType(e.target.value as ServiceType)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                                >
                                    <option value="AGENDA">AGENDA (Geral)</option>
                                    <option value="HIPERDIA">HIPERDIA</option>
                                    <option value="PRÉ-NATAL">PRÉ-NATAL</option>
                                    <option value="PUERICULTURA">PUERICULTURA</option>
                                    <option value="CITOPATOLÓGICO">CITOPATOLÓGICO</option>
                                    <option value="VISITA DOMICILIAR">VISITA DOMICILIAR</option>
                                    <option value="DEMANDA ESPONTÂNEA">DEMANDA ESPONTÂNEA</option>
                                </select>
                                <p className="text-xs text-muted-foreground mt-1">
                                    O sistema verificará se este tipo é permitido na data/hora selecionada.
                                </p>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors">Cancelar</button>
                                <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                                    Confirmar Agendamento
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
    );
};