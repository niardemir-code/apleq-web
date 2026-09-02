import { 
  collection, 
  doc, 
  getDoc,
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  query, 
  where,
  writeBatch
} from 'firebase/firestore';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Subscription, 
  PaymentStatus, 
  Member, 
  Category, 
  SharingPlatform,
  BillingPeriod,
  BillingCycle,
  AndroidBackupJson,
  BackupPreview,
  normalizeBillingPeriod,
  resolveMemberNextPaymentDate,
  calculateNextPaymentFromJoined
} from '../types';

export function getSubscriptionsPath(userId: string): string {
  return `users/${userId}/subscriptions`;
}

// Convert Firestore Timestamp / string / Date / millis safely into ISO string
function parseSafeDate(raw: any, fallback = new Date().toISOString()): string {
  if (!raw) return fallback;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') {
    try {
      return new Date(raw).toISOString();
    } catch {
      return fallback;
    }
  }
  if (typeof raw.toDate === 'function') {
    try {
      return raw.toDate().toISOString();
    } catch {
      return fallback;
    }
  }
  if (typeof raw.seconds === 'number') {
    try {
      return new Date(raw.seconds * 1000).toISOString();
    } catch {
      return fallback;
    }
  }
  return fallback;
}

const VALID_CATEGORIES: Category[] = [
  'Streaming',
  'Música',
  'Productividad',
  'Gaming',
  'Nube',
  'IA',
  'Lectura',
  'Otros',
];

const VALID_PLATFORMS: SharingPlatform[] = [
  'Together Price',
  'Sharesub',
  'Sharingful',
  'Spliiit',
  'GamsGo',
  'Directo/Familia',
  'Amigos',
  'Otro',
];

// Safe boolean parser covering all types from Android (Boolean, SQLite 0/1, String "true"/"false")
function parseSafeBoolean(val: any, defaultVal = false): boolean {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes' || s === 'si') return true;
    if (s === 'false' || s === '0' || s === 'no') return false;
  }
  return Boolean(val);
}

// Convert Firestore members array or map safely (compatible with FirebaseMemberDto and MemberEntity)
function parseSafeMembers(rawMembers: any, subBillingDay?: number): Member[] {
  if (!rawMembers) return [];
  
  let list: any[] = [];
  if (Array.isArray(rawMembers)) {
    list = rawMembers;
  } else if (typeof rawMembers === 'object') {
    list = Object.values(rawMembers);
  }

  return list.map((m: any, idx: number): Member => {
    const rawName = String(
      m.memberName || 
      m.name || 
      m.member_name || 
      m.username || 
      m.displayName || 
      `Miembro ${idx + 1}`
    );
    const rawPlatform = String(
      m.sharingPlatform || 
      m.platform || 
      m.sharing_platform || 
      m.service || 
      ''
    );
    const matchedPlatform = rawPlatform
      ? (VALID_PLATFORMS.find((p) => p.toLowerCase() === rawPlatform.toLowerCase()) || rawPlatform)
      : '';

    const rawAmount = m.contributionAmount ?? m.amount ?? m.contribution_amount ?? m.price ?? m.cost ?? 0;
    const amount = typeof rawAmount === 'number' ? rawAmount : parseFloat(String(rawAmount)) || 0;

    // Exact Android Boolean flags covering all possible Kotlin / Gson / Firestore Android SDK mappings
    const isPendingPayment = parseSafeBoolean(
      m.isPendingPayment ?? 
      m.pendingPayment ?? 
      m.is_pending_payment ?? 
      m.pending_payment,
      false
    );
    const isPendingRemoval = parseSafeBoolean(
      m.isPendingRemoval ?? 
      m.pendingRemoval ?? 
      m.is_pending_removal ?? 
      m.pending_removal ?? 
      m.toRemove ?? 
      m.to_remove,
      false
    );
    const isPendingRegistration = parseSafeBoolean(
      m.isPendingRegistration ?? 
      m.pendingRegistration ?? 
      m.is_pending_registration ?? 
      m.pending_registration,
      false
    );
    
    let isPaidThisMonth: boolean;
    if (m.isPaidThisMonth !== undefined) {
      isPaidThisMonth = parseSafeBoolean(m.isPaidThisMonth, true);
    } else if (m.paidThisMonth !== undefined) {
      isPaidThisMonth = parseSafeBoolean(m.paidThisMonth, true);
    } else if (m.is_paid_this_month !== undefined) {
      isPaidThisMonth = parseSafeBoolean(m.is_paid_this_month, true);
    } else if (m.paid_this_month !== undefined) {
      isPaidThisMonth = parseSafeBoolean(m.paid_this_month, true);
    } else {
      isPaidThisMonth = !isPendingPayment && String(m.paymentStatus).toLowerCase() === 'paid';
    }

    let paymentStatus: PaymentStatus = 'pending';
    if (isPaidThisMonth) {
      paymentStatus = 'paid';
    } else if (isPendingPayment) {
      paymentStatus = 'pending';
    } else if (m.paymentStatus === 'overdue') {
      paymentStatus = 'overdue';
    }

    const contactStr = String(
      m.memberContact || 
      m.contact || 
      m.member_contact || 
      m.phone || 
      m.email || 
      ''
    );

    const paymentFreqVal = typeof m.paymentFrequencyValue === 'number' ? m.paymentFrequencyValue : (typeof m.payment_frequency_value === 'number' ? m.payment_frequency_value : 1);
    const paymentFreqUnit = (m.paymentFrequencyUnit || m.payment_frequency_unit || 'months') as 'days' | 'weeks' | 'months' | 'years';
    const autoRepeatVal = parseSafeBoolean(m.autoRepeatPayment ?? m.auto_repeat_payment ?? true, true);

    const enableAlarmVal = parseSafeBoolean(m.enableAlarm ?? m.enable_alarm ?? m.hasAlarm ?? m.has_alarm, false);
    const alarmVal = typeof m.alarmValue === 'number' ? m.alarmValue : (typeof m.alarm_value === 'number' ? m.alarm_value : (typeof m.alarmDaysBefore === 'number' ? m.alarmDaysBefore : (typeof m.alarm_days_before === 'number' ? m.alarm_days_before : 3)));
    const alarmUnitVal = (m.alarmUnit || m.alarm_unit || 'days') as 'same_day' | 'hours' | 'days' | 'weeks' | 'months';
    const alarmDaysVal = typeof m.alarmDaysBefore === 'number' 
      ? m.alarmDaysBefore 
      : (typeof m.alarm_days_before === 'number' 
        ? m.alarm_days_before 
        : (alarmUnitVal === 'same_day' ? 0 : alarmUnitVal === 'weeks' ? alarmVal * 7 : (alarmUnitVal === 'months' ? alarmVal * 30 : alarmVal)));
    const paymentMethodVal = String(m.paymentMethod || m.payment_method || m.method || '');

    const joinedDateVal = parseSafeDate(m.joinedDate || m.joined_date || m.createdAt, new Date().toISOString().split('T')[0]).split('T')[0];

    // Compute or validate next payment date following frequency and joined date rules
    let nextPaymentDateVal = m.nextPaymentDate || m.next_payment_date ? parseSafeDate(m.nextPaymentDate || m.next_payment_date, '').split('T')[0] : '';
    if (!nextPaymentDateVal) {
      nextPaymentDateVal = resolveMemberNextPaymentDate({
        joinedDate: joinedDateVal,
        paymentFrequencyValue: paymentFreqVal,
        paymentFrequencyUnit: paymentFreqUnit,
      }, subBillingDay);
    }

    const memberCurrency = m.currency || m.memberCurrency || m.currency_code ? normalizeCurrencyToIso(m.currency || m.memberCurrency || m.currency_code) : undefined;

    // Fallback ID must contain ONLY digits (64-bit numeric integer representation)
    const memberIdStr = m.id !== undefined && m.id !== null && String(m.id).trim() !== ''
      ? String(m.id)
      : String(Date.now() * 1000 + Math.floor(Math.random() * 1000));

    return {
      id: memberIdStr,
      subscriptionId: m.subscriptionId ? String(m.subscriptionId) : (m.subscription_id ? String(m.subscription_id) : undefined),
      linkedUid: m.linkedUid !== undefined ? m.linkedUid : (m.linked_uid !== undefined ? m.linked_uid : null),
      inviteCode: m.inviteCode !== undefined ? m.inviteCode : (m.invite_code !== undefined ? m.invite_code : null),
      name: rawName,
      memberName: rawName,
      platform: matchedPlatform,
      sharingPlatform: rawPlatform,
      contact: contactStr,
      memberContact: contactStr,
      amount: isNaN(amount) ? 0 : amount,
      contributionAmount: isNaN(amount) ? 0 : amount,
      currency: memberCurrency,
      paymentStatus: paymentStatus,
      isPaidThisMonth: Boolean(isPaidThisMonth),
      isPendingPayment: Boolean(isPendingPayment),
      isPendingRemoval: isPendingRemoval,
      isPendingRegistration: isPendingRegistration,
      paymentMethod: paymentMethodVal,
      nextPaymentDate: nextPaymentDateVal,
      paymentFrequencyValue: paymentFreqVal,
      paymentFrequencyUnit: paymentFreqUnit,
      autoRepeatPayment: autoRepeatVal,
      enableAlarm: enableAlarmVal,
      alarmValue: alarmVal,
      alarmUnit: alarmUnitVal,
      alarmDaysBefore: alarmDaysVal,
      joinedDate: joinedDateVal,
      lastPaymentDate: m.lastPaymentDate || m.last_payment_date ? parseSafeDate(m.lastPaymentDate || m.last_payment_date, undefined) : undefined,
      notes: String(m.notes || ''),
    };
  });
}

// Currency normalization to canonical 3-letter ISO code
export function normalizeCurrencyToIso(rawCurrency: string | undefined): string {
  if (!rawCurrency) return 'EUR';
  const c = rawCurrency.trim().toUpperCase();
  if (c === '€' || c === 'EUR') return 'EUR';
  if (c === '$' || c === 'USD') return 'USD';
  if (c === '£' || c === 'GBP') return 'GBP';
  if (c === '¥' || c === 'JPY') return 'JPY';
  if (c === 'R$' || c === 'BRL') return 'BRL';
  if (c === 'S/' || c === 'PEN') return 'PEN';
  if (c === 'CHF') return 'CHF';
  if (c === 'GHS') return 'GHS';
  if (c === 'MXN') return 'MXN';
  if (c === 'COP') return 'COP';
  if (c === 'ARS') return 'ARS';
  if (c === 'CLP') return 'CLP';
  if (c === 'CAD') return 'CAD';
  if (c === 'AUD') return 'AUD';
  if (c === 'SEK') return 'SEK';
  if (c === 'NOK') return 'NOK';
  if (c === 'TRY') return 'TRY';
  if (c === 'INR') return 'INR';
  if (c === 'CNY') return 'CNY';
  if (c === 'PLN') return 'PLN';
  return rawCurrency.trim() || 'EUR';
}

// Convert BillingPeriod / string to normalized cycle
function mapBillingCycle(periodStr: string): BillingCycle {
  const p = normalizeBillingPeriod(periodStr);
  if (p === 'YEARLY') return 'yearly';
  if (p === 'QUARTERLY') return 'quarterly';
  if (p === 'SEMI_ANNUAL') return 'semi_annual';
  return 'monthly';
}

function mapBillingPeriod(cycleOrPeriod: string): BillingPeriod {
  return normalizeBillingPeriod(cycleOrPeriod);
}

// Normalize any subscription doc from Android (FirebaseSubscriptionDto) or Web into guaranteed clean types
export function normalizeSubscriptionDoc(id: string, data: any, defaultUserId: string): Subscription {
  const rawCost = data.cost ?? data.price ?? data.amount ?? data.totalPrice ?? 0;
  const cost = typeof rawCost === 'number' ? rawCost : parseFloat(String(rawCost)) || 0;

  const rawDay = data.billingDay ?? data.billing_day ?? data.day ?? 1;
  const billingDay = typeof rawDay === 'number' ? rawDay : parseInt(String(rawDay), 10) || 1;

  const rawMembers = parseSafeMembers(data.members, billingDay);

  const rawMonth = data.billingMonth ?? data.billing_month ?? data.month ?? 1;
  const billingMonth = typeof rawMonth === 'number' ? rawMonth : parseInt(String(rawMonth), 10) || 1;

  const rawPeriodStr = String(data.billingPeriod || data.billingCycle || data.billing_cycle || data.cycle || 'MONTHLY');
  const billingCycle = mapBillingCycle(rawPeriodStr);
  const billingPeriod = mapBillingPeriod(billingCycle);

  const rawCategory = String(data.category || data.type || 'Streaming');
  const matchedCategory = VALID_CATEGORIES.find(
    (c) => c.toLowerCase() === rawCategory.toLowerCase()
  ) || 'Otros';

  // 1. Resolve Platform Name / Subscription Service Title across all possible Android & Web fields
  const candidatePlatform = String(
    data.platformName || 
    data.serviceName || 
    data.name || 
    data.title || 
    data.service || 
    data.service_name || 
    data.platform_name || 
    data.subscriptionName || 
    data.subscription_name || 
    data.appName || 
    ''
  ).trim();

  // 2. Resolve Custom Plan Name / Custom Title (e.g. "Crunchyroll 1", "Mega Fan", "Ultra 4K")
  const candidatePlan = String(
    data.customPlanName || 
    data.plan || 
    data.planName || 
    data.custom_plan_name || 
    data.plan_name || 
    data.tier || 
    ''
  ).trim();

  // Smart resolution: If candidatePlatform is empty or generic 'Suscripción', check candidatePlan or others
  let platformName = candidatePlatform;
  if (!platformName || platformName.toLowerCase() === 'suscripción') {
    if (candidatePlan && candidatePlan.toLowerCase() !== 'estándar' && candidatePlan.toLowerCase() !== 'standard') {
      platformName = candidatePlan;
    } else if (candidatePlatform) {
      platformName = candidatePlatform;
    } else {
      platformName = 'Suscripción';
    }
  }

  const customPlanName = candidatePlan;
  const mainUserName = String(data.mainUserName || data.ownerName || data.userName || '').trim();
  const mainUserContact = String(data.mainUserContact || data.ownerContact || '').trim();

  const rawContribution = data.defaultContributionPerUser ?? data.contributionAmount ?? (rawMembers.length > 0 ? cost / rawMembers.length : 0);
  const defaultContributionPerUser = typeof rawContribution === 'number' ? rawContribution : parseFloat(String(rawContribution)) || 0;

  const iconColorHex = String(data.iconColorHex || data.color || '#1285FA');
  const iconKey = String(data.iconKey || data.icon || platformName || 'Netflix');
  const iconType = String(data.iconType || 'PRESET');

  const enableAlarm = parseSafeBoolean(data.enableAlarm ?? data.enable_alarm ?? data.hasAlarm ?? data.has_alarm, false);
  const alarmVal = typeof data.alarmValue === 'number' ? data.alarmValue : (typeof data.alarm_value === 'number' ? data.alarm_value : (typeof data.alarmDaysBefore === 'number' ? data.alarmDaysBefore : (typeof data.alarm_days_before === 'number' ? data.alarm_days_before : 3)));
  const alarmUnitVal = (data.alarmUnit || data.alarm_unit || 'days') as 'same_day' | 'hours' | 'days' | 'weeks' | 'months';
  const alarmDaysVal = typeof data.alarmDaysBefore === 'number'
    ? data.alarmDaysBefore
    : (typeof data.alarm_days_before === 'number'
      ? data.alarm_days_before
      : (alarmUnitVal === 'same_day' ? 0 : alarmUnitVal === 'weeks' ? alarmVal * 7 : (alarmUnitVal === 'months' ? alarmVal * 30 : alarmVal)));

  const rawRenewal = data.renewalDate || data.renewal_date || data.nextBillingDate || data.next_billing_date;
  const parsedRenewal = rawRenewal ? parseSafeDate(rawRenewal, '') : undefined;

  return {
    id: String(id),
    userId: String(data.userId || data.user_id || defaultUserId),
    name: platformName,
    platformName: platformName,
    plan: customPlanName,
    customPlanName: customPlanName,
    mainUserName: mainUserName,
    mainUserContact: mainUserContact,
    category: matchedCategory,
    cost: isNaN(cost) ? 0 : cost,
    billingCycle: billingCycle,
    billingPeriod: billingPeriod,
    currency: normalizeCurrencyToIso(data.currency),
    billingDay: isNaN(billingDay) ? 1 : Math.min(31, Math.max(1, billingDay)),
    freeSlots: typeof data.freeSlots === 'number' ? data.freeSlots : (typeof data.free_slots === 'number' ? data.free_slots : 0),
    billingMonth: isNaN(billingMonth) ? 1 : Math.min(12, Math.max(1, billingMonth)),
    defaultContributionPerUser: isNaN(defaultContributionPerUser) ? 0 : defaultContributionPerUser,
    platformPricing: String(data.platformPricing || ''),
    renewalDate: parsedRenewal,
    enableAlarm: enableAlarm,
    alarmValue: alarmVal,
    alarmUnit: alarmUnitVal,
    alarmDaysBefore: alarmDaysVal,
    notes: String(data.notes || data.description || ''),
    members: rawMembers,
    memberUids: Array.isArray(data.memberUids) ? data.memberUids : (Array.isArray(data.member_uids) ? data.member_uids : undefined),
    color: iconColorHex,
    iconColorHex: iconColorHex,
    iconType: iconType,
    iconKey: iconKey,
    customImageUri: String(data.customImageUri || ''),
    customImageBase64: String(data.customImageBase64 || ''),
    icon: iconKey,
    createdAt: parseSafeDate(data.createdAt || data.created_at),
    updatedAt: parseSafeDate(data.updatedAt || data.updated_at),
  };
}

/**
 * Converts or generates a stable numeric ID (compatible with 64-bit integer / Long in Android)
 * - If already a positive number: returns it directly.
 * - If digit-only string: parses as Number.
 * - If legacy non-numeric string (e.g. "mem_172..."): hashes deterministically from its own value (never using index).
 * - If null / undefined / empty: generates a new timestamp-based 64-bit safe numeric ID.
 * NEVER derives the ID from array position (idx).
 */
export function getStableNumericMemberId(id: string | number | undefined | null): number {
  if (typeof id === 'number' && !isNaN(id) && id > 0) {
    return id;
  }
  if (typeof id === 'string' && id.trim() !== '') {
    const clean = id.trim();
    if (/^\d+$/.test(clean)) {
      const num = Number(clean);
      if (!isNaN(num) && num > 0) return num;
    }
    // Deterministic hash of legacy non-numeric string (never using list index)
    let hash = 5381;
    for (let i = 0; i < clean.length; i++) {
      hash = ((hash << 5) + hash) + clean.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) || (Date.now() * 1000 + Math.floor(Math.random() * 1000));
  }
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

// Helper to format members with exact Android Kotlin / Firestore schema
export function formatMembersForFirestore(members: Member[], subBillingDay?: number): any[] {
  const now = Date.now();
  return (members || []).map((m, idx) => {
    // Member ID must be stored as a Number for Android Kotlin Long interoperability
    const numericId = getStableNumericMemberId(m.id);

    let joinedDateMs = now;
    if (typeof m.joinedDate === 'number') {
      joinedDateMs = m.joinedDate;
    } else if (m.joinedDate) {
      const parsed = new Date(m.joinedDate).getTime();
      if (!isNaN(parsed)) joinedDateMs = parsed;
    }

    const rawCost = m.contributionAmount ?? m.amount ?? 0;
    const contributionAmount = typeof rawCost === 'number' ? rawCost : parseFloat(String(rawCost)) || 0;

    const isPendingPayment = Boolean(m.isPendingPayment);
    const isPendingRemoval = Boolean(m.isPendingRemoval);
    const isPendingRegistration = Boolean(m.isPendingRegistration);
    const isPaidThisMonth = m.isPaidThisMonth !== undefined
      ? Boolean(m.isPaidThisMonth)
      : (!isPendingPayment && String(m.paymentStatus).toLowerCase() === 'paid');

    const nameStr = String(m.memberName || m.name || `Miembro ${idx + 1}`).trim();
    const platformStr = String(m.sharingPlatform || m.platform || '').trim();
    const contactStr = String(m.memberContact || m.contact || '').trim();
    const notesStr = String(m.notes || '').trim();
    const paymentStatusStr = isPaidThisMonth ? 'paid' : (isPendingPayment ? 'pending' : (m.paymentStatus || 'pending'));

    const calculatedNextPaymentDate = resolveMemberNextPaymentDate(m, subBillingDay);

    return {
      id: numericId,
      // Exact member schema fields requested
      memberName: nameStr,
      sharingPlatform: platformStr,
      memberContact: contactStr,
      contributionAmount: Number(contributionAmount.toFixed(2)),
      currency: m.currency ? normalizeCurrencyToIso(m.currency) : 'EUR',
      currency_code: m.currency ? normalizeCurrencyToIso(m.currency) : 'EUR',
      isPaidThisMonth: Boolean(isPaidThisMonth),
      isPendingPayment: Boolean(isPendingPayment),
      isPendingRemoval: Boolean(isPendingRemoval),
      isPendingRegistration: Boolean(isPendingRegistration),
      notes: notesStr,
      paymentMethod: String(m.paymentMethod || ''),
      payment_method: String(m.paymentMethod || ''),
      linkedUid: m.linkedUid ?? null,
      linked_uid: m.linkedUid ?? null,
      inviteCode: m.inviteCode ?? null,
      invite_code: m.inviteCode ?? null,
      nextPaymentDate: calculatedNextPaymentDate,
      next_payment_date: calculatedNextPaymentDate,
      paymentFrequencyValue: typeof m.paymentFrequencyValue === 'number' ? m.paymentFrequencyValue : 1,
      payment_frequency_value: typeof m.paymentFrequencyValue === 'number' ? m.paymentFrequencyValue : 1,
      paymentFrequencyUnit: m.paymentFrequencyUnit || 'months',
      payment_frequency_unit: m.paymentFrequencyUnit || 'months',
      autoRepeatPayment: m.autoRepeatPayment !== undefined ? Boolean(m.autoRepeatPayment) : true,
      auto_repeat_payment: m.autoRepeatPayment !== undefined ? Boolean(m.autoRepeatPayment) : true,
      enableAlarm: Boolean(m.enableAlarm),
      enable_alarm: Boolean(m.enableAlarm),
      hasAlarm: Boolean(m.enableAlarm),
      has_alarm: Boolean(m.enableAlarm),
      alarmValue: typeof m.alarmValue === 'number' ? m.alarmValue : 3,
      alarm_value: typeof m.alarmValue === 'number' ? m.alarmValue : 3,
      alarmUnit: m.alarmUnit || 'days',
      alarm_unit: m.alarmUnit || 'days',
      alarmDaysBefore: typeof m.alarmDaysBefore === 'number' 
        ? m.alarmDaysBefore 
        : (m.alarmUnit === 'same_day' ? 0 : m.alarmUnit === 'weeks' ? (m.alarmValue || 3) * 7 : (m.alarmUnit === 'months' ? (m.alarmValue || 3) * 30 : (m.alarmValue || 3))),
      alarm_days_before: typeof m.alarmDaysBefore === 'number' 
        ? m.alarmDaysBefore 
        : (m.alarmUnit === 'same_day' ? 0 : m.alarmUnit === 'weeks' ? (m.alarmValue || 3) * 7 : (m.alarmUnit === 'months' ? (m.alarmValue || 3) * 30 : (m.alarmValue || 3))),
      // Backward compatibility aliases
      member_name: nameStr,
      name: nameStr,
      sharing_platform: platformStr,
      platform: platformStr,
      member_contact: contactStr,
      contact: contactStr,
      joinedDate: joinedDateMs,
      joined_date: joinedDateMs,
      contribution_amount: Number(contributionAmount.toFixed(2)),
      amount: Number(contributionAmount.toFixed(2)),
      paidThisMonth: Boolean(isPaidThisMonth),
      is_paid_this_month: Boolean(isPaidThisMonth),
      paid_this_month: Boolean(isPaidThisMonth),
      isPaid: Boolean(isPaidThisMonth),
      paid: Boolean(isPaidThisMonth),
      pendingPayment: Boolean(isPendingPayment),
      is_pending_payment: Boolean(isPendingPayment),
      pending_payment: Boolean(isPendingPayment),
      pendingRemoval: Boolean(isPendingRemoval),
      is_pending_removal: Boolean(isPendingRemoval),
      pending_removal: Boolean(isPendingRemoval),
      toRemove: Boolean(isPendingRemoval),
      to_remove: Boolean(isPendingRemoval),
      pendingRegistration: Boolean(isPendingRegistration),
      is_pending_registration: Boolean(isPendingRegistration),
      pending_registration: Boolean(isPendingRegistration),
      paymentStatus: paymentStatusStr,
      payment_status: paymentStatusStr,
    };
  });
}

// Function to cleanly merge member lists across multiple sources without losing any member (e.g. Renato)
// and allowing state toggles (pending removal, pending payment, etc.) to update without being overridden by stale copies.
function mergeMemberArrays(...sources: (Member[] | undefined)[]): Member[] {
  const memberMap = new Map<string, Member>();
  
  for (const src of sources) {
    if (!src || !Array.isArray(src)) continue;
    for (const m of src) {
      if (!m) continue;
      // Key strictly by normalized member name (business key) to avoid ID collisions between different databases
      const normName = (m.memberName || m.name || '').trim().toLowerCase();
      const key = normName ? `name_${normName}` : (m.id ? `id_${m.id}` : `item_${Math.random()}`);

      const existing = memberMap.get(key);
      if (!existing) {
        // First occurrence (authoritative if sources are ordered newest to oldest)
        memberMap.set(key, { ...m });
      } else {
        // Member already registered from a more recent source:
        // Keep the latest flags/statuses and fill in missing contact/notes/amount only if existing was empty
        const isPendingRemoval = existing.isPendingRemoval !== undefined ? Boolean(existing.isPendingRemoval) : Boolean(m.isPendingRemoval);
        const isPendingPayment = existing.isPendingPayment !== undefined ? Boolean(existing.isPendingPayment) : Boolean(m.isPendingPayment);
        const isPendingRegistration = existing.isPendingRegistration !== undefined ? Boolean(existing.isPendingRegistration) : Boolean(m.isPendingRegistration);
        
        let isPaidThisMonth: boolean;
        if (existing.isPaidThisMonth !== undefined) {
          isPaidThisMonth = Boolean(existing.isPaidThisMonth);
        } else if (isPendingPayment) {
          isPaidThisMonth = false;
        } else if (m.isPaidThisMonth !== undefined) {
          isPaidThisMonth = Boolean(m.isPaidThisMonth);
        } else {
          isPaidThisMonth = true;
        }

        const paymentStatus: PaymentStatus = existing.paymentStatus || (isPaidThisMonth ? 'paid' : (isPendingPayment ? 'pending' : (m.paymentStatus || 'pending')));

        memberMap.set(key, {
          ...m,
          ...existing,
          memberName: existing.memberName || existing.name || m.memberName || m.name,
          name: existing.memberName || existing.name || m.memberName || m.name,
          sharingPlatform: existing.sharingPlatform || existing.platform || m.sharingPlatform || m.platform || '',
          platform: existing.sharingPlatform || existing.platform || m.sharingPlatform || m.platform || '',
          memberContact: existing.memberContact || existing.contact || m.memberContact || m.contact || '',
          contact: existing.memberContact || existing.contact || m.memberContact || m.contact || '',
          notes: existing.notes || m.notes || '',
          paymentMethod: existing.paymentMethod || m.paymentMethod || '',
          nextPaymentDate: existing.nextPaymentDate || m.nextPaymentDate,
          paymentFrequencyValue: existing.paymentFrequencyValue ?? m.paymentFrequencyValue ?? 1,
          paymentFrequencyUnit: existing.paymentFrequencyUnit || m.paymentFrequencyUnit || 'months',
          autoRepeatPayment: existing.autoRepeatPayment !== undefined ? existing.autoRepeatPayment : (m.autoRepeatPayment !== undefined ? m.autoRepeatPayment : true),
          enableAlarm: existing.enableAlarm !== undefined ? existing.enableAlarm : m.enableAlarm,
          alarmValue: existing.alarmValue !== undefined ? existing.alarmValue : m.alarmValue,
          alarmUnit: existing.alarmUnit || m.alarmUnit || 'days',
          alarmDaysBefore: existing.alarmDaysBefore !== undefined ? existing.alarmDaysBefore : m.alarmDaysBefore,
          contributionAmount: existing.contributionAmount ?? existing.amount ?? m.contributionAmount ?? m.amount ?? 0,
          amount: existing.contributionAmount ?? existing.amount ?? m.contributionAmount ?? m.amount ?? 0,
          currency: existing.currency || m.currency || 'EUR',
          isPendingRemoval,
          isPendingPayment,
          isPendingRegistration,
          isPaidThisMonth,
          paymentStatus,
        });
      }
    }
  }

  // Preserve member IDs faithfully without altering their identities
  const list = Array.from(memberMap.values());
  return list.map((m, idx) => ({
    ...m,
    id: m.id ? String(m.id) : String(Date.now() * 1000 + Math.floor(Math.random() * 1000)),
    memberName: m.memberName || m.name || `Miembro ${idx + 1}`,
    name: m.memberName || m.name || `Miembro ${idx + 1}`,
    sharingPlatform: m.sharingPlatform || m.platform || '',
    platform: m.sharingPlatform || m.platform || '',
    memberContact: m.memberContact || m.contact || '',
    contact: m.memberContact || m.contact || '',
    nextPaymentDate: resolveMemberNextPaymentDate(m),
  }));
}

// Convert web subscription & members to exact Android FirebaseSubscriptionDto format
export function toAndroidSubscriptionPayload(sub: Partial<Subscription>, userId: string) {
  const now = Date.now();
  const payload: any = { 
    userId,
    user_id: userId,
  };

  const docSubId = sub.id ? (parseInt(String(sub.id), 10) || sub.id) : undefined;
  if (docSubId !== undefined) {
    payload.id = docSubId;
  }

  if (sub.platformName !== undefined || sub.name !== undefined) {
    const platformName = (sub.platformName || sub.name || 'Suscripción').trim();
    payload.platformName = platformName;
    payload.serviceName = platformName;
    payload.name = platformName;
    payload.platform_name = platformName;
    payload.service_name = platformName;
  }
  if (sub.customPlanName !== undefined || sub.plan !== undefined) {
    const customPlanName = (sub.customPlanName || sub.plan || '').trim();
    payload.customPlanName = customPlanName;
    payload.plan = customPlanName;
    payload.custom_plan_name = customPlanName;
    payload.plan_name = customPlanName;
  }
  if (sub.mainUserName !== undefined) {
    payload.mainUserName = (sub.mainUserName || '').trim();
    payload.main_user_name = (sub.mainUserName || '').trim();
  }
  if (sub.mainUserContact !== undefined) {
    payload.mainUserContact = (sub.mainUserContact || '').trim();
    payload.main_user_contact = (sub.mainUserContact || '').trim();
  }
  if (sub.cost !== undefined) {
    const costVal = Number(sub.cost) || 0;
    payload.cost = costVal;
    payload.price = costVal;
    payload.totalPrice = costVal;
    payload.total_price = costVal;
  }
  if (sub.billingPeriod !== undefined || sub.billingCycle !== undefined) {
    const rawPeriod = sub.billingPeriod || (sub.billingCycle ? mapBillingPeriod(sub.billingCycle) : 'MONTHLY');
    const billingPeriod = normalizeBillingPeriod(rawPeriod);
    payload.billingPeriod = billingPeriod;
    payload.billingCycle = mapBillingCycle(billingPeriod);
    payload.billing_period = billingPeriod;
    payload.billing_cycle = mapBillingCycle(billingPeriod);
  }
  if (sub.billingDay !== undefined) {
    const bDay = Math.min(31, Math.max(1, Math.round(Number(sub.billingDay) || 1)));
    payload.billingDay = bDay;
    payload.billing_day = bDay;
    payload.day = bDay;
  }
  if (sub.freeSlots !== undefined || (sub as any).free_slots !== undefined) {
    const fSlots = Math.max(0, Number(sub.freeSlots ?? (sub as any).free_slots) || 0);
    payload.freeSlots = fSlots;
    payload.free_slots = fSlots;
  }
  if (sub.billingMonth !== undefined) {
    const bMonth = Math.min(12, Math.max(1, Math.round(Number(sub.billingMonth) || 1)));
    payload.billingMonth = bMonth;
    payload.billing_month = bMonth;
    payload.month = bMonth;
  }
  if (sub.currency !== undefined) {
    const isoCurr = normalizeCurrencyToIso(sub.currency);
    payload.currency = isoCurr;
  }
  if (sub.defaultContributionPerUser !== undefined) {
    const defContr = Number(sub.defaultContributionPerUser) || 0;
    payload.defaultContributionPerUser = defContr;
    payload.default_contribution_per_user = defContr;
    payload.contributionAmount = defContr;
  }
  if (sub.platformPricing !== undefined) {
    payload.platformPricing = sub.platformPricing || '';
    payload.platform_pricing = sub.platformPricing || '';
  }
  if (sub.renewalDate !== undefined) {
    const rDate = sub.renewalDate || '';
    payload.renewalDate = rDate;
    payload.renewal_date = rDate;
    payload.nextBillingDate = rDate;
    payload.next_billing_date = rDate;
  }
  if (sub.enableAlarm !== undefined || (sub as any).hasAlarm !== undefined) {
    const enAlarm = Boolean(sub.enableAlarm ?? (sub as any).hasAlarm);
    payload.enableAlarm = enAlarm;
    payload.enable_alarm = enAlarm;
    payload.hasAlarm = enAlarm;
    payload.has_alarm = enAlarm;
  }
  if (sub.alarmValue !== undefined || (sub as any).alarm_value !== undefined) {
    const aVal = typeof sub.alarmValue === 'number' ? sub.alarmValue : (typeof (sub as any).alarm_value === 'number' ? (sub as any).alarm_value : 3);
    payload.alarmValue = aVal;
    payload.alarm_value = aVal;
  }
  if (sub.alarmUnit !== undefined || (sub as any).alarm_unit !== undefined) {
    const aUnit = sub.alarmUnit || (sub as any).alarm_unit || 'days';
    payload.alarmUnit = aUnit;
    payload.alarm_unit = aUnit;
  }
  if (sub.alarmDaysBefore !== undefined || (sub as any).alarm_days_before !== undefined || sub.alarmValue !== undefined) {
    const aVal = typeof sub.alarmValue === 'number' ? sub.alarmValue : 3;
    const aUnit = sub.alarmUnit || 'days';
    const aDays = typeof sub.alarmDaysBefore === 'number'
      ? sub.alarmDaysBefore
      : (typeof (sub as any).alarm_days_before === 'number'
        ? (sub as any).alarm_days_before
        : (aUnit === 'same_day' ? 0 : aUnit === 'weeks' ? aVal * 7 : aUnit === 'months' ? aVal * 30 : aVal));
    payload.alarmDaysBefore = aDays;
    payload.alarm_days_before = aDays;
  }
  if (sub.category !== undefined) {
    payload.category = sub.category || 'Streaming';
  }
  if (sub.notes !== undefined) {
    payload.notes = sub.notes || '';
    payload.description = sub.notes || '';
  }
  if (sub.iconType !== undefined) {
    const iType = sub.iconType || 'PRESET';
    payload.iconType = iType;
    payload.icon_type = iType;
  }
  if (sub.iconKey !== undefined || sub.icon !== undefined) {
    const iconKey = sub.iconKey || sub.icon || payload.platformName || 'Netflix';
    payload.iconKey = iconKey;
    payload.icon = iconKey;
    payload.icon_key = iconKey;
  }
  if (sub.iconColorHex !== undefined || sub.color !== undefined) {
    const iconColorHex = sub.iconColorHex || sub.color || '#1285FA';
    payload.iconColorHex = iconColorHex;
    payload.color = iconColorHex;
    payload.icon_color_hex = iconColorHex;
  }
  const customImgUri = sub.customImageUri || '';
  if (sub.customImageUri !== undefined) {
    payload.customImageUri = customImgUri;
    payload.custom_image_uri = customImgUri;
  }
  if (sub.customImageBase64 !== undefined) {
    // When a valid customImageUri exists (Storage URL), do not write base64 to Firestore
    const base64Value = customImgUri ? '' : (sub.customImageBase64 || '');
    payload.customImageBase64 = base64Value;
    payload.custom_image_base64 = base64Value;
  }
  if (sub.createdAt !== undefined) {
    payload.createdAt = typeof sub.createdAt === 'number' ? sub.createdAt : new Date(sub.createdAt).getTime();
  }

  if (sub.members !== undefined) {
    payload.members = formatMembersForFirestore(sub.members, sub.billingDay);
  }

  if (sub.memberUids !== undefined) {
    payload.memberUids = sub.memberUids;
    payload.member_uids = sub.memberUids;
  }

  payload.updatedAt = new Date().toISOString();
  payload.updated_at = new Date().toISOString();
  return payload;
}

export function subscribeToUserSubscriptions(
  userId: string,
  onData: (subscriptions: Subscription[]) => void,
  onError?: (error: Error) => void
) {
  const userSubPath = getSubscriptionsPath(userId);
  const qUserSub = query(collection(db, userSubPath));

  const unsubscribe = onSnapshot(
    qUserSub,
    (snapshot) => {
      const result: Subscription[] = [];
      snapshot.forEach((docSnap) => {
        const sub = normalizeSubscriptionDoc(docSnap.id, docSnap.data(), userId);
        result.push(sub);
      });

      // Sort by creation or update timestamp (newest first)
      result.sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });

      onData(result);
    },
    (error) => {
      console.error('Error fetching users/{userId}/subscriptions:', error);
      if (onError) onError(error as Error);
    }
  );

  return () => {
    unsubscribe();
  };
}

export async function createSubscription(
  userId: string,
  subData: Omit<Subscription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  customId?: string | number
): Promise<string> {
  const numericId = customId !== undefined ? String(customId) : String(Date.now());
  const path = `users/${userId}/subscriptions/${numericId}`;
  try {
    const userDocRef = doc(db, 'users', userId, 'subscriptions', numericId);
    const payload = toAndroidSubscriptionPayload({ ...subData, id: numericId }, userId);
    await setDoc(userDocRef, payload, { merge: true });

    // Also sync members subcollections for maximum Android Room sync compatibility
    if (payload.members && Array.isArray(payload.members)) {
      const subcollectionPromises: Promise<any>[] = [];
      for (const mItem of payload.members) {
        const memDocId = String(mItem.id);
        const memPayload = {
          ...mItem,
          subscriptionId: numericId,
          subscription_id: numericId,
          userId,
          user_id: userId,
        };
        subcollectionPromises.push(
          setDoc(doc(db, 'users', userId, 'subscriptions', numericId, 'members', memDocId), memPayload, { merge: true }).catch(() => {})
        );
      }
      await Promise.allSettled(subcollectionPromises);
    }

    return numericId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function updateSubscription(
  userId: string,
  subId: string | number,
  subData: Partial<Subscription>
): Promise<void> {
  const docId = String(subId);
  const userDocRef = doc(db, 'users', userId, 'subscriptions', docId);
  const payload = toAndroidSubscriptionPayload({ ...subData, id: docId }, userId);

  try {
    await setDoc(userDocRef, payload, { merge: true });

    // Sync member subcollections concurrently in background
    if (payload.members && Array.isArray(payload.members)) {
      const subcollectionPromises: Promise<any>[] = [];
      for (const mItem of payload.members) {
        const memDocId = String(mItem.id);
        const memPayload = {
          ...mItem,
          subscriptionId: docId,
          subscription_id: docId,
          userId,
          user_id: userId,
        };
        subcollectionPromises.push(
          setDoc(doc(db, 'users', userId, 'subscriptions', docId, 'members', memDocId), memPayload, { merge: true }).catch(() => {})
        );
      }
      await Promise.allSettled(subcollectionPromises);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/subscriptions/${docId}`);
    throw error;
  }
}

export async function deleteSubscription(
  userId: string,
  subId: string
): Promise<void> {
  const docId = String(subId);
  try {
    // 1. Obtener y borrar todos los documentos de la subcolección members
    const membersCollectionRef = collection(db, 'users', userId, 'subscriptions', docId, 'members');
    const membersSnapshot = await getDocs(membersCollectionRef);
    if (!membersSnapshot.empty) {
      const deleteMemberPromises = membersSnapshot.docs.map((memberDoc) => deleteDoc(memberDoc.ref));
      await Promise.all(deleteMemberPromises);
    }

    // 2. Borrar el documento principal de la suscripción
    await deleteDoc(doc(db, 'users', userId, 'subscriptions', docId));

    // 3. Borrar el logo personalizado de Storage si existe (ignorar si no hay)
    try {
      await deleteObject(storageRef(storage, `users/${userId}/subscriptions/${docId}/custom_logo.jpg`));
    } catch (err: any) {
      if (err?.code !== 'storage/object-not-found') {
        console.warn('No se pudo borrar el logo de Storage:', err);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/subscriptions/${docId}`);
    throw error;
  }
}

export async function updateSubscriptionMembers(
  userId: string,
  subId: string | number,
  updatedMembers: Member[]
): Promise<void> {
  const docId = String(subId);
  const formattedMembers = formatMembersForFirestore(updatedMembers);
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();

  const updateData = {
    members: formattedMembers,
    updatedAt: nowIso,
    updated_at: nowIso,
    updatedAtMs: nowMs,
    lastUpdated: nowMs,
  };

  const userDocRef = doc(db, 'users', userId, 'subscriptions', docId);

  try {
    await setDoc(userDocRef, updateData, { merge: true });

    // Concurrently update members subcollection and delete orphaned members
    const backgroundTasks: Promise<any>[] = [];
    const validMemberIdSet = new Set(formattedMembers.map((mItem) => String(mItem.id)));

    const membersCollectionRef = collection(db, 'users', userId, 'subscriptions', docId, 'members');
    const existingMembersSnapshot = await getDocs(membersCollectionRef);

    for (const memberDoc of existingMembersSnapshot.docs) {
      if (!validMemberIdSet.has(memberDoc.id)) {
        backgroundTasks.push(
          deleteDoc(memberDoc.ref).catch(() => {})
        );
      }
    }

    for (const mItem of formattedMembers) {
      const memDocId = String(mItem.id);
      const memPayload = {
        ...mItem,
        subscriptionId: docId,
        subscription_id: docId,
        userId,
        user_id: userId,
        updatedAt: nowIso,
        updated_at: nowIso,
      };
      backgroundTasks.push(
        setDoc(doc(db, 'users', userId, 'subscriptions', docId, 'members', memDocId), memPayload, { merge: true }).catch(() => {})
      );
    }

    await Promise.allSettled(backgroundTasks);
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/subscriptions/${docId}`);
  }
}

export async function toggleMemberPaymentStatus(
  userId: string,
  subId: string,
  currentMembers: Member[],
  memberId: string
): Promise<void> {
  const updatedMembers = currentMembers.map((m) => {
    if (m.id === memberId) {
      const nextPaid = !m.isPaidThisMonth;
      return {
        ...m,
        isPaidThisMonth: nextPaid,
        isPendingPayment: !nextPaid,
        paymentStatus: (nextPaid ? 'paid' : 'pending') as PaymentStatus,
        lastPaymentDate: nextPaid ? new Date().toISOString().split('T')[0] : m.lastPaymentDate,
      };
    }
    return m;
  });

  await updateSubscriptionMembers(userId, subId, updatedMembers);
}

export async function toggleMemberPendingPayment(
  userId: string,
  subId: string,
  currentMembers: Member[],
  memberId: string
): Promise<void> {
  const updatedMembers = currentMembers.map((m) => {
    if (m.id === memberId) {
      const nextPending = !m.isPendingPayment;
      return {
        ...m,
        isPendingPayment: nextPending,
        isPaidThisMonth: !nextPending,
        paymentStatus: (!nextPending ? 'paid' : 'pending') as PaymentStatus,
      };
    }
    return m;
  });

  await updateSubscriptionMembers(userId, subId, updatedMembers);
}

export async function toggleMemberPendingRemoval(
  userId: string,
  subId: string,
  currentMembers: Member[],
  memberId: string
): Promise<void> {
  const updatedMembers = currentMembers.map((m) => {
    if (m.id === memberId) {
      return {
        ...m,
        isPendingRemoval: !m.isPendingRemoval,
      };
    }
    return m;
  });

  await updateSubscriptionMembers(userId, subId, updatedMembers);
}

export async function toggleMemberPendingRegistration(
  userId: string,
  subId: string,
  currentMembers: Member[],
  memberId: string
): Promise<void> {
  const updatedMembers = currentMembers.map((m) => {
    if (m.id === memberId) {
      return {
        ...m,
        isPendingRegistration: !m.isPendingRegistration,
      };
    }
    return m;
  });

  await updateSubscriptionMembers(userId, subId, updatedMembers);
}

export async function markAllSubscriptionMembersAsPaid(
  userId: string,
  subId: string,
  currentMembers: Member[]
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const updatedMembers = currentMembers.map((m) => ({
    ...m,
    isPaidThisMonth: true,
    isPendingPayment: false,
    paymentStatus: 'paid' as PaymentStatus,
    lastPaymentDate: today,
  }));

  await updateSubscriptionMembers(userId, subId, updatedMembers);
}

// Generate Android BackupManager JSON (Version 2)
export function generateAndroidBackupJson(subscriptions: Subscription[]): string {
  const now = Date.now();
  const dateStr = new Date(now).toISOString().replace('T', ' ').slice(0, 19);

  const flatMembers: any[] = [];
  const subsArray: any[] = [];

  let subCounter = 1;
  let memberCounter = 1;

  for (const sub of subscriptions) {
    const subNumericId = subCounter++;
    subsArray.push({
      id: subNumericId,
      platformName: sub.platformName || sub.name || 'Suscripción',
      customPlanName: sub.customPlanName || sub.plan || '',
      mainUserName: sub.mainUserName || '',
      mainUserContact: sub.mainUserContact || '',
      cost: sub.cost || 0.0,
      billingPeriod: sub.billingPeriod || (sub.billingCycle ? mapBillingPeriod(sub.billingCycle) : 'MONTHLY'),
      billingDay: sub.billingDay || 1,
      billingMonth: sub.billingMonth || 1,
      currency: sub.currency || 'EUR',
      defaultContributionPerUser: sub.defaultContributionPerUser || 0.0,
      platformPricing: sub.platformPricing || '',
      category: sub.category || 'Streaming',
      notes: sub.notes || '',
      iconType: sub.iconType || 'PRESET',
      iconKey: sub.iconKey || sub.icon || sub.name || 'Netflix',
      customImageUri: sub.customImageUri || '',
      customImageBase64: sub.customImageBase64 || '',
      iconColorHex: sub.iconColorHex || sub.color || '#1285FA',
      createdAt: now,
    });

    for (const m of sub.members || []) {
      flatMembers.push({
        id: memberCounter++,
        subscriptionId: subNumericId,
        memberName: m.memberName || m.name || 'Usuario',
        sharingPlatform: m.sharingPlatform || m.platform || '',
        memberContact: m.memberContact || m.contact || '',
        joinedDate: now,
        contributionAmount: m.contributionAmount ?? m.amount ?? 0.0,
        isPaidThisMonth: m.isPaidThisMonth ?? (m.paymentStatus === 'paid'),
        isPendingPayment: m.isPendingPayment ?? (m.paymentStatus === 'pending'),
        isPendingRemoval: Boolean(m.isPendingRemoval),
        isPendingRegistration: Boolean(m.isPendingRegistration),
        notes: m.notes || '',
      });
    }
  }

  const backupRoot: AndroidBackupJson = {
    version: 2,
    appName: 'GestorSuscripciones',
    timestamp: now,
    exportDate: dateStr,
    subscriptionsCount: subsArray.length,
    membersCount: flatMembers.length,
    subscriptions: subsArray,
    members: flatMembers,
  };

  return JSON.stringify(backupRoot, null, 2);
}

// Parse Android Backup JSON for preview
export function parseAndroidBackupPreview(jsonString: string): BackupPreview {
  try {
    const root = JSON.parse(jsonString);
    const subs = Array.isArray(root.subscriptions) ? root.subscriptions : [];
    const members = Array.isArray(root.members) ? root.members : [];

    return {
      exportDate: root.exportDate || 'Fecha desconocida',
      subscriptionsCount: subs.length,
      membersCount: members.length,
      sampleSubscriptions: subs.slice(0, 5).map((s: any) => s.platformName || s.name || 'Suscripción'),
      isValid: subs.length > 0 || members.length >= 0,
      errorMessage: null,
    };
  } catch (err: any) {
    return {
      exportDate: '',
      subscriptionsCount: 0,
      membersCount: 0,
      sampleSubscriptions: [],
      isValid: false,
      errorMessage: 'Archivo de copia de seguridad no válido o dañado',
    };
  }
}

// Restore from Android Backup JSON to Firestore
export async function restoreAndroidBackupToFirestore(
  userId: string,
  jsonString: string,
  replaceExisting: boolean = false,
  existingSubscriptions: Subscription[] = []
): Promise<{ success: boolean; subscriptionsRestored: number; membersRestored: number; errorMessage?: string }> {
  try {
    const root = JSON.parse(jsonString);
    const rawSubs: any[] = Array.isArray(root.subscriptions) ? root.subscriptions : [];
    const rawMembers: any[] = Array.isArray(root.members) ? root.members : [];

    if (replaceExisting && existingSubscriptions.length > 0) {
      for (const sub of existingSubscriptions) {
        await deleteSubscription(userId, sub.id);
      }
    }

    const batch = writeBatch(db);
    const path = getSubscriptionsPath(userId);
    let subsRestored = 0;
    let membersRestored = 0;

    for (const rawSub of rawSubs) {
      const subNumericId = rawSub.id;
      const associatedMembers = rawMembers.filter((m) => m.subscriptionId === subNumericId);
      
      const combinedData: any = {
        ...rawSub,
        members: associatedMembers,
      };

      const normalized = normalizeSubscriptionDoc(String(subNumericId), combinedData, userId);
      const payload = toAndroidSubscriptionPayload(normalized, userId);

      const newDocRef = doc(collection(db, path));
      batch.set(newDocRef, payload);
      subsRestored++;
      membersRestored += associatedMembers.length;
    }

    await batch.commit();

    return {
      success: true,
      subscriptionsRestored: subsRestored,
      membersRestored: membersRestored,
    };
  } catch (err: any) {
    return {
      success: false,
      subscriptionsRestored: 0,
      membersRestored: 0,
      errorMessage: err?.message || 'Error al restaurar la copia de seguridad',
    };
  }
}

export async function batchImportSubscriptions(
  userId: string,
  subscriptions: Omit<Subscription, 'id' | 'userId'>[]
): Promise<number> {
  const batch = writeBatch(db);
  const path = getSubscriptionsPath(userId);

  let count = 0;
  for (const sub of subscriptions) {
    const newDocRef = doc(collection(db, path));
    const payload = toAndroidSubscriptionPayload(sub, userId);
    batch.set(newDocRef, payload);
    count++;
  }

  try {
    await batch.commit();
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// --- Invitaciones ---
function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0/O, 1/I/L
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

export function formatInviteCode(code: string): string {
  return code && code.length === 6 ? `${code.slice(0, 3)}-${code.slice(3)}` : code;
}

export async function createInvite(subscription: Subscription, memberId: string): Promise<string> {
  let code = generateInviteCode();
  for (let i = 0; i < 5; i++) {
    const snap = await getDoc(doc(db, 'invites', code));
    if (!snap.exists()) break;
    code = generateInviteCode();
  }
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await setDoc(doc(db, 'invites', code), {
    code,
    groupId: String(subscription.id),
    memberId: String(memberId),
    ownerUid: subscription.userId || '',
    consumed: false,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
  return code;
}

export async function deleteInvite(code: string): Promise<void> {
  if (!code) return;
  try {
    await deleteDoc(doc(db, 'invites', code));
  } catch (e) {
    console.warn('No se pudo borrar la invitación:', e);
  }
}

