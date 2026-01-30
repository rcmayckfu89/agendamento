
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AuthLayout } from '../components/layout/AuthLayout';
import { TextField } from '../components/ui/TextField';
import { supabase } from '../services/supabaseClient';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { addToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    // Handle redirection if user was trying to access a protected page
    const from = (location.state as any)?.from?.pathname || '/';

    // Load saved email on mount
    React.useEffect(() => {
        const savedEmail = localStorage.getItem('agenda_saved_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Save or Remove email based on Remember Me
        if (rememberMe) {
            localStorage.setItem('agenda_saved_email', email);
        } else {
            localStorage.removeItem('agenda_saved_email');
        }

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                if (error.message === 'Invalid login credentials') {
                    throw new Error('Credenciais inválidas. Verifique seu e-mail e senha.');
                }
                throw error;
            }

            // Success handled by AuthContext listener, but we can double check or just wait
            // Adding a small delay for UX if needed, or navigate immediately is also handled by AuthContext usually? 
            // Actually our App.tsx ProtectedRoute handles the redirect if *not* authenticated, 
            // but upon *successful* login we typically redirect manually or let state update.
            // Let's redirect manually just to be sure.

            navigate(from, { replace: true });

        } catch (error: any) {
            console.error('Login error:', error);
            addToast(error.message || 'Erro ao fazer login', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            {/* Mobile Header (Only visible on small screens) */}
            <div className="lg:hidden flex items-center gap-2 mb-8 text-primary-dark dark:text-cyan-400">
                <span className="material-symbols-outlined text-4xl">event_upcoming</span>
                <span className="text-2xl font-extrabold tracking-tight">Agenda<span className="text-cyan-600 dark:text-cyan-400">+</span></span>
            </div>

            {/* Title Section */}
            <div className="mb-8 lg:mb-12 text-center lg:text-left">
                <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 lg:mb-3">Bem-vindo de volta</h2>
                <p className="text-secondary-text dark:text-slate-400 text-lg lg:text-xl font-medium lg:font-normal leading-tight">
                    Acesse o ecossistema de gestão e cuidado à população.
                </p>
                <p className="lg:hidden mt-3 text-xs font-bold text-teal-600 dark:text-cyan-500 uppercase tracking-widest opacity-80">
                    Sincronização de Agendas e Triagem em Tempo Real
                </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <TextField
                    id="email"
                    type="email"
                    label="E-mail funcional"
                    placeholder="usuario@municipio.gov.br"
                    icon="mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <div>
                    <div className="flex items-center justify-between mb-2.5">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">Senha</label>
                        <a href="#" className="text-sm font-semibold text-teal-700 hover:text-teal-800 dark:text-cyan-400 transition-colors">Esqueceu a senha?</a>
                    </div>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                            <span className="material-symbols-outlined text-[22px]">lock</span>
                        </span>
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="block w-full pl-12 pr-12 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-dark/20 focus:border-primary-dark transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[22px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center">
                    <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-5 w-5 text-primary-dark focus:ring-primary-dark/20 border-slate-300 rounded-lg cursor-pointer transition-all"
                    />
                    <label htmlFor="remember-me" className="ml-3 block text-sm font-medium text-secondary-text dark:text-slate-300 cursor-pointer">
                        Lembrar usuário
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-teal-900/10 text-base font-bold text-white bg-primary-dark hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-500/20 transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                            Acessando...
                        </span>
                    ) : (
                        "Acessar Painel"
                    )}
                </button>
            </form>

            <div className="mt-10 text-center">
                <p className="text-sm font-medium text-secondary-text dark:text-slate-400">
                    Ainda não tem acesso?{' '}
                    <a href="#" className="font-bold text-teal-700 dark:text-cyan-400 hover:underline decoration-2 underline-offset-4 transition-all">
                        Solicitar credenciais
                    </a>
                </p>
            </div>

            {/* Footer / Theme Toggle */}
            <div className="mt-auto pt-8 lg:pt-12 flex flex-col items-center gap-6">
                <div className="flex items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Agenda+ v2.0.4 • Gestão Pública
                    </p>
                </div>
                <button
                    onClick={() => document.documentElement.classList.toggle('dark')}
                    className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px] dark:hidden">dark_mode</span>
                    <span className="material-symbols-outlined text-[20px] hidden dark:block">light_mode</span>
                </button>
            </div>
        </AuthLayout>
    );
};
