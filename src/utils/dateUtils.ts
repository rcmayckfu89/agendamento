
/**
 * Utility functions for date manipulation to avoid UTC shift issues.
 */

/**
 * Formats a Date object to YYYY-MM-DD string using local time components.
 * This prevents the common bug where toISOString() shifts the date by one day
 * in negative timezones when called late at night.
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Returns today's date string in YYYY-MM-DD format using local time.
 */
export const getTodayLocalStr = (): string => {
    return formatDateToYYYYMMDD(new Date());
};

/**
 * Parses a YYYY-MM-DD string into a local Date object.
 */
export const parseYYYYMMDDToDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};
