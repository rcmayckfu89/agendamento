
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Medication, Patient } from '../types';
import { medicationService } from '../services/medicationService';
import { patientService } from '../services/patientService';
import { useDebounce } from '../hooks/useDebounce';

export const Medications: React.FC = () => {
    const [medications, setMedications] = useState<Medication[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Mount/Unmount logging for debugging
    useEffect(() => {
        console.log('🟢 [Medications] Mounted');
        return () => console.log('🔴 [Medications] Unmounted');
    }, []);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [currentMedicationId, setCurrentMedicationId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        patient_id: '',
        name: '',
        prescription_date: '',
        duration_days: 30,
        priority: 'Baixa' as 'Baixa' | 'Média' | 'Urgente',
        notes: ''
    });

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                setIsLoading(true);
                const [medsData, patientsData] = await Promise.all([
                    medicationService.getAll(),
                    patientService.getAll()
                ]);

                // Only update state if component is still mounted
                if (isMounted) {
                    setMedications(medsData);
                    setPatients(patientsData);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadData();

        // Cleanup: prevent state updates on unmounted component
        return () => {
            isMounted = false;
        };
    }, []);

    // Debounce search for performance
    const debouncedSearch = useDebounce(searchTerm, 300);

    // Memoize filtered medications
    const filteredMedications = useMemo(() =>
        medications.filter(med =>
            (med.patientName || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            (med.name || '').toLowerCase().includes(debouncedSearch.toLowerCase())
        ),
        [medications, debouncedSearch]
    );

    // Memoize reload function
    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [medsData, patientsData] = await Promise.all([
                medicationService.getAll(),
                patientService.getAll()
            ]);
            setMedications(medsData);
            setPatients(patientsData);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleOpenCreate = () => {
        setFormData({
            patient_id: '',
            name: '',
            prescription_date: '',
            duration_days: 30,
            priority: 'Baixa',
            notes: ''
        });
        setCurrentMedicationId(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (medication: Medication) => {
        setFormData({
            patient_id: medication.patient_id,
            name: medication.name,
            prescription_date: medication.prescription_date,
            duration_days: medication.duration_days,
            priority: medication.priority as 'Baixa' | 'Média' | 'Urgente',
            notes: medication.notes || ''
        });
        setCurrentMedicationId(medication.id);
        setIsModalOpen(true);
    };

    const handleConfirmDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este medicamento?')) {
            try {
                await medicationService.delete(id);
                await loadData();
            } catch (err) {
                alert('Erro ao excluir medicamento: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
            }
        }
    };

    const handleExportCSV = () => {
        if (medications.length === 0) {
            alert('Não há medicamentos para exportar.');
            return;
        }

        // Create CSV content
        const headers = ['Paciente', 'Medicamento', 'Data da Receita', 'Duração (dias)', 'Data de Renovação', 'Prioridade', 'Status', 'Observações'];
        const rows = medications.map(med => [
            med.patientName || '',
            med.name || '',
            med.prescription_date || '',
            med.duration_days?.toString() || '',
            med.renewal_date || '',
            med.priority || '',
            med.status || '',
            med.notes || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `medicamentos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleOpenHistory = () => {
        setIsHistoryModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentMedicationId) {
                await medicationService.update(currentMedicationId, formData);
            } else {
                await medicationService.create(formData);
            }
            await loadData();
            setIsModalOpen(false);
        } catch (err) {
            alert('Erro ao salvar medicamento: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
        }
    };

    const getPriorityBadge = (priority: string) => {
        const styles: Record<string, string> = {
            'Baixa': 'bg-green-100 text-green-800',
            'Média': 'bg-yellow-100 text-yellow-800',
            'Urgente': 'bg-red-100 text-red-800'
        };
        return styles[priority] || styles['Baixa'];
    };

    const getRenewalAlert = (daysUntilRenewal?: number) => {
        if (daysUntilRenewal === undefined) return { icon: '', count: 0, color: '' };

        if (daysUntilRenewal < 0) {
            return { icon: 'error', count: Math.abs(daysUntilRenewal), color: 'text-red-600' };
        } else if (daysUntilRenewal <= 5) {
            return { icon: 'warning', count: 1, color: 'text-yellow-600' };
        }
        return { icon: '', count: 0, color: '' };
    };

    const getRenewalStatus = (daysUntilRenewal?: number) => {
        if (daysUntilRenewal === undefined) return { text: '-', color: '' };

        if (daysUntilRenewal < 0) {
            return { text: `Vencido há ${Math.abs(daysUntilRenewal)} dias`, color: 'text-red-600 font-semibold' };
        } else if (daysUntilRenewal === 0) {
            return { text: 'Renova hoje', color: 'text-orange-600 font-semibold' };
        } else if (daysUntilRenewal <= 5) {
            return { text: `Renova em ${daysUntilRenewal} dias`, color: 'text-yellow-600 font-medium' };
        } else {
            return { text: `Renova em ${daysUntilRenewal} dias`, color: 'text-green-600' };
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full animate-fade-in">
                <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-primary animate-spin text-4xl">
                        progress_activity
                    </span>
                    <p className="text-muted-foreground">Carregando medicamentos...</p>
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
                        onClick={loadData}
                        className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-medium hover:bg-destructive/90 transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full relative animate-slide-in-up">
            {/* Header - responsive */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-10">
                <div>
                    <h2 className="text-xl md:text-3xl font-bold tracking-tight text-foreground">Notificações</h2>
                    <p className="text-sm text-muted-foreground mt-1">Medicamentos Controlados</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleOpenHistory}
                        className="hidden sm:flex bg-card text-secondary-foreground font-medium py-2 px-3 md:px-5 rounded-lg items-center gap-2 hover:bg-secondary transition-colors border border-border shadow-soft text-sm"
                    >
                        <span className="material-symbols-outlined">history</span>
                        <span className="hidden md:inline">Histórico</span>
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="hidden sm:flex bg-card text-secondary-foreground font-medium py-2 px-3 md:px-5 rounded-lg items-center gap-2 hover:bg-secondary transition-colors border border-border shadow-soft text-sm"
                    >
                        <span className="material-symbols-outlined">file_download</span>
                        <span className="hidden md:inline">CSV</span>
                    </button>
                    <button
                        onClick={handleOpenCreate}
                        className="flex-1 sm:flex-none bg-primary text-primary-foreground font-semibold py-2 px-4 md:px-5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-soft text-sm"
                    >
                        <span className="material-symbols-outlined">add_circle</span>
                        <span className="hidden sm:inline">Adicionar</span>
                        <span className="sm:hidden">Novo</span>
                    </button>
                </div>
            </header>

            {/* Search Bar - responsive */}
            <div className="mb-4 md:mb-6">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg md:text-xl">search</span>
                    <input
                        type="text"
                        placeholder="Buscar paciente ou medicamento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-3 bg-card border border-border rounded-lg shadow-soft focus:ring-2 focus:ring-primary focus:outline-none transition-shadow text-sm md:text-base"
                    />
                </div>
            </div>

            {/* Desktop Table View - hidden on mobile */}
            <div className="hidden md:block bg-card border border-border rounded-xl shadow-soft-lg flex-1 overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="bg-secondary/50 sticky top-0 z-10">
                        <tr>
                            <th className="p-4 font-semibold text-secondary-foreground">PACIENTE</th>
                            <th className="p-4 font-semibold text-secondary-foreground">MEDICAMENTO</th>
                            <th className="p-4 font-semibold text-secondary-foreground">STATUS DA RENOVAÇÃO</th>
                            <th className="p-4 font-semibold text-secondary-foreground">PRIORIDADE</th>
                            <th className="p-4 font-semibold text-secondary-foreground">ALERTAS</th>
                            <th className="p-4 font-semibold text-secondary-foreground text-right">AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredMedications.length > 0 ? (
                            filteredMedications.map((medication) => {
                                const renewalStatus = getRenewalStatus(medication.daysUntilRenewal);
                                const renewalAlert = getRenewalAlert(medication.daysUntilRenewal);

                                return (
                                    <tr key={medication.id} className="hover:bg-accent transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                                                    <span className="material-symbols-outlined">person</span>
                                                </div>
                                                <div className="font-medium text-foreground">{medication.patientName}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium text-foreground">{medication.name}</td>
                                        <td className="p-4">
                                            <span className={renewalStatus.color}>{renewalStatus.text}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityBadge(medication.priority)}`}>
                                                {medication.priority}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {renewalAlert.icon && (
                                                <div className="flex items-center gap-2">
                                                    <span className={`material-symbols-outlined fill ${renewalAlert.color}`}>{renewalAlert.icon}</span>
                                                    <span className={`font-semibold ${renewalAlert.color}`}>{renewalAlert.count}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            <button
                                                onClick={() => handleOpenEdit(medication)}
                                                className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors mr-1"
                                                title="Editar"
                                            >
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleConfirmDelete(medication.id)}
                                                className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                                title="Excluir"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                    Nenhum medicamento encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View - shown only on mobile */}
            <div className="md:hidden flex-1 overflow-y-auto space-y-3">
                {filteredMedications.length > 0 ? (
                    filteredMedications.map((medication) => {
                        const priorityBadge = getPriorityBadge(medication.priority);
                        const renewalStatus = getRenewalStatus(medication.daysUntilRenewal);
                        return (
                            <div key={medication.id} className="bg-card border border-border rounded-xl p-4 shadow-soft">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="font-semibold text-foreground">{medication.name}</div>
                                        <div className="text-xs text-muted-foreground">{medication.patientName}</div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleOpenEdit(medication)}
                                            className="p-1.5 rounded hover:bg-accent text-muted-foreground"
                                        >
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleConfirmDelete(medication.id)}
                                            className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityBadge}`}>
                                        {medication.priority}
                                    </span>
                                    <span className={`text-xs ${renewalStatus.color}`}>
                                        {renewalStatus.text}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        Nenhum medicamento encontrado.
                    </div>
                )}
            </div>

            {/* Modal de Cadastro */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                            <h3 className="font-bold text-lg">{currentMedicationId ? 'Editar Medicamento' : 'Novo Medicamento'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Paciente</label>
                                    <select
                                        required
                                        value={formData.patient_id}
                                        onChange={e => setFormData({ ...formData, patient_id: e.target.value })}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">Selecione um paciente</option>
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Nome do Medicamento</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 focus:ring-2 focus:ring-primary"
                                        placeholder="Ex: Amoxicilina, Losartana..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Data da Receita</label>
                                    <input
                                        required
                                        type="date"
                                        value={formData.prescription_date}
                                        onChange={e => setFormData({ ...formData, prescription_date: e.target.value })}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Duração (dias)</label>
                                    <select
                                        required
                                        value={formData.duration_days}
                                        onChange={e => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 focus:ring-2 focus:ring-primary"
                                    >
                                        <option value={30}>30 dias</option>
                                        <option value={60}>60 dias</option>
                                        <option value={90}>90 dias</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Prioridade</label>
                                    <select
                                        required
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value as 'Baixa' | 'Média' | 'Urgente' })}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="Baixa">Baixa</option>
                                        <option value="Média">Média</option>
                                        <option value="Urgente">Urgente</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Observações</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 focus:ring-2 focus:ring-primary"
                                        rows={3}
                                        placeholder="Informações adicionais..."
                                    />
                                </div>
                            </div>
                        </form>
                        <div className="px-6 py-4 border-t border-border bg-secondary/20 flex justify-end gap-2">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors border border-border bg-card">Cancelar</button>
                            <button type="button" onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Salvar Medicamento</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Histórico / Log */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[80vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                            <h3 className="font-bold text-lg">Histórico de Medicamentos</h3>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {medications.length > 0 ? (
                                <div className="space-y-4">
                                    {medications.map((med) => (
                                        <div key={med.id} className="border border-border rounded-lg p-4 hover:bg-accent transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-semibold text-foreground">{med.name || 'Sem nome'}</h4>
                                                    <p className="text-sm text-muted-foreground">Paciente: {med.patientName}</p>
                                                </div>
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityBadge(med.priority)}`}>
                                                    {med.priority}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Data da Receita:</span>
                                                    <p className="font-medium">{new Date(med.prescription_date).toLocaleDateString('pt-BR')}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Duração:</span>
                                                    <p className="font-medium">{med.duration_days} dias</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Renova em:</span>
                                                    <p className="font-medium">{med.renewal_date ? new Date(med.renewal_date).toLocaleDateString('pt-BR') : '-'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Cadastrado em:</span>
                                                    <p className="font-medium text-xs">{new Date(med.created_at).toLocaleDateString('pt-BR')}</p>
                                                </div>
                                            </div>
                                            {med.notes && (
                                                <div className="mt-3 pt-3 border-t border-border">
                                                    <span className="text-xs text-muted-foreground">Observações:</span>
                                                    <p className="text-sm mt-1">{med.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                    <span className="material-symbols-outlined text-4xl mb-2">history</span>
                                    <p>Nenhum histórico disponível.</p>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-border bg-secondary/20 flex justify-end">
                            <button onClick={() => setIsHistoryModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors border border-border bg-card">Fechar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
