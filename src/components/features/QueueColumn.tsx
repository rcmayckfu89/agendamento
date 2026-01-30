import React from 'react';
import { PatientCard } from './PatientCard';
import { PatientQueueItem } from '../../types/queue';

interface QueueColumnProps {
    title: string;
    icon: string;
    iconBgClass: string;
    iconTextClass: string;
    patientCount: number;
    patients: PatientQueueItem[];
    onLinkNewPatient?: () => void;
    onPatientClick?: (patient: PatientQueueItem) => void;
}

export const QueueColumn: React.FC<QueueColumnProps> = ({
    title,
    icon,
    iconBgClass,
    iconTextClass,
    patientCount,
    patients,
    onLinkNewPatient,
    onPatientClick
}) => {
    return (
        <div className="flex flex-col gap-4 min-h-[400px]">
            {/* Header Column */}
            <div className="flex items-center justify-between px-2 mb-2">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${iconBgClass} ${iconTextClass}`}>
                        <span className="material-symbols-outlined text-2xl">{icon}</span>
                    </div>
                    <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 font-display">
                        {title}
                    </h3>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                    {patientCount} Pacientes
                </span>
            </div>

            {/* List */}
            <div className="space-y-4">
                {patients.length > 0 ? (
                    patients.map((patient) => (
                        <PatientCard
                            key={patient.id}
                            patient={patient}
                            onClick={() => onPatientClick && onPatientClick(patient)}
                        />
                    ))
                ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl mb-2">inbox</span>
                        <p className="text-sm font-bold text-slate-400">Fila vazia</p>
                    </div>
                )}

                {onLinkNewPatient && (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer active-click" onClick={onLinkNewPatient}>
                        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 w-full uppercase tracking-wider">
                            <span className="material-symbols-outlined text-lg">add</span>
                            Adicionar à Fila
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
