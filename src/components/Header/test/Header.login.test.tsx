import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Header from '../index';

const useAuthMock = vi.fn();
const loginMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../../context/CartContext', () => ({
  useCart: () => ({
    cart: [],
    cartSubtotal: 0,
    clearCart: vi.fn(),
    flushCartSync: vi.fn(),
    removeFromCart: vi.fn(),
    totalItemCount: 0,
    updateQuantity: vi.fn(),
  }),
}));

vi.mock('../../../api/notifications', () => ({
  getNotifications: vi.fn().mockResolvedValue({ ok: true, data: { data: [] } }),
  markNotificationRead: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../../realtime/socket', () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
}));

vi.mock('../../../components/VerifyEmailLoginModal', () => ({
  default: ({
    email,
    open,
  }: {
    email: string;
    open: boolean;
  }) =>
    open ? (
      <div role="dialog">
        <p>Verifica tu correo</p>
        <p>Ya hay un código vigente. Revisa tu bandeja de entrada.</p>
        <p>{email}</p>
      </div>
    ) : null,
}));

describe('Header login modal', () => {
  beforeEach(() => {
    loginMock.mockReset();
    navigateMock.mockReset();
    useAuthMock.mockReturnValue({
      user: null,
      isLoading: false,
      login: loginMock,
      logout: vi.fn(),
    });
  });

  it('opens verify email flow when login returns EMAIL_NOT_VERIFIED', async () => {
    loginMock.mockResolvedValue({
      code: 'EMAIL_NOT_VERIFIED',
      codeExpiresInSeconds: 900,
      email: 'client@test.com',
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByPlaceholderText('tu@email.com'), {
      target: { value: 'client@test.com' },
    });
    fireEvent.change(within(dialog).getByPlaceholderText('••••••••'), {
      target: { value: 'secret' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(screen.getByText('Verifica tu correo')).toBeInTheDocument();
      expect(screen.getByText(/ya hay un código vigente/i)).toBeInTheDocument();
    });
    expect(
      screen.queryByText('Debes verificar tu correo antes de iniciar sesión')
    ).not.toBeInTheDocument();
  });
});
