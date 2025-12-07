/**
 * Utilitários para manipulação de horários
 */

/**
 * Gera slots de tempo com base em intervalo
 */
export const generateTimeSlots = (startTime: string, endTime: string, intervalMinutes: number): string[] => {
    const slots: string[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentMinutes < endMinutes) {
        const hour = Math.floor(currentMinutes / 60);
        const min = currentMinutes % 60;
        slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
        currentMinutes += intervalMinutes;
    }

    return slots;
};

/**
 * Verifica se um horário está entre um intervalo
 */
export const isTimeInRange = (time: string, startTime: string, endTime: string): boolean => {
    const [hour, min] = time.split(':').map(Number);
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const timeMinutes = hour * 60 + min;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
};

/**
 * Formata horário para exibição
 */
export const formatTime = (time: string): string => {
    const [hour, min] = time.split(':');
    return `${hour}:${min}`;
};

/**
 * Converte horário para minutos desde meia-noite
 */
export const timeToMinutes = (time: string): number => {
    const [hour, min] = time.split(':').map(Number);
    return hour * 60 + min;
};

/**
 * Converte minutos desde meia-noite para horário
 */
export const minutesToTime = (minutes: number): string => {
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
};
