import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SUPPORT_PHONE_DISPLAY = '(79) 9 9951-5347';
const SUPPORT_PHONE_WHATSAPP = '5579999515347';

export const BlockedAccess: React.FC = () => {
    const { signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        window.history.replaceState(null, '', `${window.location.pathname}#/login`);
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col">
                <header className="flex items-center justify-between border-b border-border pb-4 animate-precision-fade">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <span className="material-symbols-outlined text-2xl">event_upcoming</span>
                        </div>
                        <div>
                            <p className="text-lg font-extrabold tracking-tight">
                                Agenda<span className="text-accent">+</span>
                            </p>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Controle de acesso
                            </p>
                        </div>
                    </div>

                    <span className="hidden rounded-md border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 sm:inline-flex">
                        Suspenso
                    </span>
                </header>

                <main className="flex flex-1 items-center justify-center py-10">
                    <section className="w-full max-w-2xl rounded-lg border border-border bg-card shadow-soft-lg scale-up-enter">
                        <div className="border-b border-border px-6 py-5 sm:px-8">
                            <div className="flex items-start gap-4">
                                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                                    <span className="absolute inset-0 rounded-lg bg-amber-300/30 animate-ping" />
                                    <span className="material-symbols-outlined relative text-4xl animate-pulse">lock_clock</span>
                                </div>

                                <div className="animate-fade-in-up">
                                    <p className="mb-2 inline-flex rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-900/50 dark:text-amber-100">
                                        Regularização pendente
                                    </p>
                                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                                        Acesso temporariamente suspenso
                                    </h1>
                                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                                        O uso do sistema foi pausado temporariamente por pendência de regularização. Para retomar o acesso à agenda, aos pacientes e aos atendimentos, entre em contato com o responsável pelo sistema.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5 px-6 py-6 sm:px-8">
                            <div className="rounded-lg border border-border bg-background p-4 animate-sync-slide stagger-1">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                            Contato para regularização
                                        </p>
                                        <p className="mt-1 text-xl font-extrabold text-foreground">
                                            {SUPPORT_PHONE_DISPLAY}
                                        </p>
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-700 transition-transform duration-300 hover:scale-105 dark:bg-green-950/40 dark:text-green-300">
                                        <span className="material-symbols-outlined text-3xl">support_agent</span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg bg-muted px-4 py-3 animate-sync-slide stagger-2">
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    Após a regularização, o acesso poderá ser liberado pelo administrador do sistema.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row animate-sync-slide stagger-3">
                                <a
                                    href={`https://wa.me/${SUPPORT_PHONE_WHATSAPP}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 font-bold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-soft-lg active:translate-y-0"
                                >
                                    <span className="material-symbols-outlined">chat</span>
                                    Entrar em contato
                                </a>

                                <button
                                    type="button"
                                    onClick={handleSignOut}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-3 font-bold text-foreground shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary hover:shadow-soft-lg active:translate-y-0"
                                >
                                    <span className="material-symbols-outlined">logout</span>
                                    Sair
                                </button>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-border pt-4 text-center text-xs font-semibold text-muted-foreground animate-precision-fade">
                    Agenda+ • Gestão de atendimentos
                </footer>
            </div>
        </div>
    );
};
