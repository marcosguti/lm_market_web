import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSendVerificationCode = vi.fn();
const mockVerifyEmail = vi.fn();

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    sendVerificationCode: mockSendVerificationCode,
    verifyEmail: mockVerifyEmail,
  }),
}));

vi.mock('../../../components/SEO', () => ({
  default: () => null,
}));

vi.mock('../../../hooks/useVerificationCountdown', () => ({
  useVerificationCountdown: (initialSeconds: number) => ({
    formatted: '30:00',
    resetCountdown: vi.fn(),
    secondsRemaining: initialSeconds,
  }),
}));

import VerifyEmail from '../index';

function renderVerifyEmail(state: Record<string, unknown> = { email: 'a@b.com' }) {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: '/verificar-email',
          state: { verificationContext: 'register', ...state },
        },
      ]}
    >
      <Routes>
        <Route path="/verificar-email" element={<VerifyEmail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('VerifyEmail page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendVerificationCode.mockResolvedValue({ codeExpiresInSeconds: 1800 });
    mockVerifyEmail.mockResolvedValue({});
  });

  it('shows send button before PIN inputs when no code was sent', () => {
    renderVerifyEmail();

    expect(screen.getByRole('button', { name: /enviar código al correo/i })).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows PIN immediately after register when code was sent', () => {
    renderVerifyEmail({ codeSent: true, codeExpiresInSeconds: 1800 });

    expect(screen.queryByRole('button', { name: /enviar código al correo/i })).not.toBeInTheDocument();
    expect(screen.getByText(/código enviado/i)).toBeInTheDocument();
    expect(screen.getByText(/el código expira en/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reenviar código/i })).toBeDisabled();
  });

  it('shows PIN after sending code manually', async () => {
    const user = userEvent.setup();
    renderVerifyEmail();

    await user.click(screen.getByRole('button', { name: /enviar código al correo/i }));

    await waitFor(() => {
      expect(mockSendVerificationCode).toHaveBeenCalledWith('a@b.com');
    });
    expect(screen.getByText(/código enviado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reenviar código/i })).toBeInTheDocument();
  });

  it('shows expired code error from backend and enables resend', async () => {
    const user = userEvent.setup();
    mockVerifyEmail.mockResolvedValue({
      code: 'CODE_EXPIRED',
      error: 'El código expiró. Solicita uno nuevo.',
    });
    renderVerifyEmail({ codeSent: true, codeExpiresInSeconds: 1800 });

    const otpInputs = document.querySelectorAll('.ant-otp-input');
    for (let i = 0; i < 4; i++) {
      await user.type(otpInputs[i] as HTMLElement, String(i + 1));
    }

    await waitFor(() => {
      expect(screen.getByText('El código expiró. Solicita uno nuevo.')).toBeInTheDocument();
    });
    expect(screen.getByRole('alert')).toHaveClass('ant-alert-error');
    expect(screen.getByRole('button', { name: /^reenviar código$/i })).toBeEnabled();
    expect(screen.queryByText(/código enviado/i)).not.toBeInTheDocument();
  });
});
