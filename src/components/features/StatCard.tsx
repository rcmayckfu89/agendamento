import React, { useEffect, useState } from 'react';
import { StatData } from '../../types';

interface StatCardProps {
    data: StatData;
}

export const StatCard: React.FC<StatCardProps> = ({ data }) => {
    // Map existing categories to new styles from HTML template
    // Doctor -> Medical Services style
    // Nurse -> Vaccines style
    // Urgent -> Alert style

    const isMedical = data.category === 'Doctor';
    const isNurse = data.category === 'Nurse';
    const isUrgent = data.category === 'Urgent';

    // Configuração baseada na categoria
    const getConfig = () => {
        if (isMedical) return {
            bg: 'bg-white dark:bg-slate-800',
            border: 'border-slate-100 dark:border-slate-700',
            hover: 'hover:border-accent-purple/40',
            iconBg: 'bg-purple-50 dark:bg-purple-900/20',
            iconColor: 'text-accent-purple',
            label: 'MÉDICO',
            mainText: 'text-slate-900 dark:text-white',
            subText: 'text-slate-300 dark:text-slate-600',
            footer: 'EM ATENDIMENTO',
            footerColor: 'text-slate-400'
        };
        if (isNurse) return {
            bg: 'bg-white dark:bg-slate-800',
            border: 'border-slate-100 dark:border-slate-700',
            hover: 'hover:border-accent-teal/40',
            iconBg: 'bg-teal-50 dark:bg-teal-900/20',
            iconColor: 'text-accent-teal',
            label: 'ENFERMEIRA',
            mainText: 'text-slate-900 dark:text-white',
            subText: 'text-slate-300 dark:text-slate-600',
            footer: 'TRIAGEM / PROCEDIMENTOS',
            footerColor: 'text-slate-400'
        };
        // Urgent
        return {
            bg: 'bg-orange-50/50 dark:bg-orange-950/20',
            border: 'border-orange-100 dark:border-orange-900/30',
            hover: 'hover:bg-orange-50 dark:hover:bg-orange-950/30',
            iconBg: 'bg-orange-100 dark:bg-orange-900/50',
            iconColor: 'text-orange-600 dark:text-orange-400',
            label: 'DEMANDAS',
            mainText: 'text-orange-600 dark:text-orange-500',
            subText: 'hidden', // No total for urgent usually
            footer: 'URGÊNCIA EM ESPERA',
            footerColor: 'text-orange-500 dark:text-orange-400',
            animateIcon: 'animate-pulse'
        };
    };

    const config = getConfig();

    return (
        <div className={`${config.bg} p-6 rounded-2xl card-shadow border ${config.border} flex flex-col justify-between group ${config.hover} transition-all duration-300 animate-sync-slide`}>
            <div className="flex justify-between items-start mb-8">
                <span className={`text-xs font-bold uppercase tracking-widest ${isUrgent ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`}>
                    {config.label}
                </span>
                <div className={`p-2 rounded-lg ${config.iconBg} ${config.iconColor} ${config.animateIcon || ''}`}>
                    <span className="material-symbols-outlined">{data.icon}</span>
                </div>
            </div>

            <div className="flex items-baseline gap-1">
                <span className={`text-6xl font-black tracking-tighter ${config.mainText}`}>
                    {String(data.current).padStart(2, '0')}
                </span>
                {!isUrgent && (
                    <span className={`text-xl font-medium ${config.subText}`}>
                        / {data.total}
                    </span>
                )}
            </div>

            <p className={`text-xs font-bold uppercase mt-2 ${config.footerColor}`}>
                {data.label || config.footer}
            </p>
        </div>
    );
};