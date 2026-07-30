import React from 'react';

const NOTICE_STORAGE_PREFIX = 'agenda_monthly_payment_notice_';

const getTodayKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const shouldShowMonthlyNotice = () => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('showPaymentNotice') === '1') return true;

    const now = new Date();
    return now.getDate() === 1;
};

export const MonthlyPaymentNotice: React.FC = () => {
    const [isVisible, setIsVisible] = React.useState(false);
    const todayKey = React.useMemo(() => getTodayKey(), []);

    React.useEffect(() => {
        if (!shouldShowMonthlyNotice()) return;

        const dismissedToday = localStorage.getItem(`${NOTICE_STORAGE_PREFIX}${todayKey}`);
        setIsVisible(dismissedToday !== 'dismissed');
    }, [todayKey]);

    const handleDismiss = () => {
        localStorage.setItem(`${NOTICE_STORAGE_PREFIX}${todayKey}`, 'dismissed');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <section className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
            <div className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5 text-amber-600 dark:text-amber-300">
                    payments
                </span>

                <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold uppercase tracking-wide">
                        Lembrete de mensalidade
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed">
                        Olá! A mensalidade de uso do sistema está vencendo. Para manter o acesso ativo e garantir a continuidade dos atendimentos, solicitamos a regularização dentro do prazo combinado. Em caso de pendência após o período de avaliação, o acesso poderá ser temporariamente suspenso até a regularização.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleDismiss}
                    className="rounded-md p-1.5 text-amber-700 transition-colors hover:bg-amber-100 hover:text-amber-950 dark:text-amber-200 dark:hover:bg-amber-900"
                    title="Fechar aviso"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>
            </div>
        </section>
    );
};
