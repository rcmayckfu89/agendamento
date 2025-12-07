import React, { useEffect, useState } from 'react';
import { StatData } from '../../types';

interface StatCardProps {
    data: StatData;
}

export const StatCard: React.FC<StatCardProps> = ({ data }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Animation effect for the chart
        const percentage = data.total > 0 ? (data.current / data.total) * 100 : 0;
        const timer = setTimeout(() => setProgress(percentage), 100);
        return () => clearTimeout(timer);
    }, [data.current, data.total]);

    const isUrgent = data.category === 'Urgent';

    // Tailwind does not support dynamic class names constructed at runtime (e.g. `hover:border-${color}-400`).
    // We map the color classes explicitly.
    const colorStyles = {
        violet: {
            borderHover: 'hover:border-violet-400',
            textGroupHover: 'group-hover:text-violet-500'
        },
        green: {
            borderHover: 'hover:border-green-400',
            textGroupHover: 'group-hover:text-green-500'
        },
        sky: {
            borderHover: 'hover:border-sky-400',
            textGroupHover: 'group-hover:text-sky-500'
        },
        destructive: {
            borderHover: 'hover:border-destructive/70',
            textGroupHover: ''
        }
    };

    const styles = isUrgent ? colorStyles.destructive : (colorStyles[data.colorClass as keyof typeof colorStyles] || colorStyles.violet);

    return (
        <div className={`group bg-card p-6 rounded-xl border border-border shadow-soft hover:shadow-soft-lg transition-all duration-300 transform hover:-translate-y-1 animate-scale-in ${isUrgent ? 'border-destructive/20' : ''} ${styles.borderHover}`}>
            <div className="flex justify-between items-start mb-4">
                <p className="font-semibold text-foreground">{data.category === 'Urgent' ? 'Urgentes do Dia' : data.category === 'Doctor' ? 'Médico' : data.category === 'Nurse' ? 'Enfermeira' : 'Técnica'}</p>
                <span className={`material-symbols-outlined transition-colors ${isUrgent ? 'text-destructive' : `text-muted-foreground ${styles.textGroupHover}`}`}>
                    {data.icon}
                </span>
            </div>
            <div className="flex items-end gap-4">
                <div className="flex-1">
                    <p className={`text-4xl font-bold tracking-tighter ${isUrgent ? 'text-destructive' : ''}`}>
                        {isUrgent ? data.current : `${data.current}/${data.total}`}
                    </p>
                    <p className="text-sm text-muted-foreground">{data.label}</p>
                </div>
                {isUrgent ? (
                    <div className="w-16 h-16 flex items-center justify-center">
                        <span className="material-symbols-outlined text-destructive text-5xl">emergency_home</span>
                    </div>
                ) : (
                    <div className="relative w-16 h-16">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path
                                className="text-muted/20"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                            <path
                                className={`${data.ringColorClass} chart-ring`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeWidth="3"
                                style={{ strokeDasharray: `${progress}, 100` }}
                            />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
};