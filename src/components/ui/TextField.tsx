
import React, { InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: string;
    rightElement?: React.ReactNode;
}

export const TextField: React.FC<TextFieldProps> = ({ label, icon, rightElement, className, ...props }) => {
    return (
        <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5" htmlFor={props.id}>
                {label}
            </label>
            <div className="relative">
                {icon && (
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                        <span className="material-symbols-outlined text-[22px]">{icon}</span>
                    </span>
                )}

                <input
                    className={`block w-full ${icon ? 'pl-12' : 'pl-4'} ${rightElement ? 'pr-12' : 'pr-4'} py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-dark/20 focus:border-primary-dark transition-all ${className || ''}`}
                    {...props}
                />

                {rightElement && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        {rightElement}
                    </div>
                )}
            </div>
        </div>
    );
};
