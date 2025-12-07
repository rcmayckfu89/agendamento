/**
 * Utilitários para manipulação de datas
 */

/**
 * Verifica se uma data é hoje
 */
export const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
};

/**
 * Obtém as datas da semana baseado em uma data
 */
export const getWeekDates = (baseDate: Date): Date[] => {
    const dates: Date[] = [];
    const day = baseDate.getDay(); // 0 = Sunday
    const diff = baseDate.getDate() - day;

    for (let i = 0; i < 7; i++) {
        const d = new Date(baseDate);
        d.setDate(diff + i);
        d.setHours(0, 0, 0, 0);
        dates.push(d);
    }

    return dates;
};

/**
 * Formata uma data para o formato YYYY-MM-DD
 */
export const formatDateToISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Formata uma data para o formato brasileiro DD/MM/YYYY
 */
export const formatDateToBR = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Parse de string de data ISO para Date
 */
export const parseISODate = (dateStr: string): Date => {
    return new Date(dateStr + 'T00:00:00');
};

/**
 * Obtém o nome do dia da semana em português
 */
export const getDayName = (date: Date): string => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[date.getDay()];
};

/**
 * Obtém o nome curto do dia da semana
 */
export const getShortDayName = (date: Date): string => {
    const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    return days[date.getDay()];
};
