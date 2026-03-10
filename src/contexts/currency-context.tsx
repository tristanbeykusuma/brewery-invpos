'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type Currency = 'USD' | 'IDR';

interface CurrencyContextType {
  currency: Currency;
  toggleCurrency: () => void;
  formatCurrency: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('IDR');

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === 'USD' ? 'IDR' : 'USD'));
  };

  const formatCurrency = (amount: number): string => {
    if (currency === 'IDR') {
      const idrAmount = amount * 16000;
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(idrAmount);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
