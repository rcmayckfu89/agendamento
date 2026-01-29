
import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/features/StatCard';
import { StatData, Appointment } from '../types';
import { useApp } from '../context/AppContext';
import { formatDateToYYYYMMDD, getTodayLocalStr } from '../utils/dateUtils';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { appointments, professionals, updateAppointment, refreshData, isLoading } = useApp();

    // Mount/Unmount logging for debugging
    useEffect(() => {
        console.log('🟢 [Dashboard] Mounted');
        refreshData(); // Ensure fresh data on mount
        return () => console.log('🔴 [Dashboard] Unmounted');
    }, []);

    // State for Date Navigation
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const datePickerRef = useRef<HTMLDivElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

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
    const todayStr = getTodayLocalStr();
    const selectedDateStr = formatDateToYYYYMMDD(selectedDate);
    const isToday = selectedDateStr === todayStr;

    const isYesterday = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return selectedDateStr === formatDateToYYYYMMDD(yesterday);
    };

    const isTomorrow = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return selectedDateStr === formatDateToYYYYMMDD(tomorrow);
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

    // Auto-refresh data when date changes to ensure we have the latest
    useEffect(() => {
        console.log('🔄 [Dashboard] Date change detected:', selectedDateStr);
        refreshData();
    }, [selectedDateStr]);

    // Calculate stats based on selected date
    const stats: StatData[] = useMemo(() => {
        // Robust filtering in case date includes time components
        const dateAppts = appointments.filter(a => {
            const rowDate = a.date ? a.date.split('T')[0] : '';
            return rowDate === selectedDateStr && a.status !== 'canceled';
        });

        console.log(`📊 [Dashboard] Stats recalc. Appts for ${selectedDateStr}:`, dateAppts.length);

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

            { category: 'Urgent', current: urgentCount, total: 10, label: 'demandas espontâneas', icon: 'priority_high', colorClass: 'destructive', ringColorClass: '' },
        ];
    }, [appointments, professionals, selectedDateStr]);

    // Get appointments for selected date
    const dateAppointments = useMemo(() => {
        return appointments
            .filter(a => {
                const rowDate = a.date ? a.date.split('T')[0] : '';
                return rowDate === selectedDateStr && a.status === 'scheduled';
            })
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
            {/* Header - heroic typographic style */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-12 animate-sync-slide">
                <div className="relative">
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground font-display">
                        Visão Geral
                    </h2>
                    <div className="flex items-center gap-2 mt-4">
                        <p className="text-base md:text-lg text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-80">
                            EFICIÊNCIA CLÍNICA <span className="text-accent">•</span> {getDateLabel()}
                        </p>

                        {/* Date Picker Pill */}
                        <div ref={datePickerRef} className="relative">
                            <button
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setDropdownPosition({
                                        top: rect.bottom + 8,
                                        left: rect.left
                                    });
                                    setIsDatePickerOpen(!isDatePickerOpen);
                                }}
                                className={`
                                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                                    transition-all duration-300 ease-out active-click
                                    ${isToday
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                        : 'bg-accent text-accent-foreground hover:bg-accent/90'
                                    }
                                    ${isDatePickerOpen ? 'ring-2 ring-accent/30 shadow-md' : 'hover:shadow-sm'}
                                `}
                            >
                                <span className="material-symbols-outlined text-sm">calendar_month</span>
                                <span>{getDateLabel()}</span>
                                <span className={`material-symbols-outlined text-sm transition-transform duration-300 ${isDatePickerOpen ? 'rotate-180' : ''}`}>
                                    expand_more
                                </span>
                            </button>

                            {/* Expanded Date Navigator - Rendered via Portal */}
                            {ReactDOM.createPortal(
                                <div
                                    className={`
                                        fixed z-[10000]
                                        bg-card border border-border rounded-xl shadow-2xl
                                        overflow-hidden
                                        transition-all duration-300 ease-out origin-top-left
                                        ${isDatePickerOpen
                                            ? 'opacity-100 scale-100 translate-y-0'
                                            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                                        }
                                    `}
                                    style={{
                                        top: `${dropdownPosition.top}px`,
                                        left: `${dropdownPosition.left}px`
                                    }}
                                >
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
                                                const dateStr = formatDateToYYYYMMDD(date);
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
                                                            px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active-click
                                                            ${isSelected
                                                                ? 'bg-primary text-primary-foreground shadow-md'
                                                                : 'bg-secondary/50 hover:bg-secondary text-foreground'
                                                            }
                                                        `}
                                                    >
                                                        <span className="block text-[10px] opacity-70 font-mono">
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
                                </div>,
                                document.body
                            )}
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
                        className="flex-1 sm:flex-none bg-primary text-primary-foreground font-bold py-2 md:py-3 px-4 md:px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/95 transition-all shadow-sm active-click text-xs md:text-sm uppercase tracking-widest border border-white/10"
                    >
                        <span className="material-symbols-outlined text-lg md:text-xl">event</span>
                        <span className="hidden sm:inline">Agenda Semanal</span>
                        <span className="sm:hidden">Agenda</span>
                    </button>
                    <button
                        onClick={() => navigate('/patients')}
                        className="flex-1 sm:flex-none bg-white text-primary font-bold py-2 md:py-3 px-4 md:px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-secondary transition-all border border-border shadow-sm active-click text-xs md:text-sm uppercase tracking-widest"
                    >
                        <span className="material-symbols-outlined text-lg md:text-xl">group</span>
                        <span className="hidden sm:inline">Base de Pacientes</span>
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
                <div className="flex items-center gap-3 mb-6 md:mb-8 animate-sync-slide" style={{ animationDelay: '0.1s' }}>
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground font-display">
                        {isToday ? 'Fila de Atendimento' : `Agenda: ${getDateLabel()}`}
                    </h3>
                    <div className="h-px flex-1 bg-border hidden md:block"></div>
                    {!isToday && (
                        <span className="text-[10px] font-mono font-bold bg-accent text-accent-foreground px-2 py-1 rounded-full border border-white/10 uppercase">
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
                                            className="bg-card border border-border rounded-lg p-5 shadow-sm flex justify-between items-center cursor-pointer hover:border-primary hover:shadow-md transition-all group active-click border-l-[6px] border-l-primary"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-lg md:text-xl text-foreground group-hover:text-primary transition-colors truncate font-display">{app.patientName}</p>
                                                <div className="flex items-center gap-3 text-[13px] font-bold text-muted-foreground uppercase mt-2">
                                                    <span className="bg-secondary px-2 py-1 rounded-md">{app.type}</span>
                                                    <span className="opacity-50">•</span>
                                                    <span className="truncate">{app.professionalName}</span>
                                                </div>
                                            </div>
                                            <span className="text-primary font-bold font-mono text-2xl ml-6 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">{app.time}</span>
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
                                            className="bg-card border border-border rounded-lg p-5 shadow-sm flex justify-between items-center cursor-pointer hover:border-accent hover:shadow-md transition-all group active-click border-l-[6px] border-l-accent"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-lg md:text-xl text-foreground group-hover:text-accent transition-colors truncate font-display">{app.patientName}</p>
                                                <div className="flex items-center gap-3 text-[13px] font-bold text-muted-foreground uppercase mt-2">
                                                    <span className="bg-secondary px-2 py-1 rounded-md">{app.type}</span>
                                                    <span className="opacity-50">•</span>
                                                    <span className="truncate">{app.professionalName}</span>
                                                </div>
                                            </div>
                                            <span className="text-accent font-bold font-mono text-2xl ml-6 bg-accent/5 px-3 py-1.5 rounded-lg border border-accent/10">{app.time}</span>
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


                </div>
            </div>

            {/* Modal de Status */}
            {isModalOpen && selectedAppointment && (
                <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-precision-fade border border-border">
                        <div className="px-6 py-5 border-b border-border bg-muted/30">
                            <h3 className="font-bold text-lg text-foreground font-display">Gerenciar Atendimento</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="font-mono text-sm bg-primary text-primary-foreground px-2 py-0.5 rounded-full">{selectedAppointment.time}</span>
                                <span className="font-bold text-sm text-foreground truncate">{selectedAppointment.patientName}</span>
                            </div>
                        </div>
                        <div className="p-6 space-y-3">
                            <button
                                onClick={() => updateStatus('finished')}
                                className="w-full bg-accent text-accent-foreground font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all border border-accent/20 active-click uppercase text-xs tracking-widest"
                            >
                                <span className="material-symbols-outlined text-xl">check_circle</span>
                                Concluir Atendimento
                            </button>

                            <button
                                onClick={() => updateStatus('no_show')}
                                className="w-full bg-secondary text-secondary-foreground font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all border border-border active-click uppercase text-xs tracking-widest"
                            >
                                <span className="material-symbols-outlined text-xl">person_off</span>
                                Paciente Faltou
                            </button>

                            <button
                                onClick={() => updateStatus('canceled')}
                                className="w-full bg-destructive/10 text-destructive font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all border border-destructive/20 active-click uppercase text-xs tracking-widest"
                            >
                                <span className="material-symbols-outlined text-xl">cancel</span>
                                Cancelar Agendamento
                            </button>

                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-full mt-4 text-muted-foreground hover:bg-muted py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                            >
                                Voltar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
