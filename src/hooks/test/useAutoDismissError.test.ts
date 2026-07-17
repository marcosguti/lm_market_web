import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAutoDismissError } from '../useAutoDismissError';

describe('useAutoDismissError', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears error after 3 seconds', () => {
    const onClear = vi.fn();
    const { rerender } = renderHook(
      ({ error }) => useAutoDismissError(error, onClear),
      { initialProps: { error: 'El código expiró' } },
    );

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(onClear).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onClear).toHaveBeenCalledTimes(1);

    rerender({ error: '' });
  });
});
