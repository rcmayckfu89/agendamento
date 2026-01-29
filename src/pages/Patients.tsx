
import React, { useState, useEffect, useMemo } from 'react';
import { Patient } from '../types';
import { useApp } from '../context/AppContext';
import { healthConditionsList } from '../constants/healthConditions';
import { useDebounce } from '../hooks/useDebounce';

export const Patients: React.FC = () => {
    const { patients, addPatient, updatePatient, deletePatient, isLoading, error } = useApp();
    const [searchTerm, setSearchTerm] = useState('');

    // Mount/Unmount logging for debugging
    useEffect(() => {
        console.log('🟢 [Patients] Mounted');
        return () => console.log('🔴 [Patients] Unmounted');
    }, []);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        healthAgent: '',
        birthDate: '',
        guardianName: '',
        phone: '',
        cpfOrCns: '',
        comorbidities: [] as string[]
    });

    // Debounce search for better performance
    const debouncedSearch = useDebounce(searchTerm, 300);

    // Memoize filtered patients to avoid re-calculating on every render
    const filteredPatients = useMemo(() =>
        patients.filter(patient =>
            (patient.name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            (patient.email || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            (patient.phone || '').includes(debouncedSearch) ||
            (patient.cpfOrCns || '').includes(debouncedSearch)
        ),
        [patients, debouncedSearch]
    );

    const getAvatarStyle = (color: string) => {
        const styles: Record<string, string> = {
            'primary': 'bg-primary/10 text-primary',
            'violet': 'bg-violet-100 text-violet-600',
            'green': 'bg-green-100 text-green-600',
            'sky': 'bg-sky-100 text-sky-600',
            'amber': 'bg-amber-100 text-amber-600'
        };
        return styles[color || 'primary'] || styles['primary'];
    };

    // Actions
    // ... (handlers omitted for brevity, they remain same) ...
    // BUT we need to show loading/error in the UI

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full animate-fade-in">
                <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-primary animate-spin text-4xl">
                        progress_activity
                    </span>
                    <p className="text-muted-foreground">Carregando pacientes...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full animate-fade-in">
                <div className="bg-destructive/10 text-destructive p-6 rounded-xl flex flex-col items-center gap-4 max-w-md text-center">
                    <span className="material-symbols-outlined text-4xl">error</span>
                    <div>
                        <h3 className="font-bold text-lg mb-1">Erro ao carregar dados</h3>
                        <p className="text-sm opacity-90">{error}</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-medium hover:bg-destructive/90 transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    // Actions re-declarations for clean replacement context if needed, 
    // but better to just inject the checks before the main return or just update the main return body.
    // The previous tool call view showed render starting at 136.
    // So let's replace the top part properly.

    const handleOpenCreate = () => {
        setFormData({ name: '', healthAgent: '', birthDate: '', guardianName: '', phone: '', cpfOrCns: '', comorbidities: [] });
        setCurrentPatientId(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (patient: Patient) => {
        setFormData({
            name: patient.name,
            healthAgent: patient.health_agent || '',
            birthDate: patient.birth_date || '',
            guardianName: patient.guardian_name || '',
            phone: patient.phone || '',
            cpfOrCns: patient.cpfOrCns || '',
            comorbidities: patient.comorbidities || []
        });
        setCurrentPatientId(patient.id);
        setIsModalOpen(true);
    };

    const handleOpenDelete = (id: string) => {
        setCurrentPatientId(id);
        setIsDeleteModalOpen(true);
    };

    const handleToggleComorbidity = (condition: string) => {
        setFormData(prev => {
            const exists = prev.comorbidities.includes(condition);
            if (exists) {
                return { ...prev, comorbidities: prev.comorbidities.filter(c => c !== condition) };
            } else {
                return { ...prev, comorbidities: [...prev.comorbidities, condition] };
            }
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const initials = formData.name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

        const colors = ['primary', 'violet', 'green', 'sky', 'amber'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        // Removed unused 'today'

        if (currentPatientId) {
            // Edit
            const existing = patients.find(p => p.id === currentPatientId);
            if (existing) {
                await updatePatient({
                    ...existing,
                    name: formData.name,
                    health_agent: formData.healthAgent,
                    birth_date: formData.birthDate,
                    guardian_name: formData.guardianName,
                    phone: formData.phone,
                    cpfOrCns: formData.cpfOrCns,
                    comorbidities: formData.comorbidities,
                    initials: initials
                });
            }
        } else {
            // Create
            const newPatient: Partial<Patient> = {
                initials: initials,
                name: formData.name,
                health_agent: formData.healthAgent,
                birth_date: formData.birthDate,
                guardian_name: formData.guardianName,
                phone: formData.phone,
                nextAppointment: '-',
                color: randomColor,
                cpfOrCns: formData.cpfOrCns,
                comorbidities: formData.comorbidities
            };
            await addPatient(newPatient);
        }
        setIsModalOpen(false);
    };

    const handleDelete = async () => {
        if (currentPatientId) {
            await deletePatient(currentPatientId);
            setIsDeleteModalOpen(false);
            setCurrentPatientId(null);
        }
    };

    return (
        <div className="flex flex-col h-full relative animate-precision-fade">
            {/* Header - heroic typographic style */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-8 md:mb-12">
                <div>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-foreground font-display">Base de Pacientes</h2>
                    <p className="text-sm font-bold text-muted-foreground mt-1 hidden sm:block uppercase tracking-widest opacity-60">Gestão de Prontuários e Programas</p>
                </div>
                <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
                    <button
                        onClick={handleOpenCreate}
                        className="flex-1 sm:flex-none bg-primary text-primary-foreground font-bold py-2.5 md:py-3 px-5 md:px-7 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/95 transition-all shadow-md text-xs md:text-sm uppercase tracking-widest active-click border border-white/10"
                    >
                        <span className="material-symbols-outlined">person_add</span>
                        Cadastrar Paciente
                    </button>
                </div>
            </header>

            {/* Search Bar - precise styling */}
            <div className="mb-6 md:mb-8">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-4">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">search</span>
                        <input
                            type="text"
                            placeholder="LOCALIZAR POR NOME, CPF OU CONTATO..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 md:pl-12 pr-4 py-3 bg-card border border-border rounded-lg shadow-sm focus:border-accent focus:outline-none transition-all text-xs font-bold uppercase tracking-wider placeholder:text-muted-foreground/50 font-display"
                        />
                    </div>
                </div>
            </div>

            {/* Desktop Table View - precise clinical grid */}
            <div className="hidden md:block bg-card border border-border rounded-xl shadow-sm flex-1 overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="bg-muted/30 sticky top-0 z-10 border-b border-border">
                        <tr>
                            <th className="p-4 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Identificação do Paciente</th>
                            <th className="p-4 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Documentação / Contato</th>
                            <th className="p-4 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Condições / Programas</th>
                            <th className="p-4 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Última Escala</th>
                            <th className="p-4 font-bold text-[10px] text-muted-foreground uppercase tracking-widest text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredPatients.length > 0 ? (
                            filteredPatients.map((patient) => (
                                <tr key={patient.id} className="hover:bg-accent transition-colors">
                                    <td className="p-5 flex items-center gap-5">
                                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold shrink-0 text-sm border border-white/20 ${getAvatarStyle(patient.color || 'primary')}`}>
                                            <span>{patient.initials || '?'}</span>
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground font-display uppercase tracking-tight text-base leading-tight">{patient.name}</div>
                                            <div className="text-[12px] font-bold text-muted-foreground uppercase tracking-[0.05em] opacity-70 mt-1">{patient.health_agent ? `Equipe ACS: ${patient.health_agent}` : 'EQUIPE NÃO DEFINIDA'}</div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="text-[14px] font-bold text-foreground font-mono leading-tight">D: {patient.cpfOrCns}</div>
                                        <div className="text-[13px] font-bold text-muted-foreground font-mono opacity-80 mt-1">{patient.phone}</div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                                            {(patient.comorbidities || []).length > 0 ? (
                                                <>
                                                    {(patient.comorbidities || []).slice(0, 2).map((c, i) => (
                                                        <span key={i} className={`inline-flex items-center px-2 py-1 rounded-full uppercase tracking-tight ${c.includes('HIPERDIA') ? 'bg-orange-600 text-white' : c.includes('PRÉ-NATAL') ? 'bg-pink-600 text-white' : 'bg-primary text-primary-foreground'}`}>
                                                            {c}
                                                        </span>
                                                    ))}
                                                    {(patient.comorbidities || []).length > 2 && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-muted text-muted-foreground uppercase">
                                                            +{(patient.comorbidities || []).length - 2}
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-[11px] text-muted-foreground font-bold uppercase opacity-30 tracking-[0.15em] text-center block w-full">SEM DADOS</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-5 text-[13px] font-bold text-muted-foreground font-mono">{patient.nextAppointment || '—'}</td>
                                    <td className="p-4 text-right whitespace-nowrap">
                                        <button onClick={() => handleOpenEdit(patient)} className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors mr-1" title="Editar">
                                            <span className="material-symbols-outlined">edit</span>
                                        </button>
                                        <button onClick={() => handleOpenDelete(patient.id)} className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Excluir">
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                    Nenhum paciente encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View - shown only on mobile */}
            <div className="md:hidden flex-1 overflow-y-auto space-y-3">
                {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                        <div key={patient.id} className="bg-card border border-border rounded-xl p-4 shadow-sm animate-sync-slide active-click">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 text-xs border border-white/10 ${getAvatarStyle(patient.color || 'primary')}`}>
                                        <span>{patient.initials || '?'}</span>
                                    </div>
                                    <div>
                                        <div className="font-bold text-foreground font-display uppercase tracking-tight">{patient.name}</div>
                                        <div className="text-[10px] font-bold text-muted-foreground font-mono">{patient.phone || 'CONTATO INDEFINIDO'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleOpenEdit(patient)}
                                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-all"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit_note</span>
                                    </button>
                                    <button
                                        onClick={() => handleOpenDelete(patient.id)}
                                        className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-all"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete_sweep</span>
                                    </button>
                                </div>
                            </div>
                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {(patient.comorbidities || []).slice(0, 3).map((c, i) => (
                                    <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight ${c.includes('HIPERDIA') ? 'bg-orange-600 text-white' : c.includes('PRÉ-NATAL') ? 'bg-pink-600 text-white' : 'bg-primary text-primary-foreground'}`}>
                                        {c}
                                    </span>
                                ))}
                            </div>
                            <div className="text-[10px] font-bold text-muted-foreground mt-3 flex items-center gap-2 uppercase opacity-60">
                                <span className="font-mono">DOC: {patient.cpfOrCns || 'N/A'}</span>
                                {patient.health_agent && <span className="font-display"> • ACS: {patient.health_agent}</span>}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        Nenhum paciente encontrado.
                    </div>
                )}
            </div>

            {/* Modal de Cadastro/Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-precision-fade max-h-[90vh] flex flex-col border border-border">
                        <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-muted/30">
                            <h3 className="font-bold text-lg font-display uppercase tracking-tight text-foreground">{currentPatientId ? 'Atualizar Prontuário' : 'Novo Registro Clínico'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground active-click transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Identificação Completa</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full rounded-lg border border-border bg-background px-4 py-3 focus:border-accent outline-none text-sm font-bold uppercase font-display placeholder:text-muted-foreground/30 transition-all"
                                        placeholder="NOME COMPLETO DO PACIENTE"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Documentação (CPF/CNS)</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.cpfOrCns}
                                        onChange={e => setFormData({ ...formData, cpfOrCns: e.target.value })}
                                        className="w-full rounded-lg border border-border bg-background px-4 py-3 focus:border-accent outline-none text-sm font-bold font-mono placeholder:text-muted-foreground/30 transition-all"
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Contato Telefônico</label>
                                    <input
                                        required
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full rounded-lg border border-border bg-background px-4 py-3 focus:border-accent outline-none text-sm font-bold font-mono placeholder:text-muted-foreground/30 transition-all"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Agente Comunitário de Saúde (Equipe)</label>
                                    <input
                                        type="text"
                                        value={formData.healthAgent}
                                        onChange={e => setFormData({ ...formData, healthAgent: e.target.value })}
                                        className="w-full rounded-lg border border-border bg-background px-4 py-3 focus:border-accent outline-none text-sm font-bold uppercase font-display placeholder:text-muted-foreground/30 transition-all"
                                        placeholder="IDENTIFICAÇÃO DA EQUIPE OU ACS"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Data de Nascimento</label>
                                    <input
                                        type="date"
                                        value={formData.birthDate}
                                        onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                        className="w-full rounded-lg border border-border bg-background px-4 py-3 focus:border-accent outline-none text-sm font-bold font-display transition-all"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Responsável Legal</label>
                                    <input
                                        type="text"
                                        value={formData.guardianName}
                                        onChange={e => setFormData({ ...formData, guardianName: e.target.value })}
                                        className="w-full rounded-lg border border-border bg-background px-4 py-3 focus:border-accent outline-none text-sm font-bold uppercase font-display placeholder:text-muted-foreground/30 transition-all"
                                        placeholder="NOME DO RESPONSÁVEL"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">Linhas de Cuidado e Condições Clínicas</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {healthConditionsList.map(condition => (
                                        <label key={condition} className="flex items-center space-x-3 cursor-pointer p-3 border border-border rounded-lg hover:bg-muted/50 transition-all active-click">
                                            <input
                                                type="checkbox"
                                                checked={formData.comorbidities.includes(condition)}
                                                onChange={() => handleToggleComorbidity(condition)}
                                                className="w-4 h-4 rounded-full border-border text-accent focus:ring-accent accent-accent"
                                            />
                                            <span className="text-[10px] font-bold uppercase tracking-tight text-foreground">{condition}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </form>
                        <div className="px-6 py-5 border-t border-border bg-muted/30 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all active-click">Descartar</button>
                            <button type="button" onClick={handleSave} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/95 transition-all shadow-md active-click border border-white/10">Sincronizar Dados</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Exclusão */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-precision-fade border border-border">
                        <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-destructive/10">
                            <h3 className="font-bold text-lg text-destructive flex items-center gap-2 font-display uppercase tracking-tight">
                                <span className="material-symbols-outlined">warning</span>
                                Eliminar Registro
                            </h3>
                        </div>
                        <div className="p-6">
                            <p className="text-foreground mb-8 text-sm font-medium leading-relaxed uppercase tracking-tight opacity-80">
                                Confirmar a remoção permanente deste prontuário? Esta ação é irreversível na base de dados.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all active-click"
                                >
                                    Manter Registro
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-5 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-destructive/90 transition-all shadow-md active-click border border-white/10"
                                >
                                    Confirmar Exclusão
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
