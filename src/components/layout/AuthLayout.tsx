
import React from 'react';

interface AuthLayoutProps {
    children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
    return (
        <main className="flex min-h-screen font-display">
            {/* Left Column - Branding & Visuals */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-medical-gradient overflow-hidden flex-col justify-between p-16 text-white animate-fade-in">
                <div className="absolute inset-0 health-tech-pattern pointer-events-none"></div>

                {/* Header/Logo */}
                <div className="relative z-10 flex items-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-cyan-300">event_upcoming</span>
                    <span className="text-2xl font-extrabold tracking-tight">Agenda<span className="text-cyan-300">+</span></span>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 max-w-xl">
                    <h1 className="text-6xl font-extrabold mb-8 leading-[1.1] tracking-tight">
                        Organização e cuidado no atendimento à população.
                    </h1>
                    <p className="text-xl text-slate-100/90 leading-relaxed font-light">
                        Uma plataforma para gerenciar agendas, filas e atendimentos da Atenção Básica com eficiência e transparência.
                    </p>
                </div>

                {/* Footer */}
                <div className="relative z-10 text-sm font-medium text-slate-300/80">
                    © 2026 Agenda+
                </div>

                {/* Decorative Blurs */}
                <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute top-1/4 -right-10 w-64 h-64 bg-cyan-400/10 rounded-full blur-2xl"></div>
            </div>

            {/* Right Column - Form Content */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-16 bg-white dark:bg-slate-900 transition-colors duration-300">
                <div className="w-full max-w-md animate-scale-up">
                    {children}
                </div>
            </div>
        </main>
    );
};
