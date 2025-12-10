export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            appointments: {
                Row: {
                    created_at: string | null
                    date: string
                    id: string
                    notes: string | null
                    patient_id: string
                    professional_id: string
                    service: string
                    status: Database["public"]["Enums"]["appointment_status"] | null
                    time: string
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    date: string
                    id?: string
                    notes?: string | null
                    patient_id: string
                    professional_id: string
                    service: string
                    status?: Database["public"]["Enums"]["appointment_status"] | null
                    time: string
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    date?: string
                    id?: string
                    notes?: string | null
                    patient_id?: string
                    professional_id?: string
                    service?: string
                    status?: Database["public"]["Enums"]["appointment_status"] | null
                    time?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "appointments_patient_id_fkey"
                        columns: ["patient_id"]
                        isOneToOne: false
                        referencedRelation: "patients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "appointments_professional_id_fkey"
                        columns: ["professional_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            blocked_days: {
                Row: {
                    created_at: string | null
                    date: string
                    id: string
                    reason: string
                }
                Insert: {
                    created_at?: string | null
                    date: string
                    id?: string
                    reason: string
                }
                Update: {
                    created_at?: string | null
                    date?: string
                    id?: string
                    reason?: string
                }
                Relationships: []
            }
            medications: {
                Row: {
                    created_at: string
                    duration_days: number
                    id: string
                    name: string
                    notes: string | null
                    patient_id: string
                    prescription_date: string
                    priority: string
                    renewal_date: string | null
                    status: string | null
                }
                Insert: {
                    created_at?: string
                    duration_days: number
                    id?: string
                    name: string
                    notes?: string | null
                    patient_id: string
                    prescription_date: string
                    priority: string
                    renewal_date?: string | null
                    status?: string | null
                }
                Update: {
                    created_at?: string
                    duration_days?: number
                    id?: string
                    name?: string
                    notes?: string | null
                    patient_id?: string
                    prescription_date?: string
                    priority?: string
                    renewal_date?: string | null
                    status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "medications_patient_id_fkey"
                        columns: ["patient_id"]
                        isOneToOne: false
                        referencedRelation: "patients"
                        referencedColumns: ["id"]
                    },
                ]
            }
            patients: {
                Row: {
                    birth_date: string | null
                    cns: string | null
                    comorbidities: string[] | null
                    cpf: string | null
                    created_at: string | null
                    email: string | null
                    guardian_name: string | null
                    health_agent: string | null
                    id: string
                    name: string
                    phone: string | null
                    updated_at: string | null
                }
                Insert: {
                    birth_date?: string | null
                    cns?: string | null
                    comorbidities?: string[] | null
                    cpf?: string | null
                    created_at?: string | null
                    email?: string | null
                    guardian_name?: string | null
                    health_agent?: string | null
                    id?: string
                    name: string
                    phone?: string | null
                    updated_at?: string | null
                }
                Update: {
                    birth_date?: string | null
                    cns?: string | null
                    comorbidities?: string[] | null
                    cpf?: string | null
                    created_at?: string | null
                    email?: string | null
                    guardian_name?: string | null
                    health_agent?: string | null
                    id?: string
                    name?: string
                    phone?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    created_at: string | null
                    email: string | null
                    id: string
                    role: string | null
                }
                Insert: {
                    created_at?: string | null
                    email?: string | null
                    id: string
                    role?: string | null
                }
                Update: {
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    role?: string | null
                }
                Relationships: []
            }
            schedule_config: {
                Row: {
                    afternoon_end: string | null
                    afternoon_start: string | null
                    created_at: string | null
                    id: string
                    interval_minutes: number
                    morning_end: string | null
                    morning_start: string | null
                    professional_id: string
                    weekday: number
                }
                Insert: {
                    afternoon_end?: string | null
                    afternoon_start?: string | null
                    created_at?: string | null
                    id?: string
                    interval_minutes?: number
                    morning_end?: string | null
                    morning_start?: string | null
                    professional_id: string
                    weekday: number
                }
                Update: {
                    afternoon_end?: string | null
                    afternoon_start?: string | null
                    created_at?: string | null
                    id?: string
                    interval_minutes?: number
                    morning_end?: string | null
                    morning_start?: string | null
                    professional_id: string
                    weekday: number
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            has_role: {
                Args: {
                    allowed_roles: Database["public"]["Enums"]["app_role"][]
                }
                Returns: boolean
            }
            is_slot_available: {
                Args: {
                    p_prof_id: string
                    p_date: string
                    p_time: string
                }
                Returns: boolean
            }
        }
        Enums: {
            app_role: "medico" | "enfermeiro" | "tecnico" | "recepcionista"
            appointment_status: "scheduled" | "canceled" | "finished" | "no_show"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
