
import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { PatientQueueItem } from '../../types/queue';

interface QueueActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: PatientQueueItem | null;
    onFinish: () => void;
    onNoShow: () => void;
    onCancel: () => void;
}

export const QueueActionModal: React.FC<QueueActionModalProps> = ({
    isOpen,
    onClose,
    patient,
    onFinish,
    onNoShow,
    onCancel
}) => {
    if (!patient) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Atendimento: ${patient.name}`}
            size="md"
        >
            <div className="space-y-6">
                {/* Info Card */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Paciente</p>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{patient.name}</h4>
                    <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-slate-600 dark:text-slate-300">ID: {patient.patientId}</span>
                        <span className="text-slate-600 dark:text-slate-300">Horário: {patient.time}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Finalize Action - Primary */}
                    <button
                        onClick={onFinish}
                        className="sm:col-span-2 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm transition-colors active-click flex flex-col items-center justify-center gap-1"
                    >
                        <span className="material-symbols-outlined text-3xl">check_circle</span>
                        FINALIZAR ATENDIMENTO
                    </button>

                    {/* Other Actions */}
                    <button
                        onClick={onNoShow}
                        className="py-3 px-4 border border-orange-200 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:border-orange-800 text-orange-700 dark:text-orange-300 font-semibold rounded-xl transition-colors active-click flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">person_off</span>
                        Faltou
                    </button>

                    <button
                        onClick={onCancel}
                        className="py-3 px-4 border border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-300 font-semibold rounded-xl transition-colors active-click flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">cancel</span>
                        Cancelar
                    </button>
                </div>
            </div>
        </Modal>
    );
};
