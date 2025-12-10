import { useState, useEffect } from 'react';

/**
 * Hook para debounce de valores
 * Evita chamadas excessivas em campos de busca
 */
export const useDebounce = <T,>(value: T, delay: number = 300): T => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
};
