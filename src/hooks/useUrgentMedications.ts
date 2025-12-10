
import { useState, useEffect } from 'react';
import { medicationService } from '../services/medicationService';

export const useUrgentMedicationsCount = () => {
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchUrgentCount = async () => {
            try {
                const medications = await medicationService.getAll();

                // Only update state if component is still mounted
                if (!isMounted) return;

                // Count medications that are urgent (≤ 5 days or overdue)
                const urgentCount = medications.filter(med => {
                    if (med.daysUntilRenewal === undefined) return false;
                    return med.daysUntilRenewal <= 5;
                }).length;

                setCount(urgentCount);
            } catch (err) {
                console.error('Error fetching urgent medications count:', err);
                if (isMounted) setCount(0);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchUrgentCount();

        // Refresh count every 5 minutes
        const interval = setInterval(fetchUrgentCount, 5 * 60 * 1000);

        return () => {
            isMounted = false;
            clearInterval(interval);
            console.log('🔴 [useUrgentMedicationsCount] Cleanup - interval cleared');
        };
    }, []);

    return { count, isLoading };
};
