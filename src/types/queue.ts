export interface PatientQueueItem {
    id: string;
    originalAppointmentId: string; // Link to original appointment
    name: string;
    patientId: string; // Display ID (e.g. #4492)
    age: number;
    status: 'waiting' | 'in-call' | 'urgent' | 'procedure' | 'return';
    time: string;
    professionalName?: string;
    duration?: string; // e.g. "3min"
    location?: string; // e.g. "GUICHÊ 02"
    serviceType?: string; // e.g. "TRIAGEM", "CONSULTA"
}

export interface QueueStats {
    medico: { current: number; total: number };
    enfermeira: { current: number; total: number };
    demandas: number;
}
