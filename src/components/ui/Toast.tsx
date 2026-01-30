import React, { useEffect } from 'react';

export interface ToastProps {
    id: string;
    message: string;
    type?: 'success' | 'info' | 'warning' | 'error';
    duration?: number;
    onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
    id,
    message,
    type = 'info',
    duration = 3000,
    onClose
}) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const typeStyles = {
        success: 'bg-green-600 border-green-500',
        info: 'bg-blue-600 border-blue-500',
        warning: 'bg-orange-600 border-orange-500',
        error: 'bg-red-600 border-red-500'
    };

    const icons = {
        success: 'check_circle',
        info: 'info',
        warning: 'warning',
        error: 'error'
    };

    return (
        <div
            className={`${typeStyles[type]} text-white px-4 py-3 rounded-lg shadow-lg border-l-4 flex items-center gap-3 min-w-[300px] max-w-md animate-sync-slide`}
        >
            <span className="material-symbols-outlined text-xl">{icons[type]}</span>
            <p className="text-sm font-bold flex-1">{message}</p>
            <button
                onClick={() => onClose(id)}
                className="text-white/80 hover:text-white transition-colors"
            >
                <span className="material-symbols-outlined text-lg">close</span>
            </button>
        </div>
    );
};
