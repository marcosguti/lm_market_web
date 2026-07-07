import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Header from '../index';

const useAuthMock = vi.fn();

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../../../realtime/socket', () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
}));

describe('Header RBAC menu', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it('shows account entry for authenticated client', () => {
    useAuthMock.mockReturnValue({
      user: { firstName: 'Ana', lastName: 'Client', type: 'client' },
      isLoading: false,
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    expect(screen.getByText('Mi cuenta')).toBeInTheDocument();
  });

  it('shows account entry for authenticated admin', () => {
    useAuthMock.mockReturnValue({
      user: { firstName: 'Admin', lastName: 'User', type: 'admin' },
      isLoading: false,
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    expect(screen.getByText('Mi cuenta')).toBeInTheDocument();
    expect(screen.queryByText('Iniciar sesión')).not.toBeInTheDocument();
  });
});
