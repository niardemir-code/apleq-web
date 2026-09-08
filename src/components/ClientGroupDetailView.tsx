import { useState } from 'react';
import {
  Subscription,
  getMemberPlatformInfo,
  getMemberContributionAmount,
  resolveMemberNextPaymentDate,
} from '../types';
import { leaveGroupCall } from '../lib/firebase';

interface ClientGroupDetailViewProps {
  group: Subscription | null;
  currentUid: string;
  onBackToList?: () => void;
  isMobile?: boolean;
}

function formatDateDMY(iso: string): string {
  if (!iso) return '';
  const parts = String(iso).split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return iso;
}

export function ClientGroupDetailView({ group, currentUid, onBackToList, isMobile }: ClientGroupDetailViewProps) {
  const [isConfirmingLeave, setIsConfirmingLeave] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

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
  const nextPayment = formatDateDMY(myMember ? resolveMemberNextPaymentDate(group, myMember) : '');
  const isPaid = myMember ? !myMember.isPendingPayment : false;

  const handleConfirmLeave = async () => {
    setIsLeaving(true);
    setLeaveError(null);
    try {
      await leaveGroupCall(group.userId, String(group.id));
      setIsConfirmingLeave(false);
      if (onBackToList) onBackToList();
    } catch (e: any) {
      setLeaveError(e?.message || 'No se pudo salir del grupo. Inténtalo de nuevo.');
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-5 sm:p-6">
      {isMobile && onBackToList && (
        <button type="button" onClick={onBackToList} className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-3 cursor-pointer">
          ← Volver
        </button>
      )}
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-black text-foreground truncate">{title}</h2>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
          Cliente
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2.5">
        {group.showMainUserToMembers && group.mainUserName && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Titular / Usuario principal</span>
            <span className="font-bold text-foreground text-right">{group.mainUserName}</span>
          </div>
        )}
        {platform && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Plataforma de compartición</span>
            <span className="font-bold text-foreground text-right">{platform}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tu parte</span>
          <span className="font-black text-foreground text-right">{amount.toFixed(2)} €</span>
        </div>
        {nextPayment && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Próximo pago</span>
            <span className="font-bold text-foreground text-right">{nextPayment}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Estado de pago</span>
          <span className={`font-bold text-right ${isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {isPaid ? 'Pagado' : 'Pendiente'}
          </span>
        </div>
      </div>

      <div className="mt-3 p-3 rounded-2xl bg-muted/40 border border-border">
        <p className="text-xs font-bold text-foreground">Tu alarma</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Próximamente.</p>
      </div>

      <div className="mt-3 p-3 rounded-2xl bg-muted/40 border border-border">
        <p className="text-xs font-bold text-foreground">Mensajes con el gestor</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Próximamente.</p>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => { setLeaveError(null); setIsConfirmingLeave(true); }}
          className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
        >
          Salir de este grupo
        </button>
      </div>

      {isConfirmingLeave && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => { if (!isLeaving) setIsConfirmingLeave(false); }}
        >
          <div
            className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-black text-foreground mb-2">¿Salir de {title}?</h2>
            <p className="text-xs text-muted-foreground">
              Dejarás de participar en este grupo.
            </p>
            {leaveError && (
              <p className="text-xs mt-3 font-bold text-rose-600 dark:text-rose-400">
                {leaveError}
              </p>
            )}
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setIsConfirmingLeave(false)}
                disabled={isLeaving}
                className="flex-1 py-3 rounded-2xl bg-muted/60 hover:bg-muted border border-border text-sm font-bold text-foreground transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                disabled={isLeaving}
                className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-sm font-bold text-white transition-colors cursor-pointer"
              >
                {isLeaving ? 'Saliendo...' : 'Salir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
