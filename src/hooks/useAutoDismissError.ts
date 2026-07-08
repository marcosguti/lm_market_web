import { useEffect } from 'react';

const DEFAULT_ERROR_DISMISS_MS = 3000;

export function useAutoDismissError(
  error: string,
  onClear: () => void,
  timeoutMs: number = DEFAULT_ERROR_DISMISS_MS,
): void {
  useEffect(() => {
    if (!error) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      onClear();
    }, timeoutMs);

    return () => clearTimeout(timerId);
  }, [error, onClear, timeoutMs]);
}
