import { Subscription } from '../types';
import { ExternalLink } from 'lucide-react';

interface ParticipatingGroupsProps {
  groups: Subscription[];
  currentUid: string;
  indexRequiredUrl?: string | null;
}

export function ParticipatingGroups({ groups, currentUid, indexRequiredUrl }: ParticipatingGroupsProps) {
  if (!groups || groups.length === 0) {
    if (indexRequiredUrl) {
      return (
        <div className="mt-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-foreground">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                Índice de Firestore requerido para «Participo en»
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Para consultar grupos donde participas como miembro, Firebase requiere habilitar el índice de grupo de colecciones (1 clic).
              </p>
            </div>
            <a
              href={indexRequiredUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors shrink-0"
            >
              Habilitar índice
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="mt-10">
      <h2 className="text-base font-black text-foreground mb-3 flex items-center gap-2">
        Participo en
        <span className="text-xs font-bold text-muted-foreground">({groups.length})</span>
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => {
          const myMember = (group.members || []).find((m) => m.linkedUid === currentUid);
          const platform = myMember?.sharingPlatform || '';
          const amount = Number(myMember?.contributionAmount ?? (myMember as any)?.amount ?? 0);
          const nextPayment = myMember?.nextPaymentDate
            ? String(myMember.nextPaymentDate).split('T')[0]
            : '';
          const title = group.platformName || group.name || 'Grupo';
          return (
            <div key={String(group.id)} className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-2 gap-2">
                <h3 className="text-sm font-black text-foreground truncate">{title}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                  Cliente
                </span>
              </div>
              {platform && (
                <p className="text-xs text-muted-foreground mb-0.5">
                  Plataforma: <span className="text-foreground font-semibold">{platform}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground mb-0.5">
                Tu parte: <span className="text-foreground font-bold">{amount.toFixed(2)} €</span>
              </p>
              {nextPayment && (
                <p className="text-xs text-muted-foreground">
                   Próximo pago: <span className="text-foreground font-semibold">{nextPayment}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
