import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { formatDateToYYYYMMDD } from '../../utils/dateUtils';

interface DateSelectorProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    isToday: boolean;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onDateChange, isToday }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Helpers
    const getDateLabel = () => {
        const todayStr = new Date().toLocaleDateString('pt-BR');
        const dateStr = selectedDate.toLocaleDateString('pt-BR');

        if (dateStr === todayStr) return 'Hoje';

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (dateStr === yesterday.toLocaleDateString('pt-BR')) return 'Ontem';

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (dateStr === tomorrow.toLocaleDateString('pt-BR')) return 'Amanhã';

        return selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
    };

    const handleToggle = (e: React.MouseEvent) => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 8,
                left: rect.left
            });
        }
        setIsOpen(!isOpen);
    };

    const navigateDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        onDateChange(newDate);
    };

    const handleQuickSelect = (offset: number) => {
        const date = new Date();
        date.setDate(date.getDate() + offset);
        onDateChange(date);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Logic to close simple popover
            if (isOpen && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                // Check if click is inside portal... bit harder cleanly without refs.
                // Simple trick: check if target is inside .date-selector-portal
                const target = event.target as HTMLElement;
                if (!target.closest('.date-selector-portal')) {
                    setIsOpen(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className={`
                    inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
                    transition-all duration-300 ease-out active-click shadow-sm border
                    ${isToday
                        ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        : 'bg-accent-orange/10 text-accent-orange border-accent-orange/30 hover:bg-accent-orange/20'
                    }
                `}
            >
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                <span>{getDateLabel()}</span>
                <span className={`material-symbols-outlined text-sm transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>

            {/* Portal Dropdown */}
            {isOpen && ReactDOM.createPortal(
                <div
                    className={`
                        date-selector-portal
                        fixed z-[9999]
                        bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl
                        overflow-hidden min-w-[300px] animate-in fade-in zoom-in-95 duration-200
                    `}
                    style={{
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`
                    }}
                >
                    <div className="p-4">
                        {/* Header Day */}
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => navigateDate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <div className="text-center">
                                <p className="font-bold text-slate-800 dark:text-white capitalize">
                                    {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
                                </p>
                                <p className="text-xs text-slate-500 font-medium">
                                    {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <button onClick={() => navigateDate(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => handleQuickSelect(-1)} className="p-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 rounded-lg">ONTEM</button>
                            <button onClick={() => handleQuickSelect(0)} className="p-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-lg">HOJE</button>
                            <button onClick={() => handleQuickSelect(1)} className="p-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 rounded-lg">AMANHÃ</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
