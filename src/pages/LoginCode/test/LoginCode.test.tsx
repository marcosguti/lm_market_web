import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LoginCode from '../index';

const sendLoginCodeMock = vi.fn();
const verifyLoginCodeMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('../../../components/SEO', () => ({
  default: () => null,
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    sendLoginCode: sendLoginCodeMock,
    verifyLoginCode: verifyLoginCodeMock,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('LoginCode', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    sendLoginCodeMock.mockReset();
    verifyLoginCodeMock.mockReset();
    navigateMock.mockReset();
  });

  it('shows error when email is not registered', async () => {
    sendLoginCodeMock.mockResolvedValue({
      code: 'EMAIL_NOT_REGISTERED',
      error: 'Este correo no está registrado',
    });

    render(
      <MemoryRouter>
        <LoginCode />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
      target: { value: 'missing@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }));

    await waitFor(() => {
      expect(screen.getByText('Este correo no está registrado')).toBeInTheDocument();
    });
  });

  it('shows error when email is not verified', async () => {
    sendLoginCodeMock.mockResolvedValue({
      code: 'EMAIL_NOT_VERIFIED',
      error: 'Debes verificar tu correo antes de iniciar sesión',
    });

    render(
      <MemoryRouter>
        <LoginCode />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
      target: { value: 'unverified@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }));

    await waitFor(() => {
      expect(
        screen.getByText('Debes verificar tu correo antes de iniciar sesión')
      ).toBeInTheDocument();
    });
  });

  it('shows PIN inputs after successful send', async () => {
    sendLoginCodeMock.mockResolvedValue({ codeExpiresInSeconds: 1800 });

    render(
      <MemoryRouter>
        <LoginCode />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
      target: { value: 'client@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }));

    await waitFor(() => {
      expect(screen.getByText(/client@example.com/)).toBeInTheDocument();
      expect(screen.getByLabelText('OTP Input 1')).toBeInTheDocument();
    });
  });
});
