
import { Database } from './supabase';

// Raw Database Row Types
export type PatientRow = Database['public']['Tables']['patients']['Row'];
export type AppointmentRow = Database['public']['Tables']['appointments']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ScheduleConfigRow = Database['public']['Tables']['schedule_config']['Row'];
export type BlockedDayRow = Database['public']['Tables']['blocked_days']['Row'];

// Enums from DB
export type UserRole = Database['public']['Enums']['app_role'];
export type AppointmentStatus = Database['public']['Enums']['appointment_status'];

// --- Domain Interfaces (Frontend Logic) ---

// Patient: Can extend the Row, but might need UI specific fields (computed)
export interface Patient extends PatientRow {
    // Computed/UI fields
    initials?: string; // Derived from name
    nextAppointment?: string; // Derived from appointments join
    color?: string; // UI constant
    // Backwards compatibility or UI helpers
    registeredAt?: string; // Alias for created_at
    cpfOrCns?: string; // UI helper for display
}

// Service Types (Manual Enum - maybe move to DB later)
export type ServiceType =
    | 'DEMANDA ESPONTÂNEA'
    | 'PUERICULTURA'
    | 'HIPERDIA'
    | 'PRÉ-NATAL'
    | 'VISITA DOMICILIAR'
    | 'AGENDA'
    | 'ESTUDO'
    | 'CITOPATOLÓGICO'
    | 'LIVRE';

// Schedule Configuration (Frontend Shape)
export interface ShiftConfig {
    type: ServiceType;
    start: string; // HH:mm
    end: string;   // HH:mm
    interval: number;
}

// Professional: Aggregates Profile + Schedule Configs
export interface Professional {
    id: string;
    name: string; // From metadata or separate table? For now, we assume direct map or placeholder
    role: UserRole | string;
    // The frontend uses a map like 'seg-manha', this needs to be mapped from `schedule_config` table rows
    schedule: Record<string, ShiftConfig>;
}

// Appointment: Extends Row but often needs joined data (Patient Name, Prof Name)
export interface Appointment extends AppointmentRow {
    // These are needed for the UI List but come from Joins
    patient?: PatientRow; // Expanded relation
    professional?: ProfileRow; // Expanded relation

    // Legacy fields for compatibility (will be deprecated/mapped)
    patientName?: string;
    professionalName?: string;
    type?: ServiceType; // Maps to 'service' column
}

export interface BlockedDay extends BlockedDayRow { }

// History Item (Derived from Appointment)
export interface HistoryItem {
    id: string;
    time: string;
    period: 'AM' | 'PM';
    patientName: string;
    description: string;
    status: AppointmentStatus;
    professional: string;
}

// App Context State
export interface AppContextType {
    // Data (Now typed with DB-aligned types)
    patients: Patient[];
    professionals: Professional[];
    appointments: Appointment[];
    blockedDays: BlockedDay[];

    // CRUD Methods (Promises now, as we move to Async/DB)
    addPatient: (patient: Partial<Patient>) => Promise<void>;
    updatePatient: (patient: Partial<Patient>) => Promise<void>;
    deletePatient: (id: string) => Promise<void>;

    addProfessional: (professional: Professional) => Promise<void>;
    updateProfessional: (professional: Professional) => Promise<void>;
    deleteProfessional: (id: string) => Promise<void>;

    addAppointment: (appointment: Partial<Appointment>) => Promise<void>;
    updateAppointment: (appointment: Partial<Appointment>) => Promise<void>;
    deleteAppointment: (id: string) => Promise<void>;

    addBlockedDay: (day: Partial<BlockedDay>) => Promise<void>;
    removeBlockedDay: (id: string) => Promise<void>;

    // UI/Loading State
    isLoading: boolean;
    error: string | null;
}

export interface StatData {
    category: string;
    current: number;
    total: number;
    label: string;
    icon: string;
    colorClass: string;
    ringColorClass: string;
}