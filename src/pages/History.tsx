import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { HistoryItem, AppointmentStatus } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { getTodayLocalStr } from '../utils/dateUtils';

export const History: React.FC = () => {
    const { appointments, professionals, updateAppointment } = useApp();

    // State for edit status modal
    const [editingItem, setEditingItem] = useState<HistoryItem | null>(null);

    // Mount/Unmount logging for debugging
    useEffect(() => {
        console.log('🟢 [History] Mounted');
        return () => console.log('🔴 [History] Unmounted');
    }, []);

    // Convert appointments to History Items dynamically - MEMOIZED to avoid re-render loops
    const historyData: HistoryItem[] = useMemo(() => {
        const filtered = appointments
            .filter(a => ['finished', 'canceled', 'no_show', 'auto_closed'].includes(a.status as string))
            .map(a => ({
                id: a.id,
                date: a.date ? a.date.split('T')[0] : '', // Robust date format handling
                time: a.time,
                period: parseInt(a.time.split(':')[0]) < 12 ? 'AM' : 'PM',
                patientName: a.patientName || 'Paciente Desconhecido',
                description: `${a.type} com ${a.professionalName}`,
                status: a.status as 'finished' | 'canceled' | 'no_show',
                professional: a.professionalName || 'Profissional'
            }))
            .sort((a, b) => {
                // Sort by Date DESC, then Time DESC
                const dateCompare = b.date.localeCompare(a.date);
                if (dateCompare !== 0) return dateCompare;
                return b.time.localeCompare(a.time);
            });

        console.log('📊 [History] Total de agendamentos:', appointments.length);
        console.log('📊 [History] Histórico filtrado:', filtered.length, 'itens');

        return filtered;
    },
        [appointments]
    );

    const [filters, setFilters] = useState({
        date: getTodayLocalStr(), // Default to Today as requested ("Histórico do Dia")
        professional: 'Todos',
        search: '',
        status: '',
        type: ''
    });

    const [filteredData, setFilteredData] = useState<HistoryItem[]>([]);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // Debounce search to avoid excessive filtering
    const debouncedSearch = useDebounce(filters.search, 300);

    // Filter Logic - Now with debounced search and stable dependencies
    useEffect(() => {
        const result = historyData.filter(item => {
            // Se filters.date estiver vazio, mostra TODAS as datas
            const matchDate = filters.date === '' || item.date === filters.date;

            const matchProfessional = filters.professional === 'Todos' || item.professional === filters.professional;
            const matchSearch = debouncedSearch === '' || item.patientName.toLowerCase().includes(debouncedSearch.toLowerCase());
            const matchStatus = filters.status === '' || item.status === filters.status;
            const matchType = filters.type === '' || item.description.toLowerCase().includes(filters.type.toLowerCase());

            return matchDate && matchProfessional && matchSearch && matchStatus && matchType;
        });

        setFilteredData(result);
    }, [filters.date, filters.professional, debouncedSearch, filters.status, filters.type, historyData]);

    const handleFilterChange = useCallback((key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleDeleteRequest = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setItemToDelete(id);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            setFilteredData(prev => prev.filter(item => item.id !== itemToDelete));
            setItemToDelete(null);
        }
    };

    const cancelDelete = () => {
        setItemToDelete(null);
    };

    return (
        <div className="flex flex-col h-full relative animate-slide-in-up px-4 md:px-0">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-10 pt-4 md:pt-0">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Histórico do Dia</h2>
                    <p className="text-muted-foreground mt-1 text-xs md:text-sm font-medium italic md:not-italic">Acompanhe os atendimentos e baixas realizadas hoje.</p>
                </div>
            </header>

            <div className="bg-card p-4 md:p-6 rounded-2xl border border-border shadow-soft mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                    <div className="sm:col-span-2 md:col-span-1">
                        <label htmlFor="date-filter" className="block text-[10px] md:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Data</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xl">calendar_month</span>
                            <input
                                type="date"
                                id="date-filter"
                                value={filters.date}
                                onChange={(e) => handleFilterChange('date', e.target.value)}
                                className="w-full pl-10 pr-3 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium"
                            />
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 ml-1">
                            {filters.date === '' && (
                                <p className="text-[10px] text-muted-foreground italic font-medium">📅 Todos os registros</p>
                            )}
                            {filters.date === getTodayLocalStr() && (
                                <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-widest bg-teal-50 dark:bg-teal-900/20 px-2 py-0.5 rounded-md">✨ Hoje</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="professional-filter" className="block text-[10px] md:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Profissional</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xl">medical_services</span>
                            <select
                                id="professional-filter"
                                value={filters.professional}
                                onChange={(e) => handleFilterChange('professional', e.target.value)}
                                className="w-full pl-10 pr-3 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none text-sm font-medium"
                            >
                                <option>Todos</option>
                                {professionals.map(p => (
                                    <option key={p.id} value={p.name || p.email || p.id}>
                                        {p.name || p.email}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                                <span className="material-symbols-outlined text-muted-foreground">expand_more</span>
                            </div>
                        </div>
                    </div>

                    <div className="sm:col-span-2 md:col-span-1">
                        <label htmlFor="patient-filter" className="block text-[10px] md:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Paciente</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xl">search</span>
                            <input
                                type="text"
                                id="patient-filter"
                                placeholder="Buscar paciente..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full pl-10 pr-3 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="status-filter" className="block text-[10px] md:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Status</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xl">task_alt</span>
                            <select
                                id="status-filter"
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none text-sm font-medium"
                            >
                                <option value="">Todos</option>
                                <option value="finished">Concluído</option>
                                <option value="no_show">Faltou</option>
                                <option value="canceled">Cancelado</option>
                                <option value="auto_closed">Auto-Encerrado</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                                <span className="material-symbols-outlined text-muted-foreground">expand_more</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="type-filter" className="block text-[10px] md:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Tipo</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xl">category</span>
                            <select
                                id="type-filter"
                                value={filters.type}
                                onChange={(e) => handleFilterChange('type', e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none text-sm font-medium"
                            >
                                <option value="">Todos</option>
                                <option value="Consulta">Consulta</option>
                                <option value="Exame">Exame</option>
                                <option value="Procedimento">Procedimento</option>
                                <option value="HIPERDIA">Hiperdia</option>
                                <option value="PRÉ-NATAL">Pré-Natal</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                                <span className="material-symbols-outlined text-muted-foreground">expand_more</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:gap-4 pb-20">
                {filteredData.length === 0 ? (
                    <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
                        <span className="material-symbols-outlined text-5xl text-muted-foreground mb-3 opacity-20">history_toggle_off</span>
                        <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Nenhum registro encontrado</p>
                    </div>
                ) : (
                    filteredData.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setEditingItem(item)}
                            className="bg-card p-4 md:p-5 rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary transition-all duration-300 group cursor-pointer mb-3 md:mb-0"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    {/* Date & Time Badge - Desktop: Row, Mobile: Compact Badge */}
                                    <div className="flex md:flex-row items-center gap-3">
                                        <div className="flex flex-col items-center justify-center w-12 md:w-16 h-12 md:h-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl md:border-r md:border-border md:pr-4 md:bg-transparent md:rounded-none">
                                            <p className="text-[10px] font-black text-primary uppercase leading-tight">{new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</p>
                                            <p className="text-base md:text-xl font-black text-foreground leading-none">{item.date.split('-')[2]}</p>
                                        </div>

                                        <div className="flex flex-col items-center justify-center w-px h-8 bg-border hidden md:block"></div>

                                        <div className="flex flex-col items-start md:items-center justify-center min-w-[60px]">
                                            <p className="text-lg md:text-2xl font-black text-foreground leading-tight">{item.time}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{item.period}</p>
                                        </div>
                                    </div>

                                    <div className="h-10 w-px bg-border mx-1 md:mx-4"></div>

                                    {/* Patient Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-base md:text-xl text-foreground truncate group-hover:text-primary transition-colors">{item.patientName}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-xs text-muted-foreground font-medium truncate">{item.description}</p>
                                        </div>
                                        <p className="text-[10px] md:text-xs text-primary font-bold uppercase tracking-widest mt-1 opacity-70">{item.professional}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-3 md:gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-border/50">
                                    {item.status === 'finished' ? (
                                        <div className="flex items-center gap-2 text-[10px] md:text-sm text-green-600 bg-green-100/60 px-3 md:px-4 py-1.5 md:py-2 rounded-full font-black uppercase tracking-wider">
                                            <span className="material-symbols-outlined text-base md:text-lg">check_circle</span>
                                            Concluído
                                        </div>
                                    ) : item.status === 'canceled' ? (
                                        <div className="flex items-center gap-2 text-[10px] md:text-sm text-red-600 bg-red-100/60 px-3 md:px-4 py-1.5 md:py-2 rounded-full font-black uppercase tracking-wider">
                                            <span className="material-symbols-outlined text-base md:text-lg">cancel</span>
                                            Cancelado
                                        </div>
                                    ) : item.status === 'auto_closed' ? (
                                        <div className="flex flex-col items-end gap-0.5">
                                            <div className="flex items-center gap-2 text-[10px] md:text-sm text-blue-600 bg-blue-100/60 px-3 md:px-4 py-1.5 md:py-2 rounded-full font-black uppercase tracking-wider">
                                                <span className="material-symbols-outlined text-base md:text-lg">smart_toy</span>
                                                SISTEMA
                                            </div>
                                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter opacity-70 pr-2">
                                                {(() => {
                                                    const appDate = new Date(item.date + 'T00:00:00');
                                                    const closedDate = new Date(appDate);
                                                    closedDate.setDate(closedDate.getDate() + 1);
                                                    return `${closedDate.toLocaleDateString('pt-BR')} 00:01`;
                                                })()}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-[10px] md:text-sm text-orange-600 bg-orange-100/60 px-3 md:px-4 py-1.5 md:py-2 rounded-full font-black uppercase tracking-wider">
                                            <span className="material-symbols-outlined text-base md:text-lg">person_off</span>
                                            Faltou
                                        </div>
                                    )}

                                    <button
                                        onClick={(e) => handleDeleteRequest(item.id, e)}
                                        className="h-9 w-9 md:h-10 md:w-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                                        title="Excluir registro"
                                    >
                                        <span className="material-symbols-outlined text-xl md:text-2xl">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Confirmation Dialog */}
            {itemToDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-destructive/5">
                            <h3 className="font-bold text-lg text-destructive flex items-center gap-2">
                                <span className="material-symbols-outlined">warning</span>
                                Confirmar Exclusão
                            </h3>
                            <button onClick={cancelDelete} className="text-muted-foreground hover:text-foreground">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-foreground mb-6">
                                Tem certeza que deseja excluir este registro do histórico? Esta ação não pode ser desfeita.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={cancelDelete}
                                    className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors shadow-sm"
                                >
                                    Excluir Registro
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Status Modal */}
            {editingItem && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-border bg-muted/20">
                            <h3 className="font-bold text-lg text-foreground">Alterar Status</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {editingItem.time} - {editingItem.patientName}
                            </p>
                        </div>
                        <div className="p-6 space-y-3">
                            <button
                                onClick={async () => {
                                    const originalAppt = appointments.find(a => a.id === editingItem.id);
                                    if (originalAppt) {
                                        await updateAppointment({ ...originalAppt, status: 'finished' });
                                    }
                                    setEditingItem(null);
                                }}
                                disabled={editingItem.status === 'finished'}
                                className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border ${editingItem.status === 'finished' ? 'bg-green-200 border-green-400 text-green-800 cursor-default' : 'bg-green-100 hover:bg-green-200 text-green-800 border-green-200'} font-semibold`}
                            >
                                <span className="material-symbols-outlined">check_circle</span>
                                Finalizado
                                {editingItem.status === 'finished' && <span className="text-xs">(atual)</span>}
                            </button>

                            <button
                                onClick={async () => {
                                    const originalAppt = appointments.find(a => a.id === editingItem.id);
                                    if (originalAppt) {
                                        await updateAppointment({ ...originalAppt, status: 'no_show' });
                                    }
                                    setEditingItem(null);
                                }}
                                disabled={editingItem.status === 'no_show'}
                                className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border ${editingItem.status === 'no_show' ? 'bg-orange-200 border-orange-400 text-orange-800 cursor-default' : 'bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-200'} font-semibold`}
                            >
                                <span className="material-symbols-outlined">person_off</span>
                                Paciente Faltou
                                {editingItem.status === 'no_show' && <span className="text-xs">(atual)</span>}
                            </button>

                            <button
                                onClick={async () => {
                                    const originalAppt = appointments.find(a => a.id === editingItem.id);
                                    if (originalAppt) {
                                        await updateAppointment({ ...originalAppt, status: 'canceled' });
                                    }
                                    setEditingItem(null);
                                }}
                                disabled={editingItem.status === 'canceled'}
                                className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border ${editingItem.status === 'canceled' ? 'bg-red-200 border-red-400 text-red-800 cursor-default' : 'bg-red-100 hover:bg-red-200 text-red-800 border-red-200'} font-semibold`}
                            >
                                <span className="material-symbols-outlined">cancel</span>
                                Cancelado
                                {editingItem.status === 'canceled' && <span className="text-xs">(atual)</span>}
                            </button>

                            <button
                                onClick={() => setEditingItem(null)}
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
