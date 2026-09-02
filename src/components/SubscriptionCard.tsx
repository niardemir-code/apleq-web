import React, { useState } from 'react';
import { 
  Subscription, 
  Member, 
  getMemberPlatformInfo, 
  getMemberContributionAmount,
  getCurrencyFlag,
  getCurrencySymbol
} from '../types';
import { PlatformIconBadge } from '../utils/icons';
import { PlatformBadge } from './PlatformBadge';
import { CurrencyFlag } from './CurrencyFlag';
import { useCurrency } from '../context/CurrencyContext';
import confetti from 'canvas-confetti';
import { 
  Users, 
  Calendar, 
  MoreVertical, 
  CheckCircle2, 
  UserPlus, 
  Edit2, 
  Trash2,
  Bell
} from 'lucide-react';

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: (sub: Subscription) => void;
  onDelete: (subId: string) => void;
  onManageMembers: (sub: Subscription) => void;
  onToggleMemberPayment: (subId: string, members: Member[], memberId: string) => Promise<void>;
  onMarkAllPaid: (subId: string, members: Member[]) => Promise<void>;
  ownerName?: string;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onEdit,
  onDelete,
  onManageMembers,
  onMarkAllPaid,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { convertToEur, isEur, getRateFor } = useCurrency();

  // Multi-currency calculations
  const originalCurrency = subscription.currency || 'EUR';
  const isForeign = !isEur(originalCurrency);
  const totalCostOriginal = subscription.cost;
  const period = subscription.billingPeriod || (subscription.billingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY');
  const periodMonths = period === 'YEARLY' ? 12 : period === 'SEMI_ANNUAL' ? 6 : period === 'QUARTERLY' ? 3 : 1;
  const periodLabel = period === 'YEARLY' ? 'Año' : period === 'SEMI_ANNUAL' ? 'Semestre' : period === 'QUARTERLY' ? 'Trimestre' : 'Mes';
  const periodShort = period === 'YEARLY' ? 'año' : period === 'SEMI_ANNUAL' ? 'sem' : period === 'QUARTERLY' ? 'trim' : 'mes';

  const rawMonth = subscription.billingMonth || (subscription.renewalDate ? new Date(subscription.renewalDate).getMonth() + 1 : 1);
  const monthIndex = Math.min(12, Math.max(1, rawMonth)) - 1;
  const MONTH_NAMES_ES = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  const monthName = MONTH_NAMES_ES[monthIndex];
  const billingDateText = period === 'MONTHLY' 
    ? `Cobro el día ${subscription.billingDay || 1}` 
    : `Cobro el ${subscription.billingDay || 1} de ${monthName}`;

  // Cost converted to EUR in real-time
  const totalCostInEur = convertToEur(totalCostOriginal, originalCurrency);
  const monthlyGrossInEur = totalCostInEur / periodMonths;

  // Members contribution in EUR
  const members = subscription.members || [];
  const sortedMembers = [...members].sort((a, b) => {
    const da = a.nextPaymentDate ? new Date(a.nextPaymentDate).getTime() : Infinity;
    const db = b.nextPaymentDate ? new Date(b.nextPaymentDate).getTime() : Infinity;
    return da - db;
  });
  const totalMemberIncomeInEur = members.reduce((sum, m) => {
    const mInfo = getMemberPlatformInfo(subscription, m);
    const mAmount = getMemberContributionAmount(subscription, m);
    const mPeriodMonths = mInfo.period === 'YEARLY' ? 12 : mInfo.period === 'SEMI_ANNUAL' ? 6 : mInfo.period === 'QUARTERLY' ? 3 : 1;
    return sum + (convertToEur(mAmount, mInfo.currency || 'EUR') / mPeriodMonths);
  }, 0);
  const monthlyMemberIncomeInEur = totalMemberIncomeInEur;

  // Net Profit in EUR: (Aportaciones miembros en EUR) - (Coste de suscripción mensual en EUR)
  const netProfitInEur = monthlyMemberIncomeInEur - monthlyGrossInEur;
  const isProfit = netProfitInEur > 0.001;

  const allPaid = members.length > 0 && members.every((m) => m.isPaidThisMonth ?? (m.paymentStatus === 'paid'));

  const handleQuickMarkAllPaid = async () => {
    try {
      setIsUpdating(true);
      await onMarkAllPaid(subscription.id, members);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10B981', '#6366F1', '#3B82F6', '#F59E0B'],
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const displayName = subscription.platformName || subscription.name || 'Suscripción';
  const iconColor = subscription.iconColorHex || subscription.color || '#1285FA';

  return (
    <div
      id={`subscription-card-${subscription.id}`}
      className="group relative rounded-3xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/90 hover:bg-slate-900/70 shadow-xl shadow-black/20 transition-all duration-200 flex flex-col justify-between overflow-hidden"
    >
      {/* Top Brand Color Strip */}
      <div
        className="h-1.5 w-full transition-all duration-300"
        style={{ backgroundColor: iconColor }}
      />

      <div className="p-5 flex-1 flex flex-col justify-between">
        {/* Card Header matching Android Row */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <PlatformIconBadge
                key={`card-icon-${subscription.id}-${subscription.customImageUri || ''}-${subscription.iconType || ''}`}
                platformName={displayName}
                iconType={subscription.iconType}
                iconKey={subscription.iconKey}
                customImageUri={subscription.customImageUri}
                customImageBase64={subscription.customImageBase64}
                iconColorHex={iconColor}
                sizeClass="w-13 h-13"
                iconSizeClass="w-6 h-6"
                roundedClass="rounded-2xl"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-white tracking-tight truncate">
                    {displayName}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                    {periodLabel}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800/60 text-slate-400">
                    {subscription.category || 'Streaming'}
                  </span>
                </div>
                {subscription.mainUserName && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    Titular: <span className="text-slate-300 font-medium">{subscription.mainUserName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Actions Menu Trigger */}
            <div className="relative shrink-0">
              <button
                id={`btn-menu-${subscription.id}`}
                onClick={() => setShowMenu(!showMenu)}
                type="button"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                aria-label="Opciones"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => {
                      setShowMenu(false);
                      setConfirmDelete(false);
                    }} 
                  />
                  <div className="absolute right-0 mt-1 w-52 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-30 overflow-hidden">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setConfirmDelete(false);
                        onManageMembers(subscription);
                      }}
                      type="button"
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>Gestionar miembros</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setConfirmDelete(false);
                        onEdit(subscription);
                      }}
                      type="button"
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4 text-slate-400" />
                      <span>Editar suscripción</span>
                    </button>
                    {members.length > 0 && !allPaid && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setConfirmDelete(false);
                          handleQuickMarkAllPaid();
                        }}
                        type="button"
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-950/40"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Marcar todos pagados</span>
                      </button>
                    )}
                    <div className="my-1 border-t border-slate-800" />
                    
                    {confirmDelete ? (
                      <div className="p-2.5 bg-rose-950/40 border-t border-rose-900/40 flex flex-col gap-2">
                        <p className="text-[11px] font-bold text-rose-300">
                          ¿Eliminar esta suscripción?
                        </p>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              setConfirmDelete(false);
                              onDelete(subscription.id);
                            }}
                            type="button"
                            className="flex-1 py-1.5 px-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-colors text-center shadow-md shadow-rose-900/40"
                          >
                            Sí, eliminar
                          </button>
                          <button
                            onClick={() => setConfirmDelete(false)}
                            type="button"
                            className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        type="button"
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Pricing Info Banner */}
          <div className="mt-3.5 p-3 rounded-2xl bg-slate-800/40 border border-slate-800/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                {billingDateText}
              </span>
            </div>
            <div className="text-right">
              <div className="font-extrabold text-sm sm:text-base text-slate-100 flex items-center justify-end gap-1.5">
                <CurrencyFlag currency={subscription.currency} size="xs" />
                <span>{totalCostOriginal.toFixed(2)} {getCurrencySymbol(subscription.currency)}/{periodShort}</span>
              </div>
              {isForeign && (
                <div 
                  className="text-[11px] font-bold text-emerald-400 mt-0.5 flex items-center justify-end gap-1.5"
                  title={`Tipo de cambio en vivo: 1 EUR ≈ ${getRateFor(originalCurrency).toFixed(2)} ${subscription.currency}`}
                >
                  <CurrencyFlag currency="EUR" size="xs" />
                  <span>≈ {totalCostInEur.toFixed(2)} €/{periodShort}</span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Breakdown: Aportan (X usuarios) vs Ganancia Neta */}
          <div className="mt-3.5 grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                Aportan ({members.length} miembro{members.length !== 1 ? 's' : ''})
              </span>
              <span className="text-base font-extrabold text-emerald-400 mt-0.5 block">
                +{totalMemberIncomeInEur.toFixed(2)} €/mes
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                Ganancia neta
              </span>
              <span className={`text-base font-extrabold mt-0.5 block ${isProfit ? 'text-emerald-400' : 'text-slate-200'}`}>
                {netProfitInEur > 0.001 ? `+${netProfitInEur.toFixed(2)}` : netProfitInEur.toFixed(2)} €/mes
              </span>
            </div>
          </div>
        </div>

        {/* Member Co-subscribers List */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Co-suscriptores ({members.length})
            </span>
          </div>

          {members.length === 0 ? (
            <div className="text-center py-3.5 px-2 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800/80">
              <p className="text-xs text-slate-500 mb-2 font-medium">
                Sin miembros aún en este grupo
              </p>
              <button
                onClick={() => onManageMembers(subscription)}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Añadir miembro</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {sortedMembers.map((member) => {
                const memberDisplayName = member.memberName || member.name || 'Miembro';
                const memberPlatform = member.sharingPlatform || member.platform || '';
                const memberCost = getMemberContributionAmount(subscription, member);

                let memberCardBg = 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800/70';
                if (member.isPendingRemoval) {
                  memberCardBg = 'bg-rose-950/30 border-rose-500/80 text-rose-200';
                } else if (member.isPendingPayment) {
                  memberCardBg = 'bg-amber-950/30 border-amber-500/80 text-amber-200';
                } else if (member.isPendingRegistration) {
                  memberCardBg = 'bg-sky-950/30 border-sky-500/80 text-sky-200';
                }

                return (
                  <div
                    key={member.id}
                    className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 transition-colors ${memberCardBg}`}
                  >
                    {/* Member Name & Sharing Platform */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">
                        {memberDisplayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <p className="text-xs font-bold text-white truncate">
                          {memberDisplayName}
                        </p>
                        <PlatformBadge platform={memberPlatform} size="sm" />
                        {member.notes && member.notes.trim() && (
                          <span 
                            className="text-[11px] font-medium text-slate-400 truncate max-w-[130px]" 
                            title={`Notas o perfil asignado: ${member.notes.trim()}`}
                          >
                            ({member.notes.trim()})
                          </span>
                        )}
                        {member.isPendingRemoval && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500 text-white">
                            Eliminar
                          </span>
                        )}
                        {member.isPendingPayment && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                            Pendiente
                          </span>
                        )}
                        {member.isPendingRegistration && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-sky-500 text-white">
                            Alta
                          </span>
                        )}
                        {member.nextPaymentDate && (
                          <span 
                            title={`Próximo pago: ${member.nextPaymentDate}${member.paymentFrequencyValue ? ` (cada ${member.paymentFrequencyValue} ${member.paymentFrequencyUnit || 'meses'})` : ''}${member.enableAlarm ? ` | Alarma: ${member.alarmUnit === 'same_day' || member.alarmValue === 0 || member.alarmDaysBefore === 0 ? 'El mismo día' : `${member.alarmValue ?? member.alarmDaysBefore ?? 3} ${member.alarmUnit || 'días'} antes`}` : ''}`}
                            className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-900/60 text-slate-300 border border-slate-700/60"
                          >
                            <Calendar className="w-2.5 h-2.5 text-blue-400" />
                            <span>{new Date(member.nextPaymentDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</span>
                            {member.enableAlarm && (
                              <Bell className="w-2 h-2 text-blue-400 fill-blue-400 ml-0.5" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Monthly Contribution Money */}
                    {(() => {
                      const mInfo = getMemberPlatformInfo(subscription, member);
                      return (
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1.5">
                            <CurrencyFlag currency={mInfo.currency} size="xs" />
                            <span>+{memberCost.toFixed(2)} {getCurrencySymbol(mInfo.currency)}/{mInfo.periodShort}</span>
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Button: Gestionar */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={() => onManageMembers(subscription)}
            type="button"
            className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-200 text-xs font-bold transition-colors"
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>Gestionar ({members.length} miembros)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
