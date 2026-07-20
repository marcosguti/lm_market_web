import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProtectedRoute from '../../components/ProtectedRoute';
import { PATHS } from '../../constants/paths';

const useAuthMock = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

type AuthState = 'guest' | 'client' | 'admin' | 'superAdmin' | 'deliveryDriver';

const AUTH_STATES: AuthState[] = ['guest', 'client', 'admin', 'superAdmin', 'deliveryDriver'];

const ROUTES = [
  { path: PATHS.account, allowedTypes: undefined as string[] | undefined, marker: 'route-cuenta' },
  { path: PATHS.checkout, allowedTypes: ['client'], marker: 'route-checkout' },
  { path: PATHS.myOrders, allowedTypes: ['client'], marker: 'route-mis-compras' },
  { path: PATHS.orders, allowedTypes: ['admin', 'superAdmin'], marker: 'route-orders' },
  { path: PATHS.users, allowedTypes: ['admin', 'superAdmin'], marker: 'route-users' },
  { path: PATHS.products, allowedTypes: ['admin', 'superAdmin'], marker: 'route-productos' },
  { path: PATHS.deals, allowedTypes: ['admin', 'superAdmin'], marker: 'route-ofertas' },
  { path: PATHS.banners, allowedTypes: ['admin', 'superAdmin'], marker: 'route-banners' },
  { path: PATHS.blogArticlesAdmin, allowedTypes: ['admin', 'superAdmin'], marker: 'route-blog-articles-admin' },
  { path: PATHS.paymentMethods, allowedTypes: ['superAdmin'], marker: 'route-metodos-pago' },
  { path: PATHS.syncStatus, allowedTypes: ['superAdmin'], marker: 'route-sincronizacion' },
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
        <Route path={PATHS.login} element={<div>login-redirect</div>} />
        <Route path={PATHS.home} element={<div>home-redirect</div>} />
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
