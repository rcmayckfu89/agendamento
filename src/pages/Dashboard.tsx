
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/features/StatCard';
import { StatData, Appointment } from '../types';
import { useApp } from '../context/AppContext';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { appointments, professionals, updateAppointment } = useApp();

    // Mount/Unmount logging for debugging
    useEffect(() => {
        console.log('🟢 [Dashboard] Mounted');
        return () => console.log('🔴 [Dashboard] Unmounted');
    }, []);

    // State for Date Navigation
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const datePickerRef = useRef<HTMLDivElement>(null);

    // State for Interaction Modal
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Close date picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                setIsDatePickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Date helpers
    const formatDateString = (date: Date) => date.toISOString().split('T')[0];
    const todayStr = formatDateString(new Date());
    const selectedDateStr = formatDateString(selectedDate);
    const isToday = selectedDateStr === todayStr;

    const isYesterday = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return selectedDateStr === formatDateString(yesterday);
    };

    const isTomorrow = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return selectedDateStr === formatDateString(tomorrow);
    };

    const getDateLabel = () => {
        if (isToday) return 'Hoje';
        if (isYesterday()) return 'Ontem';
        if (isTomorrow()) return 'Amanhã';
        return selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const navigateDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const goToToday = () => {
        setSelectedDate(new Date());
        setIsDatePickerOpen(false);
    };

    // Calculate stats based on selected date
    const stats: StatData[] = useMemo(() => {
        const dateAppts = appointments.filter(a => a.date === selectedDateStr && a.status !== 'canceled');

        const countByRole = (role: string) => {
            return dateAppts.filter(a => {
                const prof = professionals.find(p => p.id === a.professional_id);
                return prof?.role === role;
            }).length;
        };

        const totalDocs = professionals.filter(p => p.role === 'medico').length * 10;
        const totalNurses = professionals.filter(p => p.role === 'enfermeiro').length * 10;
        const totalTechs = professionals.filter(p => p.role === 'tecnico').length * 10;

        const currentDocs = countByRole('medico');
        const currentNurses = countByRole('enfermeiro');
        const currentTechs = countByRole('tecnico');

        const urgentCount = dateAppts.filter(a => a.type === 'DEMANDA ESPONTÂNEA').length;

        const dayLabel = isToday ? 'agendados hoje' : `em ${getDateLabel().toLowerCase()}`;

        return [
            { category: 'Doctor', current: currentDocs, total: Math.max(currentDocs, totalDocs || 10), label: dayLabel, icon: 'medical_services', colorClass: 'violet', ringColorClass: 'text-violet-500' },
            { category: 'Nurse', current: currentNurses, total: Math.max(currentNurses, totalNurses || 10), label: dayLabel, icon: 'health_and_safety', colorClass: 'green', ringColorClass: 'text-green-500' },
            { category: 'Technician', current: currentTechs, total: Math.max(currentTechs, totalTechs || 10), label: dayLabel, icon: 'biotech', colorClass: 'sky', ringColorClass: 'text-sky-500' },
            { category: 'Urgent', current: urgentCount, total: 10, label: 'demandas espontâneas', icon: 'priority_high', colorClass: 'destructive', ringColorClass: '' },
        ];
    }, [appointments, professionals, selectedDateStr]);

    // Get appointments for selected date
    const dateAppointments = useMemo(() => {
        return appointments
            .filter(a => a.date === selectedDateStr && a.status === 'scheduled')
            .sort((a, b) => a.time.localeCompare(b.time));
    }, [appointments, selectedDateStr]);

    const getNextForRole = (role: string) => {
        return dateAppointments.filter(a => {
            const prof = professionals.find(p => p.id === a.professional_id);
            const roleMap: Record<string, string> = {
                'Médico': 'medico',
                'Enfermeira': 'enfermeiro',
                'Técnica': 'tecnico'
            };
            return prof?.role === roleMap[role];
        });
    };

    const handleAppointmentClick = (app: Appointment) => {
        setSelectedAppointment(app);
        setIsModalOpen(true);
    };

    const updateStatus = (status: 'finished' | 'no_show' | 'canceled') => {
        if (selectedAppointment) {
            console.log('📝 [Dashboard] Atualizando status do agendamento:', {
                id: selectedAppointment.id,
                paciente: selectedAppointment.patientName,
                status: status,
                data: selectedAppointment.date
            });
            updateAppointment({
                ...selectedAppointment,
                status: status
            });
            setIsModalOpen(false);
            setSelectedAppointment(null);
        }
    };

    const emptyMessage = isToday
        ? 'Agenda livre para'
        : `Sem agendamentos ${getDateLabel().toLowerCase()} para`;

    return (
        <div className="flex flex-col h-full relative">
            {/* Header - responsive */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-10">
                <div className="relative">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Visão Geral</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm md:text-base text-muted-foreground">
                            Resumo dos seus atendimentos
                        </p>

                        {/* Date Picker Pill */}
                        <div ref={datePickerRef} className="relative">
                            <button
                                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                className={`
                                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium
                                    transition-all duration-300 ease-out
                                    ${isToday
                                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                                    }
                                    ${isDatePickerOpen ? 'ring-2 ring-primary/30 shadow-md' : 'hover:shadow-sm'}
                                `}
                            >
                                <span className="material-symbols-outlined text-base">calendar_today</span>
                                <span>{getDateLabel()}</span>
                                <span className={`material-symbols-outlined text-base transition-transform duration-300 ${isDatePickerOpen ? 'rotate-180' : ''}`}>
                                    expand_more
                                </span>
                            </button>

                            {/* Expanded Date Navigator */}
                            <div className={`
                                absolute top-full left-0 mt-2 z-50
                                bg-card border border-border rounded-xl shadow-xl
                                overflow-hidden
                                transition-all duration-300 ease-out origin-top-left
                                ${isDatePickerOpen
                                    ? 'opacity-100 scale-100 translate-y-0'
                                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                                }
                            `}>
                                <div className="p-3 min-w-[280px]">
                                    {/* Navigation Row */}
                                    <div className="flex items-center justify-between mb-3">
                                        <button
                                            onClick={() => navigateDate(-1)}
                                            className="p-2 rounded-lg hover:bg-accent transition-colors"
                                            title="Dia anterior"
                                        >
                                            <span className="material-symbols-outlined">chevron_left</span>
                                        </button>

                                        <div className="text-center">
                                            <p className="text-lg font-bold text-foreground">
                                                {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => navigateDate(1)}
                                            className="p-2 rounded-lg hover:bg-accent transition-colors"
                                            title="Próximo dia"
                                        >
                                            <span className="material-symbols-outlined">chevron_right</span>
                                        </button>
                                    </div>

                                    {/* Quick Access Buttons */}
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        {[-1, 0, 1].map(offset => {
                                            const date = new Date();
                                            date.setDate(date.getDate() + offset);
                                            const dateStr = formatDateString(date);
                                            const isSelected = selectedDateStr === dateStr;
                                            const label = offset === -1 ? 'Ontem' : offset === 0 ? 'Hoje' : 'Amanhã';

                                            return (
                                                <button
                                                    key={offset}
                                                    onClick={() => {
                                                        setSelectedDate(date);
                                                        setIsDatePickerOpen(false);
                                                    }}
                                                    className={`
                                                        px-3 py-2 rounded-lg text-sm font-medium transition-all
                                                        ${isSelected
                                                            ? 'bg-primary text-primary-foreground shadow-md'
                                                            : 'bg-secondary/50 hover:bg-secondary text-foreground'
                                                        }
                                                    `}
                                                >
                                                    <span className="block text-xs opacity-70">
                                                        {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                    </span>
                                                    <span>{label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Go to Today Button */}
                                    {!isToday && (
                                        <button
                                            onClick={goToToday}
                                            className="w-full py-2 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-base">today</span>
                                            Voltar para Hoje
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Visual indicator when not today */}
                        {!isToday && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 animate-pulse">
                                <span className="material-symbols-outlined text-sm">history</span>
                                visualizando outro dia
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
                    <button
                        onClick={() => navigate('/agenda')}
                        className="flex-1 sm:flex-none bg-primary text-primary-foreground font-semibold py-2 md:py-2.5 px-3 md:px-5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-soft text-sm md:text-base"
                    >
                        <span className="material-symbols-outlined text-xl md:text-2xl">event</span>
                        <span className="hidden sm:inline">Abrir Agenda</span>
                        <span className="sm:hidden">Agenda</span>
                    </button>
                    <button
                        onClick={() => navigate('/patients')}
                        className="flex-1 sm:flex-none bg-card text-secondary-foreground font-semibold py-2 md:py-2.5 px-3 md:px-5 rounded-lg flex items-center justify-center gap-2 hover:bg-secondary transition-colors border border-border shadow-soft text-sm md:text-base"
                    >
                        <span className="material-symbols-outlined text-xl md:text-2xl">visibility</span>
                        <span className="hidden sm:inline">Ver Pacientes</span>
                        <span className="sm:hidden">Pacientes</span>
                    </button>
                </div>
            </header>

            {/* Stats Grid - responsive: 2 cols on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10">
                {stats.map((stat) => (
                    <StatCard key={stat.category} data={stat} />
                ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-0 md:pr-2">
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <h3 className="text-lg md:text-2xl font-bold tracking-tight text-foreground">
                        {isToday ? 'Próximos Atendimentos' : `Atendimentos de ${getDateLabel()}`}
                    </h3>
                    {!isToday && (
                        <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full">
                            {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                    )}
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 -mt-2 md:-mt-4">
                    {isToday ? 'Toque para alterar o status.' : 'Atendimentos pendentes deste dia.'}
                </p>

                <div className="space-y-4 md:space-y-6">
                    {/* Doctor Section */}
                    <div className="flex items-start">
                        <div className="flex flex-col items-center mr-3 md:mr-6 h-full">
                            <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-violet-100 border-2 md:border-4 border-violet-50 shrink-0">
                                <span className="material-symbols-outlined text-violet-600 text-lg md:text-2xl">medical_services</span>
                            </div>
                        </div>
                        <div className="pb-3 md:pb-4 flex-1 min-w-0">
                            <h4 className="font-semibold text-lg text-foreground mb-3">Médico</h4>
                            <div className="space-y-3">
                                {getNextForRole('Médico').length > 0 ? (
                                    getNextForRole('Médico').map(app => (
                                        <div
                                            key={app.id}
                                            onClick={() => handleAppointmentClick(app)}
                                            className="bg-card border border-border rounded-xl p-4 shadow-soft flex justify-between items-center cursor-pointer hover:border-violet-400 hover:shadow-md transition-all group"
                                        >
                                            <div>
                                                <p className="font-bold text-foreground group-hover:text-violet-600 transition-colors">{app.patientName}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span className="bg-secondary px-2 py-0.5 rounded text-xs font-medium uppercase">{app.type}</span>
                                                    <span>• {app.professionalName}</span>
                                                </div>
                                            </div>
                                            <span className="text-violet-600 font-bold bg-violet-50 px-3 py-1 rounded-lg">{app.time}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-card border border-border border-dashed rounded-xl p-4 flex justify-center text-muted-foreground text-sm italic">
                                        {emptyMessage} Médicos.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Nurse Section */}
                    <div className="flex items-start">
                        <div className="flex flex-col items-center mr-6 h-full">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 border-4 border-green-50 shrink-0">
                                <span className="material-symbols-outlined text-green-600">health_and_safety</span>
                            </div>
                        </div>
                        <div className="pb-4 flex-1">
                            <h4 className="font-semibold text-lg text-foreground mb-3">Enfermeira</h4>
                            <div className="space-y-3">
                                {getNextForRole('Enfermeira').length > 0 ? (
                                    getNextForRole('Enfermeira').map(app => (
                                        <div
                                            key={app.id}
                                            onClick={() => handleAppointmentClick(app)}
                                            className="bg-card border border-border rounded-xl p-4 shadow-soft flex justify-between items-center cursor-pointer hover:border-green-400 hover:shadow-md transition-all group"
                                        >
                                            <div>
                                                <p className="font-bold text-foreground group-hover:text-green-600 transition-colors">{app.patientName}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span className="bg-secondary px-2 py-0.5 rounded text-xs font-medium uppercase">{app.type}</span>
                                                    <span>• {app.professionalName}</span>
                                                </div>
                                            </div>
                                            <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-lg">{app.time}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-card border border-border border-dashed rounded-xl p-4 flex justify-center text-muted-foreground text-sm italic">
                                        {emptyMessage} Enfermeiras.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Technician Section */}
                    <div className="flex items-start">
                        <div className="flex flex-col items-center mr-6 h-full">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-sky-100 border-4 border-sky-50 shrink-0">
                                <span className="material-symbols-outlined text-sky-600">biotech</span>
                            </div>
                        </div>
                        <div className="pb-4 flex-1">
                            <h4 className="font-semibold text-lg text-foreground mb-3">Técnica</h4>
                            <div className="space-y-3">
                                {getNextForRole('Técnica').length > 0 ? (
                                    getNextForRole('Técnica').map(app => (
                                        <div
                                            key={app.id}
                                            onClick={() => handleAppointmentClick(app)}
                                            className="bg-card border border-border rounded-xl p-4 shadow-soft flex justify-between items-center cursor-pointer hover:border-sky-400 hover:shadow-md transition-all group"
                                        >
                                            <div>
                                                <p className="font-bold text-foreground group-hover:text-sky-600 transition-colors">{app.patientName}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span className="bg-secondary px-2 py-0.5 rounded text-xs font-medium uppercase">{app.type}</span>
                                                    <span>• {app.professionalName}</span>
                                                </div>
                                            </div>
                                            <span className="text-sky-600 font-bold bg-sky-50 px-3 py-1 rounded-lg">{app.time}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-card border border-border border-dashed rounded-xl p-4 flex justify-center text-muted-foreground text-sm italic">
                                        {emptyMessage} Técnicas.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Status */}
            {isModalOpen && selectedAppointment && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-border bg-muted/20">
                            <h3 className="font-bold text-lg text-foreground">Gerenciar Atendimento</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {selectedAppointment.time} - {selectedAppointment.patientName}
                            </p>
                        </div>
                        <div className="p-6 space-y-3">
                            <button
                                onClick={() => updateStatus('finished')}
                                className="w-full bg-green-100 hover:bg-green-200 text-green-800 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border border-green-200"
                            >
                                <span className="material-symbols-outlined">check_circle</span>
                                Concluir Atendimento
                            </button>

                            <button
                                onClick={() => updateStatus('no_show')}
                                className="w-full bg-orange-100 hover:bg-orange-200 text-orange-800 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border border-orange-200"
                            >
                                <span className="material-symbols-outlined">person_off</span>
                                Paciente Faltou
                            </button>

                            <button
                                onClick={() => updateStatus('canceled')}
                                className="w-full bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border border-red-200"
                            >
                                <span className="material-symbols-outlined">cancel</span>
                                Cancelar Agendamento
                            </button>

                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-full mt-4 text-muted-foreground hover:bg-accent py-2 px-4 rounded-lg text-sm"
                            >
                                Voltar / Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
