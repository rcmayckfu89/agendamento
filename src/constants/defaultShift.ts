import { ShiftConfig } from '../types';

// Configuração padrão de turno para novos profissionais
export const defaultShift: ShiftConfig = {
    type: 'LIVRE',
    start: '08:00',
    end: '12:00',
    interval: 30
};
