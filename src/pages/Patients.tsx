
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
        <div className="flex flex-col h-full relative animate-slide-in-up">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Pacientes</h2>
                    <p className="text-muted-foreground mt-1">Gerencie as informações dos seus pacientes.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleOpenCreate}
                        className="bg-primary text-primary-foreground font-semibold py-2.5 px-5 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-soft"
                    >
                        <span className="material-symbols-outlined">person_add</span>
                        Novo Paciente
                    </button>
                </div>
            </header>

            <div className="mb-6">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">search</span>
                        <input
                            type="text"
                            placeholder="Pesquisar por nome, CPF/CNS ou contato..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg shadow-soft focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
                        />
                    </div>
                    <button className="bg-card text-secondary-foreground font-medium py-3 px-5 rounded-lg flex items-center gap-2 hover:bg-secondary transition-colors border border-border shadow-soft">
                        <span className="material-symbols-outlined">filter_list</span>
                        Filtros
                    </button>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-soft-lg flex-1 overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="bg-secondary/50 sticky top-0 z-10">
                        <tr>
                            <th className="p-4 font-semibold text-secondary-foreground">Nome do Paciente</th>
                            <th className="p-4 font-semibold text-secondary-foreground">Documento / Contato</th>
                            <th className="p-4 font-semibold text-secondary-foreground">Comorbidades / Programas</th>
                            <th className="p-4 font-semibold text-secondary-foreground">Próxima Consulta</th>
                            <th className="p-4 font-semibold text-secondary-foreground text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredPatients.length > 0 ? (
                            filteredPatients.map((patient) => (
                                <tr key={patient.id} className="hover:bg-accent transition-colors">
                                    <td className="p-4 flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${getAvatarStyle(patient.color || 'primary')}`}>
                                            <span>{patient.initials || '?'}</span>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-foreground">{patient.name}</div>
                                            <div className="text-sm text-muted-foreground">{patient.health_agent ? `ACS: ${patient.health_agent}` : 'Sem ACS'}</div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm font-medium text-foreground">Doc: {patient.cpfOrCns}</div>
                                        <div className="text-sm text-muted-foreground">{patient.phone}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {(patient.comorbidities || []).length > 0 ? (
                                                <>
                                                    {(patient.comorbidities || []).slice(0, 2).map((c, i) => (
                                                        <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.includes('HIPERDIA') ? 'bg-orange-100 text-orange-800' : c.includes('PRÉ-NATAL') ? 'bg-pink-100 text-pink-800' : 'bg-secondary text-secondary-foreground'}`}>
                                                            {c}
                                                        </span>
                                                    ))}
                                                    {(patient.comorbidities || []).length > 2 && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                                                            +{(patient.comorbidities || []).length - 2}
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">Nenhuma registrada</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground">{patient.nextAppointment || '-'}</td>
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

            {/* Modal de Cadastro/Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                            <h3 className="font-bold text-lg">{currentPatientId ? 'Editar Paciente' : 'Novo Paciente'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Nome Completo</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 focus:ring-2 focus:ring-primary"
                                        placeholder="Ex: João da Silva"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">CPF ou CNS</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.cpfOrCns}
                                        onChange={e => setFormData({ ...formData, cpfOrCns: e.target.value })}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 focus:ring-2 focus:ring-primary"
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Telefone</label>
                                    <input
                                        required
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 focus:ring-2 focus:ring-primary"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Agente de Saúde</label>
                                    <input
                                        type="text"
                                        value={formData.healthAgent}
                                        onChange={e => setFormData({ ...formData, healthAgent: e.target.value })}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 focus:ring-2 focus:ring-primary"
                                        placeholder="Nome do ACS"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-medium mb-1">Data de Nascimento</label>
                                    <input
                                        type="date"
                                        value={formData.birthDate}
                                        onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-medium mb-1">Nome do Responsável</label>
                                    <input
                                        type="text"
                                        value={formData.guardianName}
                                        onChange={e => setFormData({ ...formData, guardianName: e.target.value })}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 focus:ring-2 focus:ring-primary"
                                        placeholder="Mãe, Pai ou Responsável"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-3">Condições de Saúde e Programas</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {healthConditionsList.map(condition => (
                                        <label key={condition} className="flex items-center space-x-2 cursor-pointer p-2 border border-border rounded-lg hover:bg-accent transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.comorbidities.includes(condition)}
                                                onChange={() => handleToggleComorbidity(condition)}
                                                className="rounded text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm">{condition}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </form>
                        <div className="px-6 py-4 border-t border-border bg-secondary/20 flex justify-end gap-2">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors border border-border bg-card">Cancelar</button>
                            <button type="button" onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Salvar Paciente</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Exclusão */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-destructive/5">
                            <h3 className="font-bold text-lg text-destructive flex items-center gap-2">
                                <span className="material-symbols-outlined">warning</span>
                                Excluir Paciente
                            </h3>
                        </div>
                        <div className="p-6">
                            <p className="text-foreground mb-6">
                                Tem certeza que deseja remover este paciente? Todos os dados serão perdidos.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors shadow-sm"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
