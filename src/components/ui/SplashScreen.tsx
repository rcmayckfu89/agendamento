
import React from 'react';

interface SplashScreenProps {
    isFadingOut?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isFadingOut = false }) => {
    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-slate-50 transition-opacity duration-700 ease-in-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, #e2e8f0 1px, transparent 0)',
                        backgroundSize: '32px 32px'
                    }}
                ></div>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-50 blur-[120px]"></div>
            </div>

            {/* Content Container */}
            <div className="relative flex flex-col items-center z-10 scale-up-enter">

                {/* Spinner & Logo */}
                <div className="relative w-[220px] h-[220px] flex items-center justify-center">
                    {/* Ring */}
                    <div
                        className="w-full h-full rounded-full p-1 animate-spin-slow"
                        style={{
                            background: 'conic-gradient(from 0deg, transparent 0%, #14b8a6 50%, #1e3a8a 100%)',
                            mask: 'radial-gradient(farthest-side, transparent calc(100% - 6px), #fff 0)',
                            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 6px), #fff 0)',
                        }}
                    ></div>

                    {/* Logo Center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="filter drop-shadow-md text-center">
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-display">
                                Agenda<span className="text-teal-500">+</span>
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Text */}
                <div className="mt-16 text-center space-y-2">
                    <p className="text-xl font-bold text-slate-800 tracking-tight animate-pulse">
                        Organizando sua agenda...
                    </p>
                    <p className="text-slate-500 font-medium text-xs uppercase tracking-[0.2em]">
                        Sincronizando Dados
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mt-8 w-64 h-1.5 bg-white/50 backdrop-blur-sm rounded-full overflow-hidden border border-slate-100 shadow-sm relative">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-500 to-blue-800 rounded-full animate-progress-indeterminate w-1/2"></div>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-10 flex flex-col items-center gap-2 animate-fade-in-up">
                <div className="flex items-center gap-4 text-slate-400">
                    <span className="material-symbols-outlined text-sm">verified_user</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold">Ambiente Seguro Agenda+</span>
                    <span className="material-symbols-outlined text-sm">cloud_done</span>
                </div>
                <div className="text-[10px] text-slate-300 font-medium">Versão 2.0.4 • Cluster SA-EAST-1</div>
            </div>
        </div>
    );
};
