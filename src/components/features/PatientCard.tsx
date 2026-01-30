import React from 'react';
import { PatientQueueItem } from '../../types/queue';

interface PatientCardProps {
    patient: PatientQueueItem;
    onClick?: () => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onClick }) => {
    // Determine visuals based on status
    const getStatusConfig = () => {
        switch (patient.status) {
            case 'in-call':
                return {
                    containerClass: 'bg-indigo-50/50 dark:bg-indigo-900/10 border-2 border-indigo-500 shadow-md transform scale-[1.02]',
                    badgeClass: 'bg-indigo-600 text-white animate-pulse',
                    badgeText: 'EM CHAMADA',
                    badgeIcon: 'volume_up',
                    iconColor: 'text-indigo-600',
                    nameColor: 'text-slate-900 dark:text-white',
                    metaColor: 'text-indigo-600/60'
                };
            case 'procedure':
                return {
                    containerClass: 'bg-white dark:bg-slate-800 border-l-4 border-cyan-500',
                    badgeClass: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
                    badgeText: 'PROCEDIMENTO',
                    iconColor: 'text-cyan-600',
                    nameColor: 'text-slate-900 dark:text-white',
                    metaColor: 'text-slate-400'
                };
            case 'urgent':
                return {
                    containerClass: 'bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500',
                    badgeClass: 'bg-red-500 text-white',
                    badgeIcon: 'priority_high',
                    badgeText: 'URGENTE',
                    iconColor: 'text-red-500',
                    nameColor: 'text-red-900 dark:text-red-100',
                    metaColor: 'text-red-600/60 dark:text-red-400/60'
                };
            case 'return':
                return {
                    containerClass: 'bg-white dark:bg-slate-800 border-l-4 border-slate-300 dark:border-slate-600',
                    badgeClass: 'bg-slate-100 dark:bg-slate-700 text-slate-500',
                    badgeText: 'RETORNO',
                    iconColor: 'text-slate-500 dark:text-slate-400',
                    nameColor: 'text-slate-900 dark:text-white',
                    metaColor: 'text-slate-400'
                };
            case 'waiting':
            default:
                // Service Type Specific Colors for Waiting List
                if (patient.serviceType === 'HIPERDIA') {
                    return {
                        containerClass: 'bg-white dark:bg-slate-800 border-l-4 border-orange-500',
                        badgeClass: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
                        badgeText: 'HIPERDIA',
                        iconColor: 'text-orange-500',
                        nameColor: 'text-slate-900 dark:text-white',
                        metaColor: 'text-slate-400'
                    };
                }
                if (patient.serviceType === 'PRÉ-NATAL') {
                    return {
                        containerClass: 'bg-white dark:bg-slate-800 border-l-4 border-pink-500',
                        badgeClass: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
                        badgeText: 'PRÉ-NATAL',
                        iconColor: 'text-pink-500',
                        nameColor: 'text-slate-900 dark:text-white',
                        metaColor: 'text-slate-400'
                    };
                }
                if (patient.serviceType === 'PUERICULTURA') {
                    return {
                        containerClass: 'bg-white dark:bg-slate-800 border-l-4 border-teal-500',
                        badgeClass: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
                        badgeText: 'PUERICULTURA',
                        iconColor: 'text-teal-500',
                        nameColor: 'text-slate-900 dark:text-white',
                        metaColor: 'text-slate-400'
                    };
                }
                if (patient.serviceType === 'VISITA DOMICILIAR') {
                    return {
                        containerClass: 'bg-white dark:bg-slate-800 border-l-4 border-indigo-400',
                        badgeClass: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
                        badgeText: 'VISITA',
                        iconColor: 'text-indigo-400',
                        nameColor: 'text-slate-900 dark:text-white',
                        metaColor: 'text-slate-400'
                    };
                }

                // Default Waiting
                return {
                    containerClass: 'bg-white dark:bg-slate-800 border-l-4 border-purple-500',
                    badgeClass: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
                    badgeText: 'AGUARDANDO',
                    iconColor: 'text-slate-500 dark:text-slate-400',
                    nameColor: 'text-slate-900 dark:text-white',
                    metaColor: 'text-slate-400'
                };
        }
    };

    const config = getStatusConfig();
    const isUrgent = patient.status === 'urgent';
    const isInCall = patient.status === 'in-call';

    return (
        <div
            onClick={onClick}
            className={`${config.containerClass} p-4 rounded-xl card-shadow hover:shadow-md transition-shadow cursor-pointer animate-sync-slide`}
        >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h4 className={`font-bold text-lg ${config.nameColor}`}>
                        {patient.name}
                    </h4>
                    <p className={`text-xs font-bold uppercase tracking-wide ${config.metaColor} mt-0.5`}>
                        ID: #{patient.patientId} • {patient.age} ANOS
                    </p>
                </div>

                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${config.badgeClass}`}>
                    {config.badgeIcon && (
                        <span className="material-symbols-outlined text-[10px]">{config.badgeIcon}</span>
                    )}
                    {config.badgeText}
                </div>
            </div>

            <div className="flex items-center justify-between mt-4">
                <div className={`flex items-center gap-2 ${config.iconColor}`}>
                    <span className="material-symbols-outlined text-base">
                        {isInCall ? 'notifications_active' : isUrgent ? 'emergency' : patient.status === 'procedure' ? 'timer' : 'schedule'}
                    </span>
                    <span className="text-base font-bold font-mono tracking-tight">
                        {isInCall && patient.location ? patient.location :
                            patient.status === 'procedure' && patient.time ? `Iniciado: ${patient.time}` :
                                isUrgent ? 'TRIAGEM IMEDIATA' :
                                    patient.time}
                    </span>
                </div>

                {isInCall && patient.duration && (
                    <span className="text-xs font-bold text-slate-400">{patient.duration}</span>
                )}

                {!isInCall && !isUrgent && (
                    <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-slate-500">
                            <span className="material-symbols-outlined text-[12px]">person</span>
                        </div>
                    </div>
                )}

                {patient.professionalName && (
                    <span className="text-[10px] font-bold text-slate-400 italic">
                        {patient.professionalName}
                    </span>
                )}
            </div>
        </div>
    );
};
