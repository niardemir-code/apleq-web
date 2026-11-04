import { 
  Subscription, 
  Member, 
  getMemberPlatformInfo, 
  getMemberContributionAmount, 
  getCurrencySymbol,
  resolveSubscriptionNextRenewalDate 
} from '../types';
import { t, tp } from '../i18n';

function alarmUnitWord(unit: string, n: number): string {
  const base = unit === 'hours' ? 'unitw.hour' : unit === 'weeks' ? 'unitw.week' : unit === 'months' ? 'unitw.month' : 'unitw.day';
  return tp(base, n);
}

export interface AppNotification {
  id: string;
  type: 'alarm' | 'overdue' | 'pending';
  subscriptionId: string;
  subscriptionName: string;
  subscriptionColor: string;
  memberId: string;
  memberName: string;
  memberContact?: string;
  sharingPlatform: string;
  amount: number;
  currency: string;
  currencySymbol: string;
  nextPaymentDate?: string;
  dueDateText: string;
  daysRemaining: number;
  status: 'upcoming' | 'today' | 'overdue';
  isRead: boolean;
  timestamp: string;
  alarmConfigText?: string;
  paymentMethod?: string;
  debtText?: string;
  unpaidCycles?: number;
}

const READ_NOTIFICATIONS_STORAGE_KEY = 'splitzy_read_notification_ids';

export function getReadNotificationIds(): string[] {
  try {
    const saved = localStorage.getItem(READ_NOTIFICATIONS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveReadNotificationIds(ids: string[]): void {
  try {
    localStorage.setItem(READ_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Error saving read notifications to localStorage', e);
  }
}

/**
 * Calculates lead time in days for an alarm unit and value
 */
export function getAlarmLeadTimeDays(value: number = 3, unit: string = 'days'): number {
  if (unit === 'same_day' || value === 0) {
    return 0;
  }
  const val = Math.max(0, value);
  switch (unit) {
    case 'hours':
      return val / 24;
    case 'weeks':
      return val * 7;
    case 'months':
      return val * 30;
    case 'same_day':
      return 0;
    case 'days':
    default:
      return val;
  }
}

/**
 * Generates active notifications from the current user's subscriptions and members
 */
export function generateNotificationsFromSubscriptions(
  subscriptions: Subscription[],
  readIds: string[] = []
): AppNotification[] {
  const notifications: AppNotification[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  subscriptions.forEach((sub) => {
    const subName = sub.platformName || sub.name || t('nf.subscription');
    const subColor = sub.iconColorHex || sub.color || '#1285FA';
    const members = sub.members || [];

    members.forEach((m) => {
      const memberName = m.memberName || m.name || t('rem.coSub');
      const mInfo = getMemberPlatformInfo(sub, m);
      const amount = getMemberContributionAmount(sub, m);
      const platform = m.sharingPlatform || m.platform || t('catv.general');

      // Determine next payment date
      let paymentDateStr = m.nextPaymentDate;
      if (!paymentDateStr && sub.billingDay) {
        const nextDate = new Date(today.getFullYear(), today.getMonth(), sub.billingDay);
        if (nextDate < today) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        paymentDateStr = nextDate.toISOString().split('T')[0];
      }

      const hasAlarm = Boolean(m.enableAlarm);
      const isOverdue = m.paymentStatus === 'overdue';
      const isPending = m.isPendingPayment || m.paymentStatus === 'pending';
      const isPaid = m.paymentStatus === 'paid' && !m.isPendingPayment;

      let daysRemaining = 999;
      let isAlarmTriggered = false;

      if (paymentDateStr) {
        const parts = paymentDateStr.split('-').map(Number);
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          const targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
          targetDate.setHours(0, 0, 0, 0);
          
          const diffTime = targetDate.getTime() - today.getTime();
          daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

          const alarmLeadDays = getAlarmLeadTimeDays(m.alarmValue ?? m.alarmDaysBefore ?? 3, m.alarmUnit || 'days');
          
          // Alarm is triggered if today is within lead time window or if payment is overdue/today
          if (hasAlarm && daysRemaining <= alarmLeadDays) {
            isAlarmTriggered = true;
          }
        }
      }

      const hasDebt = (m.unpaidCycles || 0) >= 1;

      // Avisa si: el miembro tiene cuotas pendientes (deuda), o salta su alarma
      // configurada, o quedan 3 días o menos para el próximo cobro — esto último
      // sin exigir que ya esté marcado como pendiente de pago, para que coincida
      // con el criterio de Android.
      const shouldNotify = hasDebt || isAlarmTriggered || isOverdue || (daysRemaining >= 0 && daysRemaining <= 3);

      if (shouldNotify) {
        let status: 'upcoming' | 'today' | 'overdue' = 'upcoming';
        let dueDateText = '';

        if (hasDebt) {
          status = 'overdue';
          dueDateText = m.unpaidCycles === 1 ? t('nf.pendingOne') : t('nf.pendingMany', { n: m.unpaidCycles });
        } else if (daysRemaining < 0) {
          status = 'overdue';
          const overdueDays = Math.abs(daysRemaining);
          dueDateText = overdueDays === 1 ? t('nf.overdueYesterday') : t('nf.overdueDays', { n: overdueDays });
        } else if (daysRemaining === 0) {
          status = 'today';
          dueDateText = t('nf.dueToday');
        } else if (daysRemaining === 1) {
          status = 'upcoming';
          dueDateText = t('nf.dueTomorrow');
        } else {
          status = 'upcoming';
          dueDateText = t('nf.dueIn', { n: daysRemaining });
        }

        const alarmVal = m.alarmValue ?? m.alarmDaysBefore ?? 3;
        const alarmUnit = m.alarmUnit || 'days';
        const isSameDay = alarmUnit === 'same_day' || alarmVal === 0 || m.alarmDaysBefore === 0;
        const unitLabel = alarmUnitWord(alarmUnit, alarmVal);
        const alarmConfigText = hasAlarm 
          ? (isSameDay ? t('nf.alarmSameDay') : t('nf.alarmBefore', { n: alarmVal, unit: unitLabel })) 
          : undefined;

        let notifType: 'alarm' | 'overdue' | 'pending' = 'alarm';
        if (status === 'overdue' || isOverdue) notifType = 'overdue';
        else if (isAlarmTriggered) notifType = 'alarm';
        else notifType = 'pending';

        const debtText = hasDebt && m.debtSinceDate
          ? (m.unpaidCycles === 1 ? t('nf.owesOne', { date: m.debtSinceDate.split('-').reverse().join('/') }) : t('nf.owesMany', { n: m.unpaidCycles, date: m.debtSinceDate.split('-').reverse().join('/') }))
          : undefined;

        // Para deudas, el id incluye el número de cuotas: si la deuda empeora,
        // se genera un aviso nuevo aunque el anterior se hubiera descartado.
        const notifId = hasDebt && m.debtSinceDate
          ? `notif_${sub.id}_${m.id}_debt_${m.debtSinceDate}_${m.unpaidCycles}`
          : `notif_${sub.id}_${m.id}_${paymentDateStr || 'nopdate'}`;
        const isRead = readIds.includes(notifId);

        notifications.push({
          id: notifId,
          type: notifType,
          subscriptionId: sub.id,
          subscriptionName: subName,
          subscriptionColor: subColor,
          memberId: m.id,
          memberName,
          memberContact: m.memberContact || m.contact,
          sharingPlatform: platform,
          amount,
          currency: mInfo.currency,
          currencySymbol: mInfo.currencySymbol,
          nextPaymentDate: paymentDateStr,
          dueDateText,
          daysRemaining,
          status,
          isRead,
          timestamp: new Date().toISOString(),
          alarmConfigText,
          paymentMethod: m.paymentMethod,
          debtText,
          unpaidCycles: m.unpaidCycles || 0,
        });
      }
    });

    // Subscription-level renewal alarm for the owner
    if (sub.enableAlarm) {
      const renewalDateStr = sub.renewalDate || resolveSubscriptionNextRenewalDate(sub);
      if (renewalDateStr) {
        const parts = renewalDateStr.split('-').map(Number);
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          const targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
          targetDate.setHours(0, 0, 0, 0);
          const diffTime = targetDate.getTime() - today.getTime();
          const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));
          const alarmLeadDays = getAlarmLeadTimeDays(sub.alarmValue ?? sub.alarmDaysBefore ?? 3, sub.alarmUnit || 'days');

          if (daysRemaining <= alarmLeadDays) {
            let status: 'upcoming' | 'today' | 'overdue' = 'upcoming';
            let dueDateText = '';
            if (daysRemaining < 0) {
              status = 'overdue';
              const overdueDays = Math.abs(daysRemaining);
              dueDateText = overdueDays === 1 ? t('nf.renewOverdueYesterday') : t('nf.renewOverdueDays', { n: overdueDays });
            } else if (daysRemaining === 0) {
              status = 'today';
              dueDateText = t('nf.renewToday');
            } else if (daysRemaining === 1) {
              status = 'upcoming';
              dueDateText = t('nf.renewTomorrow');
            } else {
              status = 'upcoming';
              dueDateText = t('nf.renewIn', { n: daysRemaining });
            }

            const alarmVal = sub.alarmValue ?? sub.alarmDaysBefore ?? 3;
            const alarmUnit = sub.alarmUnit || 'days';
            const isSameDay = alarmUnit === 'same_day' || alarmVal === 0 || sub.alarmDaysBefore === 0;
            const unitLabel = alarmUnitWord(alarmUnit, alarmVal);
            const alarmConfigText = isSameDay ? t('nf.subAlarmSameDay') : t('nf.subAlarmBefore', { n: alarmVal, unit: unitLabel });

            const notifId = `notif_sub_renewal_${sub.id}_${renewalDateStr}`;
            const isRead = readIds.includes(notifId);

            notifications.push({
              id: notifId,
              type: 'alarm',
              subscriptionId: sub.id,
              subscriptionName: subName,
              subscriptionColor: subColor,
              memberId: 'owner_renewal',
              memberName: sub.mainUserName || t('nf.subCharge'),
              memberContact: sub.notes || '',
              sharingPlatform: t('nf.generalRenewal'),
              amount: typeof sub.cost === 'number' ? sub.cost : 0,
              currency: sub.currency || 'EUR',
              currencySymbol: getCurrencySymbol(sub.currency),
              nextPaymentDate: renewalDateStr,
              dueDateText,
              daysRemaining,
              status,
              isRead,
              timestamp: new Date().toISOString(),
              alarmConfigText,
            });
          }
        }
      }
    }
  });

  // Sort by urgency: Overdue first, then today, then upcoming nearest
  return notifications.sort((a, b) => {
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    const debtDiff = (b.unpaidCycles || 0) - (a.unpaidCycles || 0);
    if (debtDiff !== 0) return debtDiff;
    return a.daysRemaining - b.daysRemaining;
  });
}

/**
 * Genera avisos para los propios pagos del usuario como CLIENTE de otros
 * grupos (no como gestor). Cada grupo tiene su propia preferencia de
 * antelación, guardada aparte por el cliente; si no se ha configurado
 * ninguna, se usa el valor por defecto: activada, 3 días.
 */
export function generateClientReminders(
  participatingGroups: Subscription[],
  currentUid: string,
  alarmPrefs: Record<string, { enabled: boolean; leadDays: number }>,
  readIds: string[] = [],
  referenceDate: Date = new Date()
): AppNotification[] {
  if (!currentUid) return [];
  const notifications: AppNotification[] = [];
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

  participatingGroups.forEach((group) => {
    const groupId = String(group.id);
    const pref = alarmPrefs[groupId] || { enabled: true, leadDays: 3 };
    if (!pref.enabled) return;

    const myMember = (group.members || []).find(
      (m) => m.linkedUid === currentUid || (m as any).linked_uid === currentUid
    );
    if (!myMember || myMember.isPendingRemoval) return;

    const paymentDateStr = myMember.nextPaymentDate || '';
    if (!paymentDateStr) return;
    const parts = paymentDateStr.split('-').map(Number);
    if (parts.length < 3) return;
    const paymentDate = new Date(parts[0], parts[1] - 1, parts[2]);

    const daysRemaining = Math.round((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const unpaidCycles = myMember.unpaidCycles || 0;
    const hasDebt = unpaidCycles >= 1;

    // Solo avisa si está dentro de la ventana configurada, o si hay deuda propia.
    if (!hasDebt && daysRemaining > pref.leadDays) return;
    if (daysRemaining < -60) return;

    const groupName = group.platformName || t('nf.subscription');
    const groupColor = group.iconColorHex || '#1285FA';
    const amount = getMemberContributionAmount(group, myMember);
    const currencySymbol = getCurrencySymbol(group.currency || 'EUR');

    let dueDateText: string;
    if (hasDebt) {
      dueDateText = unpaidCycles === 1 ? t('nf.youPendingOne') : t('nf.youPendingMany', { n: unpaidCycles });
    } else if (daysRemaining < 0) {
      dueDateText = t('nf.youOverdueDays', { n: -daysRemaining });
    } else if (daysRemaining === 0) {
      dueDateText = t('nf.youDueToday');
    } else if (daysRemaining === 1) {
      dueDateText = t('nf.youDueTomorrow');
    } else {
      dueDateText = t('nf.youDueIn', { n: daysRemaining });
    }

    const status: 'upcoming' | 'today' | 'overdue' =
      hasDebt || daysRemaining < 0 ? 'overdue' : daysRemaining === 0 ? 'today' : 'upcoming';

    const notifId = hasDebt
      ? `client_notif_${groupId}_debt_${unpaidCycles}`
      : `client_notif_${groupId}_${paymentDateStr}`;

    notifications.push({
      id: notifId,
      type: hasDebt ? 'overdue' : 'alarm',
      subscriptionId: groupId,
      subscriptionName: groupName,
      subscriptionColor: groupColor,
      memberId: '',
      memberName: t('nf.yourPayment'),
      sharingPlatform: '',
      amount,
      currency: group.currency || 'EUR',
      currencySymbol,
      nextPaymentDate: paymentDateStr,
      dueDateText,
      daysRemaining,
      status,
      isRead: readIds.includes(notifId),
      timestamp: new Date().toISOString(),
      alarmConfigText: !hasDebt ? t('nf.alarmDaysBefore', { n: pref.leadDays }) : undefined,
    });
  });

  return notifications;
}
