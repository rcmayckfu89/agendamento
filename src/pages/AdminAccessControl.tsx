import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSystemLock } from '../context/SystemLockContext';
import { isAdminEmail } from '../constants/admin';

export const AdminAccessControl: React.FC = () => {
    const { user } = useAuth();
    const {
        isBlocked,
        storageMode,
        loading,
        error,
        setSystemBlocked,
        refreshSystemLock
    } = useSystemLock();

    const [isSaving, setIsSaving] = React.useState(false);

    if (!isAdminEmail(user?.email)) {
        return <Navigate to="/" replace />;
    }

    const handleToggle = async () => {
        const nextBlocked = !isBlocked;
        const message = nextBlocked
            ? 'Tem certeza que deseja bloquear o acesso dos usuários ao sistema?'
            : 'Deseja liberar novamente o acesso dos usuários ao sistema?';

        if (!confirm(message)) return;

        setIsSaving(true);
        try {
            await setSystemBlocked(nextBlocked);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    Controle de acesso
                </h2>
                <p className="mt-1 text-muted-foreground">
                    Gerencie a disponibilidade do sistema para os demais usuários.
                </p>
            </header>

            <section className="rounded-lg border border-border bg-card p-6 shadow-soft">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-lg ${isBlocked ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'}`}>
                            <span className="material-symbols-outlined text-3xl">
                                {isBlocked ? 'lock' : 'lock_open'}
                            </span>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-foreground">
                                {isBlocked ? 'Sistema bloqueado' : 'Sistema liberado'}
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                                {isBlocked
                                    ? 'Os demais usuários verão uma página de acesso temporariamente suspenso. Você continuará conseguindo entrar para liberar o sistema.'
                                    : 'Os usuários autorizados podem acessar normalmente a agenda, pacientes, histórico e demais áreas do sistema.'}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleToggle}
                        disabled={loading || isSaving}
                        className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-bold text-white shadow-soft transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${isBlocked ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        <span className="material-symbols-outlined">
                            {isSaving ? 'progress_activity' : isBlocked ? 'lock_open' : 'lock'}
                        </span>
                        {isBlocked ? 'Liberar acesso' : 'Bloquear acesso'}
                    </button>
                </div>
            </section>

            {storageMode === 'local' && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
                    A configuração está em modo local porque a tabela global ainda não foi encontrada no Supabase. Para bloquear todos os usuários de verdade, execute a migração SQL incluída no projeto.
                </div>
            )}

            {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100">
                    {error}
                </div>
            )}

            <button
                type="button"
                onClick={refreshSystemLock}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-soft transition-colors hover:bg-secondary"
            >
                <span className="material-symbols-outlined text-xl">sync</span>
                Atualizar status
            </button>
        </div>
    );
};
