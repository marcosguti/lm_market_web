export type EmailVerificationContext = 'register' | 'login';

export interface EmailVerificationLocationState {
  email: string;
  verificationContext: EmailVerificationContext;
  codeSent?: boolean;
  codeExpiresInSeconds?: number;
}

export function isValidEmailVerificationState(
  state: unknown
): state is EmailVerificationLocationState {
  if (!state || typeof state !== 'object') {
    return false;
  }

  const candidate = state as Record<string, unknown>;
  const context = candidate.verificationContext;

  return (
    typeof candidate.email === 'string' &&
    candidate.email.trim().length > 0 &&
    (context === 'register' || context === 'login')
  );
}
