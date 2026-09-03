import React from 'react';
import {
  Subscription,
  getMemberPlatformInfo,
  getMemberContributionAmount,
  resolveMemberNextPaymentDate,
} from '../types';

interface ClientGroupDetailViewProps {
  group: Subscription | null;
  currentUid: string;
  onBackToList?: () => void;
  isMobile?: boolean;
}

export function ClientGroupDetailView({ group, currentUid, onBackToList, isMobile }: ClientGroupDetailViewProps) {
  if (!group) {
    return (
      <div className="bg-card border border-border rounded-3xl p-10 text-center">
        <p className="text-sm font-semibold text-muted-foreground">
          Selecciona un grupo de "Participo en" para ver sus detalles.
        </p>
      </div>
    );
  }

  const myMember = (group.members || []).find((m) => m.linkedUid === currentUid);
  const title = group.platformName || group.name || 'Grupo';
  const platform = myMember ? (getMemberPlatformInfo(group, myMember)?.name || '') : '';
  const amount = myMember ? getMemberContributionAmount(group, myMember) : 0;
  const nextPayment = myMember ? resolveMemberNextPaymentDate(group, myMember) : '';
  const isPaid = myMember?.isPaidThisMonth === true;

  const row = (label: string, value: React.ReactNode) => (
    <div key={label} className="flex items-center justify-between text-sm py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold text-foreground text-right">{value}</span>
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-3xl p-5 sm:p-6">
      {isMobile && onBackToList && (
        <button
          type="button"
          onClick={onBackToList}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-3 cursor-pointer"
        >
          ← Volver
        </button>
      )}
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-black text-foreground truncate">{title}</h2>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
          Cliente
        </span>
      </div>

      <div className="divide-y divide-border">
        {platform && row('Plataforma', platform)}
        {row('Tu parte', `${amount.toFixed(2)} €`)}
        {nextPayment && row('Próximo pago', nextPayment)}
        {row(
          'Estado de pago',
          <span className={isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
            {isPaid ? 'Pagado' : 'Pendiente'}
          </span>
        )}
      </div>

      <div className="mt-5 p-3 rounded-2xl bg-muted/40 border border-border">
        <p className="text-xs font-bold text-foreground">Tu alarma</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Próximamente.</p>
      </div>

      <div className="mt-3 p-3 rounded-2xl bg-muted/40 border border-border">
        <p className="text-xs font-bold text-foreground">Mensajes con el gestor</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Próximamente.</p>
      </div>
    </div>
  );
}
