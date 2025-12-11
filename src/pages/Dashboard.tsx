
import React, { useMemo, useState, useEffect } from 'react';
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

    // State for Interaction Modal
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Calculate stats based on real data
    const stats: StatData[] = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        // Count Completed for historical stats, and Scheduled for "current load"
        const todayAppts = appointments.filter(a => a.date === today && a.status !== 'canceled');

        // Helper to count by role
        const countByRole = (role: string) => {
            return todayAppts.filter(a => {
                const prof = professionals.find(p => p.id === a.professional_id);
                return prof?.role === role;
            }).length;
        };

        // Total capacity estimation (simplistic: 10 per day per professional for demo)
        const totalDocs = professionals.filter(p => p.role === 'medico').length * 10;
        const totalNurses = professionals.filter(p => p.role === 'enfermeiro').length * 10;
        const totalTechs = professionals.filter(p => p.role === 'tecnico').length * 10;

        const currentDocs = countByRole('medico');
        const currentNurses = countByRole('enfermeiro');
        const currentTechs = countByRole('tecnico');

        // Count "Urgent" (DEMANDA ESPONTÂNEA)
        const urgentCount = todayAppts.filter(a => a.type === 'DEMANDA ESPONTÂNEA').length;

        // Note: Labels mapped from english roles to portuguese display if needed, but keeping categories as keys
        return [
            { category: 'Doctor', current: currentDocs, total: Math.max(currentDocs, totalDocs || 10), label: 'agendados hoje', icon: 'medical_services', colorClass: 'violet', ringColorClass: 'text-violet-500' },
            { category: 'Nurse', current: currentNurses, total: Math.max(currentNurses, totalNurses || 10), label: 'agendados hoje', icon: 'health_and_safety', colorClass: 'green', ringColorClass: 'text-green-500' },
            { category: 'Technician', current: currentTechs, total: Math.max(currentTechs, totalTechs || 10), label: 'agendados hoje', icon: 'biotech', colorClass: 'sky', ringColorClass: 'text-sky-500' },
            { category: 'Urgent', current: urgentCount, total: 10, label: 'demandas espontâneas', icon: 'priority_high', colorClass: 'destructive', ringColorClass: '' },
        ];
    }, [appointments, professionals]);

    // Get next appointments for display
    // CORREÇÃO: Removemos o filtro de hora (a.time >= now) para que agendamentos atrasados ainda apareçam na lista até serem resolvidos.
    const nextAppointments = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];

        return appointments
            .filter(a => a.date === today && a.status === 'scheduled')
            .sort((a, b) => a.time.localeCompare(b.time));
    }, [appointments]);

    const getNextForRole = (role: string) => {
        return nextAppointments.filter(a => {
            const prof = professionals.find(p => p.id === a.professional_id);
            // Verify exact role string from DB ('medico', 'enfermeiro', 'tecnico') vs UI display
            // UI Cards use 'Doctor', 'Nurse', 'Technician' categories, but here we pass 'Médico' etc?
            // Let's check how it's called.
            // It is called with 'Médico', 'Enfermeira', 'Técnica'.
            // But DB roles are 'medico', 'enfermeiro', 'tecnico'.
            // Mapping needed.
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

    return (
        <div className="flex flex-col h-full relative">
            {/* Header - responsive */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-10">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Visão Geral</h2>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">Resumo dos seus atendimentos para hoje.</p>
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
                <h3 className="text-lg md:text-2xl font-bold mb-4 md:mb-6 tracking-tight text-foreground">Próximos Atendimentos</h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 -mt-2 md:-mt-4">Toque para alterar o status.</p>

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
                                        Agenda livre para Médicos hoje.
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
                                        Agenda livre para Enfermeiras hoje.
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
                                        Agenda livre para Técnicas hoje.
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
