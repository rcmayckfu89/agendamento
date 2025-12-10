
import React, { useState, useEffect } from 'react';
import { Professional, ServiceType, ShiftConfig } from '../types';
import { useApp } from '../context/AppContext';
import { availableServiceTypes } from '../constants/serviceTypes';
import { defaultShift } from '../constants/defaultShift';

const days = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
const slugs = ['seg', 'ter', 'qua', 'qui', 'sex'];


export const Settings: React.FC = () => {
    const {
        professionals, addProfessional, updateProfessional, deleteProfessional,
        blockedDays, addBlockedDay, removeBlockedDay
    } = useApp();

    // Mount/Unmount logging for debugging
    useEffect(() => {
        console.log('🟢 [Settings] Mounted');
        return () => console.log('🔴 [Settings] Unmounted');
    }, []);

    const [isProfModalOpen, setIsProfModalOpen] = useState(false);
    const [editingProfId, setEditingProfId] = useState<string | null>(null);

    // Form state initialized with empty schedule map
    const [profFormData, setProfFormData] = useState<Professional>({
        id: '', name: '', role: 'Médico', schedule: {}
    });

    // Blocked Day Form
    const [blockedDate, setBlockedDate] = useState('');
    const [blockedReason, setBlockedReason] = useState('');

    // --- Professional Handlers ---

    const handleOpenCreateProf = () => {
        // Initialize default schedule
        const emptySchedule: Record<string, ShiftConfig> = {};
        slugs.forEach(day => {
            emptySchedule[`${day}-manha`] = { ...defaultShift, start: '08:00', end: '12:00' };
            emptySchedule[`${day}-tarde`] = { ...defaultShift, start: '13:00', end: '17:00' };
        });

        setProfFormData({ id: '', name: '', role: 'Médico', schedule: emptySchedule });
        setEditingProfId(null);
        setIsProfModalOpen(true);
    };

    const handleOpenEditProf = (prof: Professional) => {
        const profCopy = JSON.parse(JSON.stringify(prof)); // Deep copy

        // Hydrate Check: Ensure all days exist
        slugs.forEach(day => {
            if (!profCopy.schedule[`${day}-manha`]) {
                profCopy.schedule[`${day}-manha`] = { ...defaultShift, start: '08:00', end: '12:00', type: 'LIVRE' };
            }
            if (!profCopy.schedule[`${day}-tarde`]) {
                profCopy.schedule[`${day}-tarde`] = { ...defaultShift, start: '13:00', end: '17:00', type: 'LIVRE' };
            }
        });

        setProfFormData(profCopy);
        setEditingProfId(prof.id);
        setIsProfModalOpen(true);
    };

    const handleSaveProfessional = (e: React.FormEvent) => {
        e.preventDefault();
        if (!profFormData.name || !profFormData.role) return;

        if (editingProfId) {
            updateProfessional({ ...profFormData, id: editingProfId });
        } else {
            addProfessional({ ...profFormData, id: Math.random().toString(36).substr(2, 9) });
        }
        setIsProfModalOpen(false);
    };

    const handleShiftChange = (key: string, field: keyof ShiftConfig, value: any) => {
        setProfFormData(prev => ({
            ...prev,
            schedule: {
                ...prev.schedule,
                [key]: {
                    ...prev.schedule[key],
                    [field]: value
                }
            }
        }));
    };

    const handleDeleteProfessional = (id: string) => {
        if (confirm('Tem certeza que deseja remover este profissional?')) {
            deleteProfessional(id);
        }
    };

    const handleAddBlockedDay = (e: React.FormEvent) => {
        e.preventDefault();
        if (!blockedDate || !blockedReason) return;

        // Prevent duplicates
        if (blockedDays.some(d => d.date === blockedDate)) {
            alert('Esta data já está bloqueada.');
            return;
        }

        addBlockedDay({
            // Let DB generate UUID
            date: blockedDate,
            reason: blockedReason
        });
        setBlockedDate('');
        setBlockedReason('');
    };

    return (
        <div className="flex flex-col h-full relative animate-slide-in-up">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Configuração</h2>
                    <p className="text-muted-foreground mt-1">Gerencie profissionais, tipos de demanda e dias de folga.</p>
                </div>
            </header>

            <div className="flex-1 space-y-8 pb-10">
                {/* Profissionais Section */}
                <section className="bg-card border border-border rounded-xl shadow-soft">
                    <div className="p-6 border-b border-border flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Equipe e Cronograma Individual</h3>
                            <p className="text-sm text-muted-foreground">Cadastre os profissionais e defina seus horários de atendimento específicos.</p>
                        </div>
                        <button onClick={handleOpenCreateProf} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors text-sm">
                            <span className="material-symbols-outlined text-base">person_add</span>
                            Adicionar Profissional
                        </button>
                    </div>
                    <div className="p-6">
                        {professionals.length === 0 ? (
                            <div className="text-center text-muted-foreground py-10">
                                <p>Nenhum profissional cadastrado</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {professionals.map(prof => (
                                    <div key={prof.id} className="border border-border rounded-lg p-4 bg-accent/10 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-foreground text-lg">{prof.name}</h4>
                                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 font-medium">{prof.role}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleOpenEditProf(prof)} className="flex items-center gap-1 px-3 py-1.5 rounded bg-white border border-border text-sm font-medium hover:bg-gray-50 transition-colors" title="Editar Cronograma">
                                                    <span className="material-symbols-outlined text-sm">edit</span> Editar
                                                </button>
                                                <button onClick={() => handleDeleteProfessional(prof.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors" title="Remover">
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Mini schedule preview */}
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mt-2 text-xs">
                                            {slugs.map((slug, idx) => {
                                                const am = prof.schedule[`${slug}-manha`];
                                                const pm = prof.schedule[`${slug}-tarde`];
                                                if (!am || !pm) return null;

                                                return (
                                                    <div key={slug} className="border border-border rounded p-2 bg-background">
                                                        <p className="font-bold text-muted-foreground mb-1 uppercase">{days[idx].split('-')[0]}</p>
                                                        <div className="flex flex-col gap-1">
                                                            {am.type !== 'LIVRE' && <span className="text-primary truncate" title={am.type}>M: {am.type}</span>}
                                                            {pm.type !== 'LIVRE' && <span className="text-secondary-foreground truncate" title={pm.type}>T: {pm.type}</span>}
                                                            {am.type === 'LIVRE' && pm.type === 'LIVRE' && <span className="text-muted-foreground/50">-</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Dias Bloqueados Section */}
                <section className="bg-card border border-border rounded-xl shadow-soft">
                    <div className="p-6 border-b border-border">
                        <h3 className="text-lg font-semibold text-foreground">Dias Bloqueados / Feriados</h3>
                        <p className="text-sm text-muted-foreground">Adicione feriados ou datas específicas onde a clínica não funcionará. O sistema impedirá agendamentos nestes dias.</p>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Form */}
                            <div className="w-full md:w-1/3 bg-muted/20 p-4 rounded-lg border border-border h-fit">
                                <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">event_busy</span>
                                    Bloquear Nova Data
                                </h4>
                                <form onSubmit={handleAddBlockedDay} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Data</label>
                                        <input
                                            required
                                            type="date"
                                            value={blockedDate}
                                            onChange={e => setBlockedDate(e.target.value)}
                                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Motivo</label>
                                        <input
                                            required
                                            type="text"
                                            value={blockedReason}
                                            onChange={e => setBlockedReason(e.target.value)}
                                            placeholder="Ex: Feriado Nacional, Reforma..."
                                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-destructive text-destructive-foreground font-semibold py-2 px-4 rounded-lg hover:bg-destructive/90 transition-colors text-sm">
                                        Bloquear Data
                                    </button>
                                </form>
                            </div>

                            {/* List */}
                            <div className="flex-1">
                                {blockedDays.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg p-8">
                                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">calendar_today</span>
                                        <p>Nenhuma data bloqueada.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {blockedDays.map(day => {
                                            const dateObj = new Date(day.date + 'T00:00:00');
                                            return (
                                                <div key={day.id} className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                                                    <div>
                                                        <p className="font-bold text-destructive">
                                                            {dateObj.toLocaleDateString('pt-BR')}
                                                        </p>
                                                        <p className="text-sm text-foreground/80">{day.reason}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeBlockedDay(day.id)}
                                                        className="p-1.5 rounded hover:bg-destructive hover:text-white text-muted-foreground transition-colors"
                                                        title="Remover bloqueio"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">close</span>
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Modal Profissional */}
            {isProfModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl shadow-xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                            <h3 className="font-bold text-lg">{editingProfId ? 'Editar Profissional e Agenda' : 'Novo Profissional e Agenda'}</h3>
                            <button onClick={() => setIsProfModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSaveProfessional} className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Nome Completo</label>
                                        <input
                                            required
                                            type="text"
                                            value={profFormData.name}
                                            onChange={(e) => setProfFormData({ ...profFormData, name: e.target.value })}
                                            className="w-full rounded-md border border-border bg-background px-3 py-2 focus:ring-2 focus:ring-primary"
                                            placeholder="Ex: Dr. João"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Cargo / Função</label>
                                        <select
                                            value={profFormData.role}
                                            onChange={(e) => setProfFormData({ ...profFormData, role: e.target.value })}
                                            className="w-full rounded-md border border-border bg-background px-3 py-2 focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="medico">Médico(a)</option>
                                            <option value="enfermeiro">Enfermeiro(a)</option>
                                            <option value="tecnico">Técnico(a)</option>
                                            <option value="recepcionista">Recepcionista</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Detailed Schedule Grid */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="material-symbols-outlined text-primary">calendar_clock</span>
                                        <h4 className="font-semibold text-foreground">Configuração da Agenda Semanal</h4>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Defina os tipos de atendimento, horários e intervalos. O sistema validará agendamentos com base nessas regras.
                                    </p>

                                    <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
                                        <table className="w-full text-left text-sm min-w-[800px]">
                                            <thead className="bg-secondary/50 text-secondary-foreground font-semibold">
                                                <tr>
                                                    <th className="p-3 w-32">Dia</th>
                                                    <th className="p-3">Manhã</th>
                                                    <th className="p-3">Tarde</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {days.map((day, idx) => {
                                                    const slug = slugs[idx];
                                                    const amKey = `${slug}-manha`;
                                                    const pmKey = `${slug}-tarde`;
                                                    const am = profFormData.schedule[amKey];
                                                    const pm = profFormData.schedule[pmKey];

                                                    // Safety Fallback: If data is missing (new user), show default structure
                                                    const safeAm = am || { type: 'LIVRE', start: '08:00', end: '12:00', interval: 30 };
                                                    const safePm = pm || { type: 'LIVRE', start: '13:00', end: '17:00', interval: 30 };

                                                    // If we are injecting defaults, we should probably update the state so saving works?
                                                    // The handleShiftChange will update nested state correctly even if it started undefined?
                                                    // No, handleShiftChange expects object structure.
                                                    // Ideally initialization should happen on Open Modal. But let's Fix render first.

                                                    // Actually, 'am' and 'pm' come from 'profFormData.schedule'.
                                                    // If 'profFormData' was initialized with clean state in 'handleOpenEditProf', this wouldn't happen.
                                                    // The issue is handleOpenEditProf does a deep copy of 'prof' which has empty schedule.

                                                    // We'll fix rendering here, but we also need to fix hydration on Edit.

                                                    // Render using safes, but inputs need to bind to something.
                                                    // Since we can't easily mutate state during render, we rely on Hydration fix in handleOpenEditProf.

                                                    // TEMPORARY VISUAL FIX:
                                                    if (!am && !pm) return null; // Still skip if really nothing? 
                                                    // NO, user wants to see it.

                                                    // BUT: The inputs bind to "am.type". If am is undefined, crash.
                                                    // So we MUST fix handleOpenEditProf.

                                                    // Let's just return null here for now and fix the SOURCE.

                                                    return (
                                                        <tr key={slug} className="hover:bg-accent/10">
                                                            <td className="p-3 font-medium border-r border-border bg-muted/20">{day}</td>
                                                            {/* Morning Column */}
                                                            <td className="p-3 border-r border-border">
                                                                <div className="flex flex-col gap-2">
                                                                    <select
                                                                        value={am.type}
                                                                        onChange={(e) => handleShiftChange(amKey, 'type', e.target.value)}
                                                                        className={`w-full text-xs rounded border-border py-1.5 font-medium ${am.type !== 'LIVRE' ? 'text-primary' : 'text-muted-foreground'}`}
                                                                    >
                                                                        {availableServiceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                                    </select>
                                                                    {am.type !== 'LIVRE' && (
                                                                        <div className="flex gap-2 items-center">
                                                                            <input type="time" value={am.start} onChange={e => handleShiftChange(amKey, 'start', e.target.value)} className="w-20 text-xs rounded border-border py-1 px-1" />
                                                                            <span>às</span>
                                                                            <input type="time" value={am.end} onChange={e => handleShiftChange(amKey, 'end', e.target.value)} className="w-20 text-xs rounded border-border py-1 px-1" />
                                                                            <select value={am.interval} onChange={e => handleShiftChange(amKey, 'interval', parseInt(e.target.value))} className="w-20 text-xs rounded border-border py-1 px-1">
                                                                                <option value={15}>15 min</option>
                                                                                <option value={20}>20 min</option>
                                                                                <option value={30}>30 min</option>
                                                                                <option value={45}>45 min</option>
                                                                                <option value={60}>60 min</option>
                                                                            </select>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            {/* Afternoon Column */}
                                                            <td className="p-3">
                                                                <div className="flex flex-col gap-2">
                                                                    <select
                                                                        value={pm.type}
                                                                        onChange={(e) => handleShiftChange(pmKey, 'type', e.target.value)}
                                                                        className={`w-full text-xs rounded border-border py-1.5 font-medium ${pm.type !== 'LIVRE' ? 'text-secondary-foreground' : 'text-muted-foreground'}`}
                                                                    >
                                                                        {availableServiceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                                    </select>
                                                                    {pm.type !== 'LIVRE' && (
                                                                        <div className="flex gap-2 items-center">
                                                                            <input type="time" value={pm.start} onChange={e => handleShiftChange(pmKey, 'start', e.target.value)} className="w-20 text-xs rounded border-border py-1 px-1" />
                                                                            <span>às</span>
                                                                            <input type="time" value={pm.end} onChange={e => handleShiftChange(pmKey, 'end', e.target.value)} className="w-20 text-xs rounded border-border py-1 px-1" />
                                                                            <select value={pm.interval} onChange={e => handleShiftChange(pmKey, 'interval', parseInt(e.target.value))} className="w-20 text-xs rounded border-border py-1 px-1">
                                                                                <option value={15}>15 min</option>
                                                                                <option value={20}>20 min</option>
                                                                                <option value={30}>30 min</option>
                                                                                <option value={45}>45 min</option>
                                                                                <option value={60}>60 min</option>
                                                                            </select>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-border bg-secondary/10 flex justify-end gap-2">
                                <button type="button" onClick={() => setIsProfModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors border border-border bg-background">Cancelar</button>
                                <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Salvar Configurações</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};