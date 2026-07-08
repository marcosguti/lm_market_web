import { describe, expect, it } from 'vitest';

import { formatVerificationCountdown } from '../verificationCountdown';

describe('formatVerificationCountdown', () => {
  it('formats seconds as MM:SS', () => {
    expect(formatVerificationCountdown(0)).toBe('00:00');
    expect(formatVerificationCountdown(65)).toBe('01:05');
    expect(formatVerificationCountdown(1800)).toBe('30:00');
  });
});
