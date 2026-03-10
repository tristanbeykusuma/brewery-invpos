'use client';

import { Button } from '@/components/ui/button';
import { DollarSign, Coins } from 'lucide-react';
import { useCurrency } from '@/contexts/currency-context';

export function CurrencyToggle() {
  const { currency, toggleCurrency } = useCurrency();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleCurrency}
      className="gap-2"
    >
      {currency === 'IDR' ? (
        <>
          <Coins className="h-4 w-4" />
          <span>IDR</span>
        </>
      ) : (
        <>
          <DollarSign className="h-4 w-4" />
          <span>USD</span>
        </>
      )}
    </Button>
  );
}
