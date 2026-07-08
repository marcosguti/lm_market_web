import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Header from '../index';

const useAuthMock = vi.fn();
const loginMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
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
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
      target: { value: 'client@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(screen.getByText('Verifica tu correo')).toBeInTheDocument();
      expect(screen.getByText(/ya hay un código vigente/i)).toBeInTheDocument();
    });
    expect(
      screen.queryByText('Debes verificar tu correo antes de iniciar sesión')
    ).not.toBeInTheDocument();
  });
});
