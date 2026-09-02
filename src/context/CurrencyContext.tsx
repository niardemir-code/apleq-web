import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  fetchLiveExchangeRates, 
  convertToEur as convertFn, 
  DEFAULT_RATES, 
  normalizeCurrencyCode,
  isEur as isEurFn
} from '../services/currencyService';

interface CurrencyContextType {
  rates: Record<string, number>;
  loading: boolean;
  convertToEur: (amount: number, currency: string) => number;
  isEur: (currency?: string) => boolean;
  normalizeCurrency: (currency?: string) => string;
  refreshRates: () => Promise<void>;
  getRateFor: (currency: string) => number;
}

const CurrencyContext = createContext<CurrencyContextType>({
  rates: DEFAULT_RATES,
  loading: false,
  convertToEur: (amount: number, currency: string) => convertFn(amount, currency, DEFAULT_RATES),
  isEur: isEurFn,
  normalizeCurrency: normalizeCurrencyCode,
  refreshRates: async () => {},
  getRateFor: () => 1,
});

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES);
  const [loading, setLoading] = useState<boolean>(true);

  const loadRates = async () => {
    try {
      setLoading(true);
      const liveRates = await fetchLiveExchangeRates();
      setRates(liveRates);
    } catch (err) {
      console.warn('Currency provider failed to load rates, using fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
    // Refresh every 30 minutes
    const interval = setInterval(loadRates, 1000 * 60 * 30);
    return () => clearInterval(interval);
  }, []);

  const convertToEurHandler = (amount: number, currency: string): number => {
    return convertFn(amount, currency, rates);
  };

  const getRateFor = (currency: string): number => {
    const code = normalizeCurrencyCode(currency);
    return rates[code] || DEFAULT_RATES[code] || 1;
  };

  return (
    <CurrencyContext.Provider
      value={{
        rates,
        loading,
        convertToEur: convertToEurHandler,
        isEur: isEurFn,
        normalizeCurrency: normalizeCurrencyCode,
        refreshRates: loadRates,
        getRateFor,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
