import { useCallback, useEffect, useState } from 'react';

import { formatVerificationCountdown } from '../utils/verificationCountdown';

export function useVerificationCountdown(initialSeconds: number) {
  const [secondsRemaining, setSecondsRemaining] = useState(Math.max(0, initialSeconds));

  useEffect(() => {
    setSecondsRemaining(Math.max(0, initialSeconds));
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerId);
  }, [secondsRemaining]);

  const resetCountdown = useCallback((seconds: number) => {
    setSecondsRemaining(Math.max(0, seconds));
  }, []);

  return {
    formatted: formatVerificationCountdown(secondsRemaining),
    resetCountdown,
    secondsRemaining,
  };
}
