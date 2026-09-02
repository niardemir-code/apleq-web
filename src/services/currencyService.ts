// Currency exchange service with real-time API and offline fallback

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
}

// Fallback rates (1 EUR = X Foreign Currency)
export const DEFAULT_RATES: Record<string, number> = {
  EUR: 1,
  GHS: 15.50, // 1 EUR ≈ 15.50 GHS (Ghanaian Cedi)
  USD: 1.08,  // 1 EUR ≈ 1.08 USD
  GBP: 0.85,  // 1 EUR ≈ 0.85 GBP
  TRY: 39.20, // 1 EUR ≈ 39.20 TRY (Turkish Lira)
  ARS: 1150.0,// 1 EUR ≈ 1150 ARS (Argentine Peso)
  BRL: 6.10,  // 1 EUR ≈ 6.10 BRL (Brazilian Real)
  INR: 93.50, // 1 EUR ≈ 93.50 INR (Indian Rupee)
  NGN: 1720.0,// 1 EUR ≈ 1720 NGN (Nigerian Naira)
  EGP: 53.00, // 1 EUR ≈ 53.00 EGP (Egyptian Pound)
  COP: 4600.0,// 1 EUR ≈ 4600 COP (Colombian Peso)
  MXN: 21.80, // 1 EUR ≈ 21.80 MXN (Mexican Peso)
  JPY: 165.0, // 1 EUR ≈ 165 JPY
  CAD: 1.50,  // 1 EUR ≈ 1.50 CAD
  AUD: 1.68,  // 1 EUR ≈ 1.68 AUD
  CHF: 0.95,  // 1 EUR ≈ 0.95 CHF
  PLN: 4.30,  // 1 EUR ≈ 4.30 PLN
  NOK: 11.60, // 1 EUR ≈ 11.60 NOK (Norwegian Krone)
  SEK: 11.40, // 1 EUR ≈ 11.40 SEK (Swedish Krona)
  CLP: 1040.0,// 1 EUR ≈ 1040 CLP (Chilean Peso)
  CNY: 7.80,  // 1 EUR ≈ 7.80 CNY (Chinese Yuan)
};

const STORAGE_KEY = 'splitzy_exchange_rates';
const CACHE_DURATION_MS = 1000 * 60 * 60 * 6; // 6 hours

/**
 * Normalizes any currency string / symbol into a standard 3-letter ISO code
 */
export function normalizeCurrencyCode(rawCurrency?: string): string {
  if (!rawCurrency) return 'EUR';
  const clean = rawCurrency.trim().toUpperCase();

  if (clean === '€' || clean === 'EUR' || clean === 'EUROS' || clean === 'EURO') {
    return 'EUR';
  }
  if (clean === 'GHS' || clean === 'GH₵' || clean === 'CEDI' || clean === 'CEDIS' || clean.includes('GHA')) {
    return 'GHS';
  }
  if (clean === '$' || clean === 'USD' || clean === 'US$' || clean === 'DOLLAR' || clean === 'DÓLAR') {
    return 'USD';
  }
  if (clean === '£' || clean === 'GBP' || clean === 'POUND' || clean === 'LIBRA') {
    return 'GBP';
  }
  if (clean === 'TRY' || clean === 'TL' || clean === '₺' || clean === 'LIRA') {
    return 'TRY';
  }
  if (clean === 'ARS' || clean.includes('ARS')) {
    return 'ARS';
  }
  if (clean === 'BRL' || clean === 'R$' || clean === 'REAL') {
    return 'BRL';
  }
  if (clean === 'INR' || clean === '₹' || clean === 'RUPEE') {
    return 'INR';
  }
  if (clean === 'NGN' || clean === '₦' || clean === 'NAIRA') {
    return 'NGN';
  }
  if (clean === 'EGP' || clean.includes('EGP')) {
    return 'EGP';
  }
  if (clean === 'COP' || clean.includes('COP')) {
    return 'COP';
  }
  if (clean === 'MXN' || clean.includes('MXN')) {
    return 'MXN';
  }
  if (clean === 'JPY' || clean === '¥') {
    return 'JPY';
  }
  if (clean === 'CAD' || clean === 'C$') {
    return 'CAD';
  }
  if (clean === 'AUD' || clean === 'A$') {
    return 'AUD';
  }
  if (clean === 'CHF') {
    return 'CHF';
  }
  if (clean === 'PLN' || clean === 'ZŁ') {
    return 'PLN';
  }
  if (clean === 'NOK' || clean === 'KR' && rawCurrency?.toUpperCase().includes('NOK')) {
    return 'NOK';
  }
  if (clean === 'SEK' || clean === 'KR' && rawCurrency?.toUpperCase().includes('SEK')) {
    return 'SEK';
  }
  if (clean === 'CLP') {
    return 'CLP';
  }
  if (clean === 'CNY' || clean === 'RMB') {
    return 'CNY';
  }

  return clean;
}

/**
 * Checks if a currency code is EUR / Euro
 */
export function isEur(rawCurrency?: string): boolean {
  const code = normalizeCurrencyCode(rawCurrency);
  return code === 'EUR';
}

/**
 * Fetches latest exchange rates with EUR as base, using localStorage caching and fallbacks
 */
export async function fetchLiveExchangeRates(): Promise<Record<string, number>> {
  // Check cached in localStorage first
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed: { timestamp: number; rates: Record<string, number> } = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION_MS && parsed.rates) {
        return { ...DEFAULT_RATES, ...parsed.rates };
      }
    }
  } catch (e) {
    // Ignore storage parse errors
  }

  // Try live API: open.er-api.com (free, high availability, no API key required)
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/EUR');
    if (response.ok) {
      const data = await response.json();
      if (data && data.rates) {
        const rates: Record<string, number> = {
          ...DEFAULT_RATES,
          ...data.rates,
        };
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              timestamp: Date.now(),
              rates,
            })
          );
        } catch (e) {
          // ignore
        }
        return rates;
      }
    }
  } catch (err) {
    console.warn('Could not fetch live exchange rates, using fallback defaults:', err);
  }

  // Secondary fallback: api.exchangerate-api.com
  try {
    const res2 = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2 && data2.rates) {
        const rates = { ...DEFAULT_RATES, ...data2.rates };
        return rates;
      }
    }
  } catch (e) {
    // Ignore fallback failure
  }

  return DEFAULT_RATES;
}

/**
 * Convert any amount in a given currency to EUR
 */
export function convertToEur(
  amount: number,
  currency: string,
  rates: Record<string, number> = DEFAULT_RATES
): number {
  if (!amount || isNaN(amount) || amount === 0) return 0;
  const code = normalizeCurrencyCode(currency);
  if (code === 'EUR') return amount;

  const rate = rates[code];
  if (rate && rate > 0) {
    return amount / rate;
  }

  // If rate not found, check if DEFAULT_RATES has it
  const defaultRate = DEFAULT_RATES[code];
  if (defaultRate && defaultRate > 0) {
    return amount / defaultRate;
  }

  // Fallback: assume 1:1 if completely unknown
  return amount;
}

/**
 * Get formatted currency representation
 */
export function formatCurrency(amount: number, currency: string = '€'): string {
  const code = normalizeCurrencyCode(currency);
  const symbol = code === 'EUR' ? '€' : code;
  return `${amount.toFixed(2)} ${symbol}`;
}
