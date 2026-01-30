
import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { PatientQueueItem } from '../../types/queue';

interface QueueActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: PatientQueueItem | null;
    onCall: (location: string) => void;
    onFinish: () => void;
    onNoShow: () => void;
    onCancel: () => void;
}

export const QueueActionModal: React.FC<QueueActionModalProps> = ({
    isOpen,
    onClose,
    patient,
    onCall,
    onFinish,
    onNoShow,
    onCancel
}) => {
    const [location, setLocation] = useState('Consultório 01'); // Default or could be dynamic

    if (!patient) return null;

    const isWaiting = patient.status === 'waiting' || patient.status === 'urgent' || patient.status === 'return';
    const isInCall = patient.status === 'in-call';

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

                {/* Actions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Call Patient Action */}
                    {isWaiting && (
                        <div className="sm:col-span-2 p-4 border border-blue-100 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800 rounded-xl space-y-3">
                            <h5 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                <span className="material-symbols-outlined">campaign</span>
                                Chamar Paciente
                            </h5>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Local (ex: Sala 01)"
                                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button
                                    onClick={() => onCall(location)}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors active-click flex items-center justify-center gap-2"
                                >
                                    CHAMAR
                                </button>
                            </div>
                        </div>
                    )}

                    {/* In Progress Actions */}
                    {isInCall && (
                        <button
                            onClick={onFinish}
                            className="sm:col-span-2 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm transition-colors active-click flex flex-col items-center justify-center gap-1"
                        >
                            <span className="material-symbols-outlined text-3xl">check_circle</span>
                            FINALIZAR ATENDIMENTO
                        </button>
                    )}

                    {/* Other Actions - Always visible if not finished */}
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
