import React from 'react';
import { useSystemLock } from '../../context/SystemLockContext';

const isForcedPreview = () => {
    return new URLSearchParams(window.location.search).get('showPaymentNotice') === '1';
};

export const MonthlyPaymentNotice: React.FC = () => {
    const { isPaymentNoticeVisible } = useSystemLock();
    const shouldShow = isForcedPreview() || isPaymentNoticeVisible;

    if (!shouldShow) return null;

    return (
        <section className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm animate-sync-slide dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
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
            </div>
        </section>
    );
};
