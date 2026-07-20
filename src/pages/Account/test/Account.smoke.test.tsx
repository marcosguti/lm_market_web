import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useAuthMock = vi.fn();

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../../components/SEO', () => ({
  default: () => null,
}));

import Account from '../index';

describe('Account page smoke', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: {
        id: 'u1',
        email: 'client@test.com',
        firstName: 'Ana',
        lastName: 'Client',
        numberId: '123',
        type: 'client',
      },
      isLoading: false,
      changePassword: vi.fn(),
      setUser: vi.fn(),
      updateProfile: vi.fn(),
    });
  });

  it('renders account title for authenticated client', async () => {
    render(
      <MemoryRouter>
        <Account />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Mi cuenta')).toBeInTheDocument();
  });

  it('shows personal data expanded and password collapsed by default', async () => {
    render(
      <MemoryRouter>
        <Account />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Datos personales')).toBeInTheDocument();
    expect(screen.getByText('Cambiar contraseña')).toBeInTheDocument();
    expect(screen.getByText('Dirección de entrega')).toBeInTheDocument();
    expect(screen.getByText(/Configurar dirección en mapa/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Contraseña actual')).not.toBeInTheDocument();
  });

  it('reveals password fields after expanding Cambiar contraseña', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Account />
      </MemoryRouter>,
    );

    await screen.findByText('Datos personales');
    await user.click(screen.getByText('Cambiar contraseña'));

    expect(await screen.findByLabelText('Contraseña actual')).toBeInTheDocument();
    expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument();
  });

  it('shows map address configuration section', async () => {
    render(
      <MemoryRouter>
        <Account />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Dirección de entrega')).toBeInTheDocument();
    expect(screen.getByText(/Confirmar dirección/i)).toBeInTheDocument();
    expect(screen.getByText(/Configurar dirección en mapa/i)).toBeInTheDocument();
  });
});
