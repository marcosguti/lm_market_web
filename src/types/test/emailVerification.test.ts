import { describe, expect, it } from 'vitest';

import {
  isValidEmailVerificationState,
  type EmailVerificationLocationState,
} from '../emailVerification';

describe('emailVerification types', () => {
  it('accepts valid register state', () => {
    const state: EmailVerificationLocationState = {
      email: 'a@b.com',
      verificationContext: 'register',
    };
    expect(isValidEmailVerificationState(state)).toBe(true);
  });

  it('accepts valid login state with optional fields', () => {
    expect(
      isValidEmailVerificationState({
        email: 'a@b.com',
        verificationContext: 'login',
        codeSent: true,
        codeExpiresInSeconds: 1800,
      })
    ).toBe(true);
  });

  it('rejects missing email or context', () => {
    expect(isValidEmailVerificationState(null)).toBe(false);
    expect(isValidEmailVerificationState({ email: 'a@b.com' })).toBe(false);
    expect(
      isValidEmailVerificationState({
        email: '',
        verificationContext: 'register',
      })
    ).toBe(false);
    expect(
      isValidEmailVerificationState({
        email: 'a@b.com',
        verificationContext: 'other',
      })
    ).toBe(false);
  });
});
