import React, { useState } from 'react';
import { 
  Subscription, 
  Member, 
  parsePlatformPricing, 
  formatPeriodShort, 
  getMemberPlatformInfo, 
  getMemberContributionAmount,
  getCurrencySymbol,
  getCurrencyFlag
} from '../types';
import { PlatformIconBadge } from '../utils/icons';
import { PlatformBadge } from './PlatformBadge';
import { CurrencyFlag } from './CurrencyFlag';
import { useSharingPlatforms } from '../context/SharingPlatformsContext';
import { useCurrency } from '../context/CurrencyContext';
import confetti from 'canvas-confetti';
import { 
  Users, 
  CreditCard, 
  Edit2, 
  Trash2, 
  UserPlus, 
  Send,
  CheckCircle2,
  FileText,
  ArrowLeft,
  Share2,
  Bell,
  Calendar,
  Hourglass
} from 'lucide-react';
import { createInvite, deleteInvite, formatInviteCode } from '../services/subscriptionService';

interface SubscriptionDetailViewProps {
  subscription: Subscription | null;
  onEdit: (sub: Subscription) => void;
  onDelete: (subId: string) => void;
  onManageMembers: (sub: Subscription, memberId?: string) => void;
  onToggleMemberPayment: (subId: string, members: Member[], memberId: string) => Promise<void>;
  onMarkAllPaid: (subId: string, members: Member[]) => Promise<void>;
  onUpdateSubscription?: (updatedSub: Subscription) => Promise<void>;
  onBackToList?: () => void;
  isMobile?: boolean;
}

export const SubscriptionDetailView: React.FC<SubscriptionDetailViewProps> = ({
  subscription,
  onEdit,
  onDelete,
  onManageMembers,
  onMarkAllPaid,
  onUpdateSubscription,
  onBackToList,
  isMobile,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmDeleteMemberId, setConfirmDeleteMemberId] = useState<string | number | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [invMsg, setInvMsg] = useState('');
  const { convertToEur, isEur, getRateFor } = useCurrency();
  const { platforms } = useSharingPlatforms();

  if (!subscription) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-card border border-border rounded-3xl min-h-[420px]">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-4 shadow-md">
          <CreditCard className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          Selecciona una suscripción
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          Haz clic en cualquier suscripción de la lista para ver todos sus detalles, co-suscriptores y balance financiero.
        </p>
      </div>
    );
  }

  // Direct deletion of a member without opening the modal
  const handleDirectDeleteMember = (memberId: string | number) => {
    if (!subscription || !onUpdateSubscription) return;
    setConfirmDeleteMemberId(null);
    const target = (subscription.members || []).find(
      (m) => String(m.id) === String(memberId)
    );
    const updatedMembers = (subscription.members || []).filter(
      (m) => String(m.id) !== String(memberId)
    );
    if (target?.inviteCode) {
      deleteInvite(target.inviteCode);
    }
    onUpdateSubscription({
      ...subscription,
      members: updatedMembers,
    }).catch((err) => {
      console.error('Error deleting member directly:', err);
    });
  };

  const handleGenerateInvite = async () => {
    if (!subscription || !onUpdateSubscription) return;
    try {
      setInvMsg('Generando...');
      const newMemberId = String(Date.now() * 1000 + Math.floor(Math.random() * 1000));
      const code = await createInvite(subscription, newMemberId);
      const reservedMember = {
        id: newMemberId,
        memberName: 'Invitado (pendiente)',
        name: 'Invitado (pendiente)',
        amount: 0,
        status: 'pending',
        isPendingRegistration: true,
        inviteCode: code,
        linkedUid: null,
      } as unknown as Member;
      await onUpdateSubscription({
        ...subscription,
        members: [...(subscription.members || []), reservedMember],
      });
      setInviteCode(code);
      setInvMsg('Invitación creada. Aparece en la lista como "Pendiente alta".');
    } catch (e) {
      console.warn('Error al crear invitación:', e);
      setInvMsg('No se pudo generar el código. Revisa los permisos de Firestore.');
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(formatInviteCode(inviteCode));
      setInvMsg('¡Copiado!');
    } catch {
      setInvMsg('No se pudo copiar');
    }
  };

  // Multi-currency and period calculations
  const originalCurrency = subscription.currency || 'EUR';
  const totalCostOriginal = subscription.cost;
  const period = subscription.billingPeriod || (subscription.billingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY');
  const periodMonths = period === 'YEARLY' ? 12 : period === 'SEMI_ANNUAL' ? 6 : period === 'QUARTERLY' ? 3 : 1;
  const periodLabel = period === 'YEARLY' ? 'Anual' : period === 'SEMI_ANNUAL' ? 'Semestral' : period === 'QUARTERLY' ? 'Trimestral' : 'Mensual';

  const totalCostInEur = convertToEur(totalCostOriginal, originalCurrency);
  const monthlyGrossInEur = totalCostInEur / periodMonths;
  const isForeign = !isEur(originalCurrency);

  const members = subscription.members || [];
  const capacity = subscription.freeSlots ?? 0;
  const isFull = capacity > 0 && members.length >= capacity;
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

  // Net Profit: (Aportaciones miembros en EUR) - (Coste mensual en EUR)
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
  const renewalDisplayText = period === 'MONTHLY' 
    ? `Día ${subscription.billingDay || 1}` 
    : `${subscription.billingDay || 1} de ${monthName}`;

  const displayName = subscription.platformName || subscription.name || 'Suscripción';
  const iconColor = subscription.iconColorHex || subscription.color || '#1285FA';

  // Configured sharing platforms for this subscription
  const configuredPlatforms = parsePlatformPricing(subscription.platformPricing);

  const getPlatformColor = (name: string): string => {
    const found = platforms.find((p) => p.name.toLowerCase() === name.toLowerCase());
    return found?.colorHex || '#1285FA';
  };

  return (
    <div className="bg-card border border-border rounded-3xl shadow-lg flex flex-col transition-colors relative">
      {/* Top Accent Strip */}
      <div
        className="h-2 w-full rounded-t-3xl transition-all duration-300"
        style={{ backgroundColor: iconColor }}
      />

      <div className="p-6 space-y-6">
        {/* Top Navigation for mobile & Main Header */}
        <div>
          {isMobile && onBackToList && (
            <button
              onClick={onBackToList}
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-600 mb-4 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la lista</span>
            </button>
          )}

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            {/* Service Identity */}
            <div className="flex items-start gap-4 min-w-0">
              <button
                type="button"
                onClick={() => onEdit(subscription)}
                className="relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-2xl shrink-0"
                title="Editar suscripción y cambiar icono"
              >
                <PlatformIconBadge
                  key={`detail-icon-${subscription.id}-${subscription.customImageUri || ''}-${subscription.iconType || ''}`}
                  platformName={displayName}
                  iconType={subscription.iconType}
                  iconKey={subscription.iconKey}
                  customImageUri={subscription.customImageUri}
                  customImageBase64={subscription.customImageBase64}
                  iconColorHex={iconColor}
                  sizeClass="w-16 h-16"
                  iconSizeClass="w-8 h-8"
                  roundedClass="rounded-2xl"
                />
                <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <Edit2 className="w-5 h-5" />
                </div>
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                    {displayName}
                  </h1>

                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-muted text-foreground border border-border">
                    {periodLabel}
                  </span>

                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
                    {subscription.category || 'Streaming'}
                  </span>
                </div>

                {subscription.mainUserName && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Titular / Usuario principal:{' '}
                    <span className="text-foreground font-semibold">{subscription.mainUserName}</span>
                    {subscription.mainUserContact && (
                      <span className="text-muted-foreground ml-1">({subscription.mainUserContact})</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions Header Toolbar */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="btn-detail-edit"
                onClick={() => onEdit(subscription)}
                type="button"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-muted/60 hover:bg-muted border border-border text-foreground text-xs font-bold transition-colors cursor-pointer"
                title="Editar suscripción"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Financial & Renewal Stat Boxes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Coste Suscripción */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Coste total
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-foreground mt-1 flex items-center gap-1.5">
              <CurrencyFlag currency={originalCurrency} size="sm" />
              <span>{totalCostOriginal.toFixed(2)} {getCurrencySymbol(originalCurrency)}</span>
              <span className="text-xs font-normal text-muted-foreground ml-1">/{periodLabel.toLowerCase()}</span>
            </p>
            {isForeign ? (
              <p 
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5"
                title={`Tipo de cambio: 1 EUR ≈ ${getRateFor(originalCurrency).toFixed(2)} ${originalCurrency}`}
              >
                <CurrencyFlag currency="EUR" size="xs" />
                <span>≈ {totalCostInEur.toFixed(2)} €/{periodLabel.toLowerCase()}
                {period !== 'MONTHLY' && ` (${monthlyGrossInEur.toFixed(2)} €/mes)`}</span>
              </p>
            ) : (
              period !== 'MONTHLY' && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  ≈ {monthlyGrossInEur.toFixed(2)} €/mes
                </p>
              )
            )}
          </div>

          {/* Aportan */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Aportan ({members.length} usuario{members.length !== 1 ? 's' : ''})
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              +{totalMemberIncomeInEur.toFixed(2)} €/mes
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {members.length} co-suscriptores activos
            </p>
          </div>

          {/* Ganancia neta */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Ganancia neta
            </span>
            <p className={`text-lg sm:text-xl font-extrabold mt-1 ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
              {netProfitInEur > 0.001 ? `+${netProfitInEur.toFixed(2)}` : netProfitInEur.toFixed(2)} €/mes
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isProfit ? 'Superávit mensual' : 'Coste neto mensual'}
            </p>
          </div>

          {/* Renovación */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Renovación
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {renewalDisplayText}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {period === 'MONTHLY' ? 'Mensual' : `Renovación ${periodLabel.toLowerCase()}`}
            </p>
          </div>
        </div>

        {/* Configured Sharing Platforms & Prices */}
        {configuredPlatforms.length > 0 && (
          <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              <Share2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Plataformas de compartición configuradas ({configuredPlatforms.length})</span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {configuredPlatforms.map((cp) => {
                const color = getPlatformColor(cp.platformName);
                return (
                  <div
                    key={cp.platformName}
                    className="py-2.5 px-4 rounded-xl bg-card border border-border flex items-center justify-between gap-4 shadow-xs min-w-[240px] flex-1 sm:flex-initial"
                  >
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/10"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-bold text-foreground whitespace-nowrap">
                        {cp.platformName}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0 flex items-center gap-1.5">
                      <CurrencyFlag currency={cp.currency} size="xs" />
                      <span>{cp.pricePerUser.toFixed(2)} {getCurrencySymbol(cp.currency)}/{formatPeriodShort(cp.period || subscription.billingPeriod)}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Co-suscriptores List Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
                Co-suscriptores ({members.length})
              </h3>
            </div>

            {members.length > 0 && !allPaid && (
              <button
                onClick={handleQuickMarkAllPaid}
                disabled={isUpdating}
                type="button"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Marcar todos pagados</span>
              </button>
            )}
          </div>

          {members.length === 0 ? (
            <div className="p-6 rounded-2xl bg-muted/30 border border-border text-center">
              <p className="text-xs text-muted-foreground font-medium">
                No hay ningún co-suscriptor añadido en esta suscripción.
              </p>
              <button
                onClick={() => onManageMembers(subscription)}
                type="button"
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Añadir miembros</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedMembers.map((member, index) => {
                const memberDisplayName = member.memberName || member.name || 'Miembro';
                const memberPlatform = member.sharingPlatform || member.platform || '';
                const memberCost = getMemberContributionAmount(subscription, member);
                const memberPlatformInfo = getMemberPlatformInfo(subscription, member);

                let memberCardClasses = 'bg-card hover:bg-muted/40 border-border text-foreground';
                let avatarClasses = 'bg-muted text-foreground border-border';

                if (member.isPendingRemoval) {
                  memberCardClasses = 'bg-rose-500/10 hover:bg-rose-500/15 border-2 border-rose-500 text-rose-700 dark:text-rose-200';
                  avatarClasses = 'bg-rose-500 text-white border-rose-600';
                } else if (member.isPendingPayment) {
                  memberCardClasses = 'bg-amber-500/10 hover:bg-amber-500/15 border-2 border-amber-500 text-amber-800 dark:text-amber-200';
                  avatarClasses = 'bg-amber-500 text-white border-amber-600';
                } else if (member.isPendingRegistration) {
                  memberCardClasses = 'bg-sky-500/10 hover:bg-sky-500/15 border-2 border-sky-500 text-sky-800 dark:text-sky-200';
                  avatarClasses = 'bg-sky-500 text-white border-sky-600';
                }

                return (
                  <div
                    key={member.id}
                    onClick={() => onManageMembers(subscription, member.id)}
                    className={`w-full text-left p-3 sm:p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all duration-150 group cursor-pointer shadow-xs hover:shadow-sm active:scale-[0.99] ${memberCardClasses}`}
                    title={`Haz clic para editar los datos de ${memberDisplayName}`}
                  >
                    {/* Left: Avatar + Member Name + Platform Badge + Status Alert Tag */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border transition-colors ${avatarClasses}`}>
                        {memberDisplayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                        <span className="text-sm font-bold text-foreground truncate max-w-[180px] sm:max-w-[240px]">
                          {memberDisplayName}
                        </span>
                        <PlatformBadge platform={memberPlatform} size="sm" />
                        {member.notes && member.notes.trim() && (
                          <span 
                            className="text-xs font-medium text-muted-foreground truncate max-w-[150px] sm:max-w-[200px]" 
                            title={`Notas o perfil asignado: ${member.notes.trim()}`}
                          >
                            ({member.notes.trim()})
                          </span>
                        )}

                        {/* Discreet Status Tag if user has an active alert/state */}
                        {member.isPendingRemoval && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-500 text-white shadow-2xs">
                            <Trash2 className="w-2.5 h-2.5" />
                            <span>Pendiente baja</span>
                          </span>
                        )}
                        {member.isPendingPayment && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 shadow-2xs">
                            <Hourglass className="w-2.5 h-2.5" />
                            <span>Pendiente pago</span>
                          </span>
                        )}
                        {member.isPendingRegistration && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-sky-500 text-white shadow-2xs">
                            <UserPlus className="w-2.5 h-2.5" />
                            <span>Pendiente alta</span>
                          </span>
                        )}
                        {member.inviteCode && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                            title="Copiar código de invitación"
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(formatInviteCode(member.inviteCode!)); }}
                          >
                            {formatInviteCode(member.inviteCode)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Center: Next payment date & alarm if configured */}
                    {member.nextPaymentDate && (
                      <div 
                        title={`Próximo pago: ${member.nextPaymentDate}${member.paymentFrequencyValue ? ` (cada ${member.paymentFrequencyValue} ${member.paymentFrequencyUnit || 'meses'})` : ''}${member.enableAlarm ? ` | Alarma: ${member.alarmUnit === 'same_day' || member.alarmValue === 0 || member.alarmDaysBefore === 0 ? 'El mismo día' : `${member.alarmValue ?? member.alarmDaysBefore ?? 3} ${member.alarmUnit || 'días'} antes`}` : ''}`}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-muted/80 text-muted-foreground border border-border shrink-0 self-start sm:self-center"
                      >
                        <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{new Date(member.nextPaymentDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</span>
                        {member.enableAlarm && (
                          <Bell className="w-2.5 h-2.5 text-blue-500 fill-blue-500 ml-0.5 shrink-0" />
                        )}
                      </div>
                    )}

                    {/* Right: Contribution Amount + Actions */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                      {/* Monthly Contribution Amount */}
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 min-w-[70px] text-right inline-flex items-center justify-end gap-1.5">
                        <CurrencyFlag currency={memberPlatformInfo.currency} size="xs" />
                        <span>+{memberCost.toFixed(2)} {getCurrencySymbol(memberPlatformInfo.currency)}/{memberPlatformInfo.periodShort}</span>
                      </span>

                      {/* Quick Edit & Delete Actions */}
                      <div className="flex items-center gap-0.5 border-l border-border pl-1.5 ml-0.5">
                        <button
                          id={`btn-detail-edit-member-${member.id}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onManageMembers(subscription, member.id);
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                          title="Editar usuario"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {confirmDeleteMemberId === member.id ? (
                          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-rose-500/10 border border-rose-500/30 ml-1">
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 px-1">¿Eliminar?</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDirectDeleteMember(member.id);
                              }}
                              className="py-0.5 px-2 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition-colors shadow-xs cursor-pointer active:scale-95"
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteMemberId(null);
                              }}
                              className="py-0.5 px-1.5 rounded-md bg-muted text-muted-foreground text-[10px] font-medium hover:bg-muted/80 cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            id={`btn-detail-delete-member-${member.id}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteMemberId(member.id);
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-500/10 active:scale-95 transition-all cursor-pointer"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Botón Añadir usuario debajo del último usuario */}
              <button
                id="btn-detail-add-member"
                onClick={() => { if (!isFull) onManageMembers(subscription); }}
                type="button"
                disabled={isFull}
                className={`w-full mt-2 py-3 px-4 rounded-2xl border-2 border-dashed border-blue-500/30 hover:border-blue-500 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] ${isFull ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
                title={isFull ? `Has alcanzado los ${capacity} huecos` : "Añadir un nuevo co-suscriptor"}
              >
                <UserPlus className="w-4 h-4 text-blue-500" />
                <span>Añadir usuario</span>
              </button>
              {isFull && (
                <p className="text-[11px] text-muted-foreground text-center mt-2">
                  Has alcanzado el número de huecos ({capacity}). Aumenta los huecos en la suscripción para añadir más.
                </p>
              )}

              {/* Invitar a un hueco libre */}
              {capacity > 0 && !isFull && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleGenerateInvite}
                    className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Invitar a un hueco</span>
                  </button>

                  {inviteCode && (
                    <div className="mt-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                      <p className="text-[11px] text-muted-foreground">Código de invitación (caduca en 7 días):</p>
                      <p className="text-lg font-black tracking-widest text-emerald-600 dark:text-emerald-400 my-1">
                        {formatInviteCode(inviteCode)}
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyInvite}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Copiar código
                      </button>
                    </div>
                  )}

                  {invMsg && (
                    <p className="text-[11px] text-muted-foreground text-center mt-1">{invMsg}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Additional Notes if present and non-empty */}
        {subscription.notes && subscription.notes.trim().length > 0 ? (
          <div className="p-4 rounded-2xl bg-muted/30 border border-border">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Notas de la suscripción</span>
            </div>
            <p className="text-xs text-foreground whitespace-pre-wrap">
              {subscription.notes.trim()}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
