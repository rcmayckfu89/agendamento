import React from 'react';

export const Backup: React.FC = () => {
    return (
        <div className="flex flex-col h-full">
            <header className="mb-10">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Backup e Restauração</h2>
                <p className="text-muted-foreground mt-1">Gerencie os backups dos dados da sua aplicação.</p>
            </header>

            <div className="space-y-10">
                <div className="bg-card p-8 rounded-xl border border-border shadow-soft">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Backup Manual</h3>
                    <p className="text-muted-foreground mb-6">Crie um backup completo dos seus dados a qualquer momento.</p>
                    <div className="flex items-center gap-6">
                        <button className="bg-primary text-primary-foreground font-semibold py-2.5 px-5 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-soft">
                            <span className="material-symbols-outlined">cloud_upload</span>
                            Criar Novo Backup
                        </button>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="material-symbols-outlined text-green-500 fill" style={{ fontSize: '20px' }}>verified</span>
                            <span>Último backup: 25 de Julho, 2024 - 10:30</span>
                        </div>
                    </div>
                </div>

                <div className="bg-card p-8 rounded-xl border border-border shadow-soft">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">Backup Automático</h3>
                            <p className="text-muted-foreground">Configure backups automáticos para proteger seus dados regularmente.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-6 flex items-center bg-green-500 rounded-full p-1 cursor-pointer">
                                <div className="bg-white w-4 h-4 rounded-full shadow-md transform translate-x-4"></div>
                            </div>
                            <span className="font-medium text-foreground">Ativado</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="frequency" className="block text-sm font-medium text-foreground mb-2">Frequência</label>
                            <select id="frequency" className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition">
                                <option>Diariamente</option>
                                <option>Semanalmente</option>
                                <option>Mensalmente</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="destination" className="block text-sm font-medium text-foreground mb-2">Destino</label>
                            <select id="destination" className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition">
                                <option>Google Drive</option>
                                <option>Dropbox</option>
                                <option>Servidor Local</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-card p-8 rounded-xl border border-border shadow-soft">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Restaurar Dados</h3>
                    <p className="text-muted-foreground mb-6">Restaure a aplicação a partir de um backup anterior. Esta ação não pode ser desfeita.</p>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="w-full md:w-auto flex-1">
                            <label htmlFor="backup-file" className="sr-only">Escolha um arquivo de backup</label>
                            <select id="backup-file" className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition">
                                <option>backup_2024-07-25_10-30.zip</option>
                                <option>backup_2024-07-24_02-00.zip</option>
                                <option>backup_2024-07-23_02-00.zip</option>
                            </select>
                        </div>
                        <button className="bg-card text-secondary-foreground font-semibold py-2.5 px-5 rounded-lg flex items-center gap-2 hover:bg-secondary transition-colors border border-border shadow-soft w-full md:w-auto justify-center">
                            <span className="material-symbols-outlined">settings_backup_restore</span>
                            Restaurar
                        </button>
                    </div>
                </div>
                 <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex items-start gap-3">
                    <span className="material-symbols-outlined mt-0.5 text-yellow-600">warning</span>
                    <div>
                        <h4 className="font-semibold">Atenção</h4>
                        <p className="text-sm">A restauração de um backup substituirá todos os dados atuais. Certifique-se de que selecionou o arquivo correto antes de continuar.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};