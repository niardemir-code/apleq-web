import { 
  Subscription, 
  Member, 
  getMemberPlatformInfo, 
  getMemberContributionAmount, 
  getCurrencySymbol,
  resolveSubscriptionNextRenewalDate 
} from '../types';

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
    const subName = sub.platformName || sub.name || 'Suscripción';
    const subColor = sub.iconColorHex || sub.color || '#1285FA';
    const members = sub.members || [];

    members.forEach((m) => {
      const memberName = m.memberName || m.name || 'Co-suscriptor';
      const mInfo = getMemberPlatformInfo(sub, m);
      const amount = getMemberContributionAmount(sub, m);
      const platform = m.sharingPlatform || m.platform || 'General';

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

      // If already paid and not overdue/pending, do not generate alert unless future alarm
      if (isPaid && !hasAlarm) {
        return;
      }

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
          if (hasAlarm && daysRemaining <= alarmLeadDays && !isPaid) {
            isAlarmTriggered = true;
          }
        }
      }

      // Trigger condition:
      // 1. Alarm explicitly set and triggered
      // 2. Member marked as overdue
      // 3. Member marked as pending and payment is in <= 3 days or past
      const shouldNotify = isAlarmTriggered || isOverdue || (isPending && daysRemaining <= 3);

      if (shouldNotify) {
        let status: 'upcoming' | 'today' | 'overdue' = 'upcoming';
        let dueDateText = '';

        if (daysRemaining < 0) {
          status = 'overdue';
          const overdueDays = Math.abs(daysRemaining);
          dueDateText = overdueDays === 1 ? 'Vencido ayer' : `Vencido hace ${overdueDays} días`;
        } else if (daysRemaining === 0) {
          status = 'today';
          dueDateText = '¡Vence hoy!';
        } else if (daysRemaining === 1) {
          status = 'upcoming';
          dueDateText = 'Vence mañana';
        } else {
          status = 'upcoming';
          dueDateText = `Vence en ${daysRemaining} días`;
        }

        const alarmVal = m.alarmValue ?? m.alarmDaysBefore ?? 3;
        const alarmUnit = m.alarmUnit || 'days';
        const isSameDay = alarmUnit === 'same_day' || alarmVal === 0 || m.alarmDaysBefore === 0;
        const unitLabel = alarmUnit === 'hours' ? (alarmVal === 1 ? 'hora' : 'horas') : alarmUnit === 'weeks' ? (alarmVal === 1 ? 'semana' : 'semanas') : alarmUnit === 'months' ? (alarmVal === 1 ? 'mes' : 'meses') : (alarmVal === 1 ? 'día' : 'días');
        const alarmConfigText = hasAlarm 
          ? (isSameDay ? 'Alarma configurada: El mismo día' : `Alarma configurada: ${alarmVal} ${unitLabel} antes`) 
          : undefined;

        let notifType: 'alarm' | 'overdue' | 'pending' = 'alarm';
        if (status === 'overdue' || isOverdue) notifType = 'overdue';
        else if (isAlarmTriggered) notifType = 'alarm';
        else notifType = 'pending';

        const notifId = `notif_${sub.id}_${m.id}_${paymentDateStr || 'nopdate'}`;
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
              dueDateText = overdueDays === 1 ? 'Renovación vencida ayer' : `Renovación vencida hace ${overdueDays} días`;
            } else if (daysRemaining === 0) {
              status = 'today';
              dueDateText = '¡Renovación de suscripción hoy!';
            } else if (daysRemaining === 1) {
              status = 'upcoming';
              dueDateText = 'Renovación de suscripción mañana';
            } else {
              status = 'upcoming';
              dueDateText = `Renovación en ${daysRemaining} días`;
            }

            const alarmVal = sub.alarmValue ?? sub.alarmDaysBefore ?? 3;
            const alarmUnit = sub.alarmUnit || 'days';
            const isSameDay = alarmUnit === 'same_day' || alarmVal === 0 || sub.alarmDaysBefore === 0;
            const unitLabel = alarmUnit === 'hours' ? (alarmVal === 1 ? 'hora' : 'horas') : alarmUnit === 'weeks' ? (alarmVal === 1 ? 'semana' : 'semanas') : alarmUnit === 'months' ? (alarmVal === 1 ? 'mes' : 'meses') : (alarmVal === 1 ? 'día' : 'días');
            const alarmConfigText = isSameDay ? 'Alarma de suscripción: El mismo día' : `Alarma de suscripción: ${alarmVal} ${unitLabel} antes`;

            const notifId = `notif_sub_renewal_${sub.id}_${renewalDateStr}`;
            const isRead = readIds.includes(notifId);

            notifications.push({
              id: notifId,
              type: 'alarm',
              subscriptionId: sub.id,
              subscriptionName: subName,
              subscriptionColor: subColor,
              memberId: 'owner_renewal',
              memberName: sub.mainUserName || 'Cobro de suscripción',
              memberContact: sub.notes || '',
              sharingPlatform: 'Renovación general',
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
    // Unread first if user prefers, or by urgency
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    return a.daysRemaining - b.daysRemaining;
  });
}
