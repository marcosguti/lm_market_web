import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Login from '../index';

const loginMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ login: loginMock }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('Login RBAC redirect', () => {
  beforeEach(() => {
    loginMock.mockReset();
    navigateMock.mockReset();
  });

  it('navigates to original route after successful login', async () => {
    loginMock.mockResolvedValue({});
    render(
      <MemoryRouter initialEntries={[{ pathname: '/iniciar-sesion', state: { from: { pathname: '/checkout' } } }]}>
        <Routes>
          <Route path="/iniciar-sesion" element={<Login />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
      target: { value: 'client@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Tu contraseña'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/checkout', { replace: true });
    });
  });
});
