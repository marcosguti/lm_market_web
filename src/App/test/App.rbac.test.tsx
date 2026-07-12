import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProtectedRoute from '../../components/ProtectedRoute';

const useAuthMock = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

type AuthState = 'guest' | 'client' | 'admin' | 'superAdmin' | 'deliveryDriver';

const AUTH_STATES: AuthState[] = ['guest', 'client', 'admin', 'superAdmin', 'deliveryDriver'];

const ROUTES = [
  { path: '/cuenta', allowedTypes: undefined as string[] | undefined, marker: 'route-cuenta' },
  { path: '/checkout', allowedTypes: ['client'], marker: 'route-checkout' },
  { path: '/mis-compras', allowedTypes: ['client'], marker: 'route-mis-compras' },
  { path: '/orders', allowedTypes: ['admin', 'superAdmin'], marker: 'route-orders' },
  { path: '/users', allowedTypes: ['admin', 'superAdmin'], marker: 'route-users' },
  { path: '/productos', allowedTypes: ['admin', 'superAdmin'], marker: 'route-productos' },
  { path: '/ofertas', allowedTypes: ['admin', 'superAdmin'], marker: 'route-ofertas' },
  { path: '/banners', allowedTypes: ['admin', 'superAdmin'], marker: 'route-banners' },
  { path: '/reparto', allowedTypes: ['deliveryDriver'], marker: 'route-reparto' },
] as const;

function authUser(state: AuthState) {
  if (state === 'guest') return { user: null, isLoading: false };
  return {
    user: { type: state, firstName: 'Test', lastName: 'User' },
    isLoading: false,
  };
}

function shouldAllow(state: AuthState, allowedTypes?: string[]): boolean {
  if (state === 'guest') return false;
  if (!allowedTypes) return true;
  return allowedTypes.includes(state);
}

function renderAppRoute(path: string, allowedTypes: string[] | undefined, marker: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path={path}
          element={
            <ProtectedRoute allowedTypes={allowedTypes}>
              <div>{marker}</div>
            </ProtectedRoute>
          }
        />
        <Route path="/iniciar-sesion" element={<div>login-redirect</div>} />
        <Route path="/" element={<div>home-redirect</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('App protected routes RBAC matrix', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  describe.each(ROUTES)('$path', ({ path, allowedTypes, marker }) => {
    it.each(AUTH_STATES)('%s auth state', (state) => {
      useAuthMock.mockReturnValue(authUser(state));
      renderAppRoute(path, allowedTypes, marker);

      if (shouldAllow(state, allowedTypes)) {
        expect(screen.getByText(marker)).toBeInTheDocument();
        return;
      }

      expect(screen.queryByText(marker)).not.toBeInTheDocument();
      if (state === 'guest') {
        expect(screen.getByText('login-redirect')).toBeInTheDocument();
      } else {
        expect(screen.getByText('home-redirect')).toBeInTheDocument();
      }
    });
  });
});
