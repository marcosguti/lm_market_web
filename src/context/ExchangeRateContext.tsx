import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getPaymentConfig } from '../api/payments';
import { DEFAULT_USD_RATE } from '../constants/pricing';

interface ExchangeRateContextValue {
  loading: boolean;
  refresh: () => Promise<void>;
  usdRate: number;
  usdRateUpdatedAt: null | string;
}

const ExchangeRateContext = createContext<ExchangeRateContextValue | null>(null);

export function ExchangeRateProvider({ children }: { children: ReactNode }) {
  const [usdRate, setUsdRate] = useState(DEFAULT_USD_RATE);
  const [usdRateUpdatedAt, setUsdRateUpdatedAt] = useState<null | string>(null);
  const [loading, setLoading] = useState(true);

  const applyConfig = useCallback(async () => {
    try {
      const result = await getPaymentConfig();
      if (result.ok && result.data?.usdRate && result.data.usdRate > 0) {
        setUsdRate(result.data.usdRate);
        setUsdRateUpdatedAt(result.data.usdRateUpdatedAt ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await applyConfig();
  }, [applyConfig]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await getPaymentConfig();
        if (cancelled) return;
        if (result.ok && result.data?.usdRate && result.data.usdRate > 0) {
          setUsdRate(result.data.usdRate);
          setUsdRateUpdatedAt(result.data.usdRateUpdatedAt ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ loading, refresh, usdRate, usdRateUpdatedAt }),
    [loading, refresh, usdRate, usdRateUpdatedAt],
  );

  return <ExchangeRateContext.Provider value={value}>{children}</ExchangeRateContext.Provider>;
}

export function useExchangeRate(): ExchangeRateContextValue {
  const ctx = useContext(ExchangeRateContext);
  if (!ctx) {
    throw new Error('useExchangeRate must be used within ExchangeRateProvider');
  }
  return ctx;
}

/** Safe hook for tests / optional provider: falls back to default rate. */
export function useUsdRate(): number {
  const ctx = useContext(ExchangeRateContext);
  return ctx?.usdRate ?? DEFAULT_USD_RATE;
}
