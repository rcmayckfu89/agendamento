import React, { useEffect, useState } from 'react';
import { StatData } from '../../types';

interface StatCardProps {
    data: StatData;
}

export const StatCard: React.FC<StatCardProps> = ({ data }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const percentage = data.total > 0 ? (data.current / data.total) * 100 : 0;
        const timer = setTimeout(() => setProgress(percentage), 100);
        return () => clearTimeout(timer);
    }, [data.current, data.total]);

    const isUrgent = data.category === 'Urgent';

    const colorStyles = {
        violet: {
            borderHover: 'hover:border-primary',
            textIcon: 'text-primary'
        },
        green: {
            borderHover: 'hover:border-accent',
            textIcon: 'text-accent'
        },
        sky: {
            borderHover: 'hover:border-sky-600',
            textIcon: 'text-sky-600'
        },
        destructive: {
            borderHover: 'hover:border-destructive',
            textIcon: 'text-destructive'
        }
    };

    const styles = isUrgent ? colorStyles.destructive : (colorStyles[data.colorClass as keyof typeof colorStyles] || colorStyles.violet);

    return (
        <div className={`group bg-card p-5 rounded-lg border border-border transition-all duration-300 animate-sync-slide ${isUrgent ? 'border-destructive/30 bg-destructive/5' : 'hover:border-primary shadow-sm hover:shadow-md'} active-click`}>
            <div className="flex justify-between items-start mb-6">
                <p className="font-bold text-[13px] uppercase tracking-[0.15em] text-muted-foreground font-display">
                    {data.category === 'Urgent' ? 'Demandas' : data.category === 'Doctor' ? 'Médico' : data.category === 'Nurse' ? 'Enfermeira' : 'Técnica'}
                </p>
                <span className={`material-symbols-outlined text-[28px] ${styles.textIcon}`}>
                    {data.icon}
                </span>
            </div>

            <div className="flex items-end justify-between">
                <div className="flex-1">
                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-5xl font-bold font-mono tracking-tighter ${isUrgent ? 'text-destructive' : 'text-foreground'}`}>
                            {data.current}
                        </span>
                        {!isUrgent && (
                            <span className="text-2xl font-mono text-muted-foreground opacity-50">
                                /{data.total}
                            </span>
                        )}
                    </div>
                    <p className="text-[14px] font-bold text-muted-foreground uppercase tracking-tight mt-1.5 truncate leading-tight">
                        {data.label}
                    </p>
                </div>

                {!isUrgent && (
                    <div className="relative w-12 h-12">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <circle
                                className="text-muted/10"
                                cx="18"
                                cy="18"
                                r="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                            <circle
                                className={`${isUrgent ? 'text-destructive' : 'text-accent'} transition-all duration-1000 ease-out`}
                                cx="18"
                                cy="18"
                                r="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray="100"
                                strokeDashoffset={100 - progress}
                                strokeLinecap="square"
                            />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
};