export type BillingPeriod = 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'YEARLY';
export type BillingCycle = 'monthly' | 'yearly' | 'quarterly' | 'semi_annual';

export const SUBSCRIPTION_CATEGORIES: string[] = [
  'Streaming',
  'Música',
  'Productividad',
  'Gaming',
  'Educación',
  'Salud',
  'Estilo de vida',
  'Seguridad',
  'Finanzas',
  'General',
];

export const SUBSCRIPTION_CURRENCIES: string[] = [
  'GHS',
  'NOK',
  'SEK',
  'AUD',
  'CAD',
  'USD',
  'EUR',
  'CHF',
  'GBP',
  'TRY',
  'ARS',
  'CLP',
  'COP',
  'MXN',
  'BRL',
  'INR',
  'JPY',
  'CNY',
  'PLN',
];

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  label: string;
}

export const CURRENCY_DETAILED_OPTIONS: CurrencyOption[] = [
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', label: '🇪🇺 Euro (EUR) (€ - EUR)' },
  { code: 'USD', name: 'Dólar', symbol: '$', flag: '🇺🇸', label: '🇺🇸 Dólar (USD) ($ - USD)' },
  { code: 'GBP', name: 'Libra', symbol: '£', flag: '🇬🇧', label: '🇬🇧 Libra (GBP) (£ - GBP)' },
  { code: 'MXN', name: 'Peso mexicano', symbol: '$', flag: '🇲🇽', label: '🇲🇽 Peso mexicano (MXN) ($ - MXN)' },
  { code: 'COP', name: 'Peso colombiano', symbol: '$', flag: '🇨🇴', label: '🇨🇴 Peso colombiano (COP) ($ - COP)' },
  { code: 'ARS', name: 'Peso argentino', symbol: '$', flag: '🇦🇷', label: '🇦🇷 Peso argentino (ARS) ($ - ARS)' },
  { code: 'CLP', name: 'Peso chileno', symbol: '$', flag: '🇨🇱', label: '🇨🇱 Peso chileno (CLP) ($ - CLP)' },
  { code: 'PEN', name: 'Sol peruano', symbol: 'S/', flag: '🇵🇪', label: '🇵🇪 Sol peruano (PEN) (S/ - PEN)' },
  { code: 'BRL', name: 'Real brasileño', symbol: 'R$', flag: '🇧🇷', label: '🇧🇷 Real brasileño (BRL) (R$ - BRL)' },
  { code: 'CHF', name: 'Franco suizo', symbol: 'CHF', flag: '🇨🇭', label: '🇨🇭 Franco suizo (CHF) (CHF - CHF)' },
  { code: 'CAD', name: 'Dólar canadiense', symbol: '$', flag: '🇨🇦', label: '🇨🇦 Dólar canadiense (CAD) ($ - CAD)' },
  { code: 'AUD', name: 'Dólar australiano', symbol: '$', flag: '🇦🇺', label: '🇦🇺 Dólar australiano (AUD) ($ - AUD)' },
  { code: 'JPY', name: 'Yen japonés', symbol: '¥', flag: '🇯🇵', label: '🇯🇵 Yen japonés (JPY) (¥ - JPY)' },
  { code: 'TRY', name: 'Lira turca', symbol: '₺', flag: '🇹🇷', label: '🇹🇷 Lira turca (TRY) (₺ - TRY)' },
  { code: 'GHS', name: 'Cedi ghanés', symbol: 'GH₵', flag: '🇬🇭', label: '🇬🇭 Cedi ghanés (GHS) (GH₵ - GHS)' },
  { code: 'NOK', name: 'Corona noruega', symbol: 'kr', flag: '🇳🇴', label: '🇳🇴 Corona noruega (NOK) (kr - NOK)' },
  { code: 'SEK', name: 'Corona sueca', symbol: 'kr', flag: '🇸🇪', label: '🇸🇪 Corona sueca (SEK) (kr - SEK)' },
  { code: 'PLN', name: 'Zloty polaco', symbol: 'zł', flag: '🇵🇱', label: '🇵🇱 Zloty polaco (PLN) (zł - PLN)' },
  { code: 'INR', name: 'Rupia india', symbol: '₹', flag: '🇮🇳', label: '🇮🇳 Rupia india (INR) (₹ - INR)' },
  { code: 'CNY', name: 'Yuan chino', symbol: '¥', flag: '🇨🇳', label: '🇨🇳 Yuan chino (CNY) (¥ - CNY)' },
];

export function getCurrencySymbol(currency?: string): string {
  const code = (currency || 'EUR').trim().toUpperCase();
  const matched = CURRENCY_DETAILED_OPTIONS.find((c) => c.code === code);
  if (matched) return matched.symbol;
  if (code === 'EUR') return '€';
  if (code === 'USD' || code === 'CAD' || code === 'AUD' || code === 'MXN' || code === 'COP' || code === 'ARS' || code === 'CLP') return '$';
  if (code === 'GBP') return '£';
  if (code === 'TRY') return '₺';
  if (code === 'BRL') return 'R$';
  if (code === 'PEN') return 'S/';
  if (code === 'JPY' || code === 'CNY') return '¥';
  if (code === 'INR') return '₹';
  if (code === 'GHS') return 'GH₵';
  if (code === 'PLN') return 'zł';
  if (code === 'CHF') return 'CHF';
  if (code === 'NOK' || code === 'SEK') return 'kr';
  return code;
}

export function getCurrencyFlag(currency?: string): string {
  const code = (currency || 'EUR').trim().toUpperCase();
  const matched = CURRENCY_DETAILED_OPTIONS.find((c) => c.code === code);
  if (matched) return matched.flag;
  if (code === 'EUR') return '🇪🇺';
  if (code === 'USD') return '🇺🇸';
  if (code === 'GBP') return '🇬🇧';
  if (code === 'MXN') return '🇲🇽';
  if (code === 'COP') return '🇨🇴';
  if (code === 'ARS') return '🇦🇷';
  if (code === 'CLP') return '🇨🇱';
  if (code === 'PEN') return '🇵🇪';
  if (code === 'BRL') return '🇧🇷';
  if (code === 'CHF') return '🇨🇭';
  if (code === 'CAD') return '🇨🇦';
  if (code === 'AUD') return '🇦🇺';
  if (code === 'JPY') return '🇯🇵';
  if (code === 'TRY') return '🇹🇷';
  if (code === 'GHS') return '🇬🇭';
  if (code === 'NOK') return '🇳🇴';
  if (code === 'SEK') return '🇸🇪';
  if (code === 'PLN') return '🇵🇱';
  if (code === 'INR') return '🇮🇳';
  if (code === 'CNY') return '🇨🇳';
  return '🌐';
}

export const MONTHS_OF_YEAR: { value: number; label: string }[] = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

export function normalizeBillingPeriod(period?: BillingPeriod | string): 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'YEARLY' {
  if (!period) return 'MONTHLY';
  const p = String(period).trim().toUpperCase();
  if (p === 'YEARLY' || p === 'ANNUAL' || p === 'ANUAL' || p === 'YEAR' || p === 'AÑO' || p === 'ANO') return 'YEARLY';
  if (p === 'QUARTERLY' || p === 'TRIMESTRAL' || p === 'TRIMESTRE' || p === '3_MONTHS' || p === '3M') return 'QUARTERLY';
  if (p === 'SEMI_ANNUAL' || p === 'SEMIANNUAL' || p === 'SEMI_ANNUALLY' || p === 'SEMESTRAL' || p === 'SEMESTRE' || p === '6_MONTHS' || p === '6M') return 'SEMI_ANNUAL';
  return 'MONTHLY';
}

export function parsePlatformPricing(raw?: string): PlatformPriceItem[] {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split('|')
    .map((entry): PlatformPriceItem | null => {
      const parts = entry.split(':');
      if (parts.length < 2) return null;
      const platformName = parts[0].trim();
      const pricePerUser = parseFloat(parts[1]) || 0;
      const currency = (parts[2] && parts[2].trim()) ? parts[2].trim().toUpperCase() : 'EUR';
      const period = (parts[3] && parts[3].trim()) ? normalizeBillingPeriod(parts[3].trim()) : undefined;
      const defaultPaymentMethod = (parts[4] && parts[4].trim()) ? parts[4].trim() : '';
      if (!platformName) return null;
      return { platformName, pricePerUser, currency, period, defaultPaymentMethod };
    })
    .filter((item): item is PlatformPriceItem => item !== null);
}

export function serializePlatformPricing(items: PlatformPriceItem[]): string {
  return items
    .filter((item) => item.platformName.trim())
    .map((item) => {
      const curr = item.currency ? item.currency.trim().toUpperCase() : 'EUR';
      const per = item.period ? normalizeBillingPeriod(item.period) : 'MONTHLY';
      const method = (item.defaultPaymentMethod || '').replace(/[:|]/g, '').trim();
      return `${item.platformName.trim()}:${item.pricePerUser}:${curr}:${per}:${method}`;
    })
    .join('|');
}

export function formatPeriodShort(period?: BillingPeriod | string): string {
  const p = normalizeBillingPeriod(period);
  if (p === 'YEARLY') return 'año';
  if (p === 'SEMI_ANNUAL') return 'sem';
  if (p === 'QUARTERLY') return 'trim';
  return 'mes';
}

export function getMemberPlatformInfo(subscription: Subscription, memberOrPlatformName?: Member | string): {
  name: string;
  currency: string;
  currencySymbol: string;
  period: BillingPeriod | string;
  periodShort: string;
  pricePerUser: number;
} {
  const isMemberObj = typeof memberOrPlatformName === 'object' && memberOrPlatformName !== null;
  const member = isMemberObj ? (memberOrPlatformName as Member) : null;
  const platformName = typeof memberOrPlatformName === 'string'
    ? memberOrPlatformName
    : member?.sharingPlatform || member?.platform || '';

  const parsed = parsePlatformPricing(subscription?.platformPricing);
  const matched = parsed.find(
    (p) => p.platformName.toLowerCase() === platformName.trim().toLowerCase()
  );

  const subPeriod = subscription?.billingPeriod || (subscription?.billingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY') || 'MONTHLY';
  const memberCurrency = member?.currency && member.currency.trim() ? member.currency.trim().toUpperCase() : undefined;
  const currency = memberCurrency || matched?.currency || subscription?.currency || 'EUR';
  
  let periodShort = formatPeriodShort(matched?.period || subPeriod);
  if (member?.paymentFrequencyUnit) {
    const val = member.paymentFrequencyValue || 1;
    const unit = member.paymentFrequencyUnit;
    if (unit === 'days') periodShort = val === 1 ? 'día' : `${val}d`;
    else if (unit === 'weeks') periodShort = val === 1 ? 'sem' : `${val}sem`;
    else if (unit === 'months') periodShort = val === 1 ? 'mes' : `${val}m`;
    else if (unit === 'years') periodShort = val === 1 ? 'año' : `${val}a`;
  }

  const period = matched?.period || subPeriod;
  const currencySymbol = getCurrencySymbol(currency);

  return {
    name: matched?.platformName || platformName || '',
    currency,
    currencySymbol,
    period,
    periodShort,
    pricePerUser: matched?.pricePerUser ?? (subscription?.defaultContributionPerUser || 0),
  };
}

export function getMemberContributionAmount(
  subscription?: Subscription | null,
  member?: Member | null
): number {
  if (!subscription || !member) return 0;
  const raw = member.contributionAmount ?? member.amount;
  if (typeof raw === 'number' && !isNaN(raw) && raw > 0) {
    return raw;
  }
  const mInfo = getMemberPlatformInfo(subscription, member);
  if (typeof mInfo.pricePerUser === 'number' && mInfo.pricePerUser > 0) {
    return mInfo.pricePerUser;
  }
  return typeof raw === 'number' ? raw : parseFloat(String(raw)) || 0;
}

/**
 * Calculates the next upcoming payment date based on join date and payment frequency.
 * Starts from joinedDate + 1 frequency period, and if in the past, advances to the next closest future date.
 */
export function calculateNextPaymentFromJoined(
  joinedDateStr: string,
  freqValue: number = 1,
  freqUnit: PaymentFrequencyUnit = 'months',
  referenceDate: Date = new Date()
): string {
  if (!joinedDateStr) {
    const today = referenceDate || new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    joinedDateStr = `${y}-${m}-${d}`;
  }
  
  const cleanStr = String(joinedDateStr).split('T')[0];
  const parts = cleanStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    const today = referenceDate || new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
  const [y, m, d] = parts;
  
  const baseDate = new Date(y, m - 1, d);
  if (isNaN(baseDate.getTime())) return '';

  const origDay = d;
  const val = Math.max(1, freqValue || 1);
  const refToday = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

  const addPeriod = (currDate: Date, count: number): Date => {
    const result = new Date(currDate);
    if (freqUnit === 'days') {
      result.setDate(result.getDate() + val * count);
    } else if (freqUnit === 'weeks') {
      result.setDate(result.getDate() + val * 7 * count);
    } else if (freqUnit === 'months') {
      const targetMonth = result.getMonth() + val * count;
      const targetYear = result.getFullYear() + Math.floor(targetMonth / 12);
      const normalizedMonth = ((targetMonth % 12) + 12) % 12;
      const maxDays = new Date(targetYear, normalizedMonth + 1, 0).getDate();
      const actualDay = Math.min(origDay, maxDays);
      return new Date(targetYear, normalizedMonth, actualDay);
    } else if (freqUnit === 'years') {
      const targetYear = result.getFullYear() + val * count;
      const maxDays = new Date(targetYear, result.getMonth() + 1, 0).getDate();
      const actualDay = Math.min(origDay, maxDays);
      return new Date(targetYear, result.getMonth(), actualDay);
    }
    return result;
  };

  // Start with at least 1 interval from joinedDate
  let nextDate = addPeriod(baseDate, 1);
  
  // If baseDate was in the past, advance until nextDate >= refToday
  let safetyCounter = 0;
  while (nextDate < refToday && safetyCounter < 1200) {
    safetyCounter++;
    nextDate = addPeriod(nextDate, 1);
  }

  const resY = nextDate.getFullYear();
  const resM = String(nextDate.getMonth() + 1).padStart(2, '0');
  const resD = String(nextDate.getDate()).padStart(2, '0');
  return `${resY}-${resM}-${resD}`;
}

/**
 * Resolves or auto-computes the nextPaymentDate for any member following frequency and join date rules
 */
export function resolveMemberNextPaymentDate(
  memberOrSub: Partial<Member> | Partial<Subscription>,
  subBillingDayOrMember?: number | Partial<Member>,
  referenceDate: Date = new Date()
): string {
  let member: Partial<Member>;
  let subBillingDay: number | undefined;

  if (subBillingDayOrMember && typeof subBillingDayOrMember === 'object') {
    // Called as resolveMemberNextPaymentDate(subscription, member)
    member = subBillingDayOrMember as Partial<Member>;
    subBillingDay = (memberOrSub as Partial<Subscription>).billingDay;
  } else {
    // Called as resolveMemberNextPaymentDate(member, subBillingDay)
    member = memberOrSub as Partial<Member>;
    subBillingDay = typeof subBillingDayOrMember === 'number' ? subBillingDayOrMember : undefined;
  }

  if (member.nextPaymentDate && String(member.nextPaymentDate).trim() !== '') {
    return String(member.nextPaymentDate).split('T')[0];
  }
  const freqVal = member.paymentFrequencyValue || 1;
  const freqUnit = member.paymentFrequencyUnit || 'months';
  
  const rawJoin = member.joinedDate || (member as any).createdAt;
  const joinDate = rawJoin ? String(rawJoin).split('T')[0] : '';
  if (joinDate) {
    const calc = calculateNextPaymentFromJoined(joinDate, freqVal, freqUnit, referenceDate);
    if (calc) return calc;
  }

  // Fallback using sub billing day
  const today = referenceDate || new Date();
  const targetDay = (subBillingDay && subBillingDay >= 1 && subBillingDay <= 31) ? subBillingDay : today.getDate();
  const curMonthTarget = new Date(today.getFullYear(), today.getMonth(), targetDay);
  if (curMonthTarget >= today) {
    const y = curMonthTarget.getFullYear();
    const m = String(curMonthTarget.getMonth() + 1).padStart(2, '0');
    const d = String(curMonthTarget.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } else {
    const nextMonthTarget = new Date(today.getFullYear(), today.getMonth() + freqVal, targetDay);
    const y = nextMonthTarget.getFullYear();
    const m = String(nextMonthTarget.getMonth() + 1).padStart(2, '0');
    const d = String(nextMonthTarget.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/**
 * Resolves or auto-computes the next renewal/billing date for a subscription
 */
export function resolveSubscriptionNextRenewalDate(
  sub: Partial<Subscription>,
  referenceDate: Date = new Date()
): string {
  if (sub.renewalDate && String(sub.renewalDate).trim() !== '') {
    return String(sub.renewalDate).split('T')[0];
  }
  const today = referenceDate || new Date();
  today.setHours(0, 0, 0, 0);
  const curYear = today.getFullYear();
  const curMonth = today.getMonth();
  const bDay = Math.min(31, Math.max(1, sub.billingDay || 1));
  const bMonth = Math.min(12, Math.max(1, sub.billingMonth || 1)) - 1;
  const period = normalizeBillingPeriod(sub.billingPeriod || sub.billingCycle);

  const getValidDate = (y: number, m: number, d: number): Date => {
    const maxDays = new Date(y, m + 1, 0).getDate();
    return new Date(y, m, Math.min(d, maxDays));
  };

  if (period === 'MONTHLY') {
    let candidate = getValidDate(curYear, curMonth, bDay);
    if (candidate < today) {
      candidate = getValidDate(curYear, curMonth + 1, bDay);
    }
    const y = candidate.getFullYear();
    const m = String(candidate.getMonth() + 1).padStart(2, '0');
    const d = String(candidate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const stepMonths = period === 'QUARTERLY' ? 3 : period === 'SEMI_ANNUAL' ? 6 : 12;
  let candidate = getValidDate(curYear, bMonth, bDay);
  let safety = 0;
  while (candidate < today && safety < 100) {
    safety++;
    const nextTotalMonth = candidate.getMonth() + stepMonths;
    const nextYear = candidate.getFullYear() + Math.floor(nextTotalMonth / 12);
    const nextMonth = nextTotalMonth % 12;
    candidate = getValidDate(nextYear, nextMonth, bDay);
  }

  const y = candidate.getFullYear();
  const m = String(candidate.getMonth() + 1).padStart(2, '0');
  const d = String(candidate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export type Category = 
  | 'Streaming'
  | 'Música'
  | 'Productividad'
  | 'Gaming'
  | 'Educación'
  | 'Salud'
  | 'Estilo de vida'
  | 'Seguridad'
  | 'Finanzas'
  | 'General'
  | string;

export type SharingPlatform = string;

export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export interface SharingPlatformEntity {
  id: number | string;
  name: string;
  colorHex: string;
  displayOrder?: number;
}

export interface PlatformPriceItem {
  platformName: string;
  pricePerUser: number;
  currency?: string;
  period?: BillingPeriod | string;
  defaultPaymentMethod?: string;
}

export type PaymentFrequencyUnit = 'days' | 'weeks' | 'months' | 'years';
export type AlarmUnit = 'same_day' | 'hours' | 'days' | 'weeks' | 'months';

export interface Member {
  id: string;
  subscriptionId?: string | number;
  linkedUid?: string | null; // UID del usuario real que ocupa esta plaza (null = miembro manual)
  inviteCode?: string | null; // Código si es una plaza reservada pendiente de aceptar
  name?: string; // Web alias
  memberName: string; // Android exact
  platform?: string; // Web alias
  sharingPlatform: string; // Android exact (Sharesub, Together Price, etc.)
  contact?: string; // Web alias
  memberContact?: string; // Android exact (Email o teléfono)
  amount?: number; // Web alias
  contributionAmount: number; // Android exact (Dinero que aporta este usuario)
  currency?: string; // Moneda del importe aportado (ej. EUR, USD, TRY)
  isPaidThisMonth: boolean; // Si ya ha pagado la cuota corriente
  isPendingPayment: boolean; // Interruptor: Pendiente de pago (resalta en amarillo)
  isPendingRemoval: boolean; // Interruptor: Pendiente eliminar (resalta en rojo)
  isPendingRegistration: boolean; // Interruptor: Pendiente dar de alta (resalta en azul)
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  nextPaymentDate?: string; // YYYY-MM-DD Fecha del próximo pago
  paymentFrequencyValue?: number; // Número de periodicidad (ej. 1, 2, 3...)
  paymentFrequencyUnit?: PaymentFrequencyUnit; // 'days' | 'weeks' | 'months' | 'years'
  autoRepeatPayment?: boolean; // Si se repite automáticamente con la frecuencia establecida
  enableAlarm?: boolean; // Si tiene alarma activada para avisar al gestor
  alarmValue?: number; // Cantidad de antelación configurable (ej. 1, 2, 3...)
  alarmUnit?: AlarmUnit; // Unidad de antelación ('hours' | 'days' | 'weeks' | 'months')
  alarmDaysBefore?: number; // Antelación en días (compatibilidad)
  joinedDate: string | number; // Timestamp or YYYY-MM-DD
  lastPaymentDate?: string;
  notes?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  name?: string; // Web alias
  platformName: string; // Android exact (Nombre del servicio / suscripción)
  plan?: string; // Legacy
  customPlanName?: string; // Legacy
  mainUserName: string; // Titular / Administrador principal
  showMainUserToMembers?: boolean; // Si el gestor permite que los clientes vean el Titular/Usuario principal
  mainUserContact?: string; // Contacto del titular
  category: Category;
  cost: number; // Dinero que me cuesta a mí la suscripción completa
  billingCycle?: BillingCycle;
  billingPeriod: BillingPeriod; // 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'YEARLY'
  currency: string; // 'EUR', 'GHS', 'USD', '€', '$', etc.
  billingDay: number; // Día del mes en que se factura (1-31)
  freeSlots?: number; // Nº de huecos libres. Capacidad = 1 (gestor) + freeSlots
  billingMonth?: number; // Mes de cobro/inicio del ciclo (1-12)
  defaultContributionPerUser?: number; // Aporte sugerido por usuario
  platformPricing?: string; // Serializado de hasta 3 plataformas con precio: "Sharesub:3.50|Spliiit:4.00"
  renewalDate?: string;
  enableAlarm?: boolean; // Si tiene alarma activada para avisar de la renovación/cobro
  alarmValue?: number; // Cantidad de antelación configurable (ej. 1, 2, 3...)
  alarmUnit?: AlarmUnit; // Unidad de antelación ('same_day' | 'hours' | 'days' | 'weeks' | 'months')
  alarmDaysBefore?: number; // Antelación en días (compatibilidad)
  notes?: string;
  members: Member[];
  memberUids?: string[]; // Espejo de UIDs de plazas reclamadas (para "Participo en"). Se rellenará al reclamar.
  color?: string; // Hex color
  iconColorHex: string; // Android exact (#1285FA)
  iconType: 'PRESET' | 'VECTOR' | 'CUSTOM_IMAGE' | string;
  iconKey: string; // Key from icon library or preset
  customImageUri?: string;
  customImageBase64?: string;
  icon?: string;
  createdAt: string | number;
  updatedAt?: string;
}

export interface FinancialOverview {
  totalCost: number; // Gasto mensual en euros
  totalContributed: number; // Aporte mensual en euros
  netBalance: number; // Ganancia neta / balance neto mensual
  totalSubscriptionsCount: number;
  totalMembersCount: number;
  pendingPaymentsCount: number;
  pendingAmount: number;
  profitSubscriptionsCount: number;
}

export interface AndroidBackupJson {
  version: number;
  appName: string;
  timestamp: number;
  exportDate: string;
  subscriptionsCount: number;
  membersCount: number;
  subscriptions: any[];
  members: any[];
}

export interface BackupPreview {
  exportDate: string;
  subscriptionsCount: number;
  membersCount: number;
  sampleSubscriptions: string[];
  isValid: boolean;
  errorMessage?: string | null;
}

export interface SharingPlatformInfo {
  name: string;
  color: string;
  baseColor: string;
  badgeBgColor: string;
  badgeTextColor: string;
  description?: string;
}

export type AppThemeMode = 'SYSTEM' | 'LIGHT' | 'DARK';

export interface FilterOptions {
  search: string;
  category: string; // 'ALL' or specific Category
  platform: string; // 'ALL' or specific SharingPlatform
  paymentStatus: string; // 'ALL', 'has_pending', 'has_overdue', 'all_paid', 'empty_slots'
  sortBy: 'renewal' | 'recent' | 'name' | 'name_desc' | 'cost_desc' | 'cost_asc' | 'savings_desc' | 'default';
}
