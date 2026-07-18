import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProtectedRoute from '../index';

const useAuthMock = vi.fn();

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

function renderRoute(allowedTypes?: string[]) {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute allowedTypes={allowedTypes}>
              <div>Protected content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/iniciar-sesion" element={<div>login-redirect</div>} />
        <Route path="/" element={<div>home-redirect</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it('redirects unauthenticated users to login', () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: false });
    renderRoute(['client']);
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.getByText('login-redirect')).toBeInTheDocument();
  });

  it('renders children for allowed client role', () => {
    useAuthMock.mockReturnValue({
      user: { type: 'client' },
      isLoading: false,
    });
    renderRoute(['client']);
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('redirects admin away from client-only route', () => {
    useAuthMock.mockReturnValue({
      user: { type: 'admin' },
      isLoading: false,
    });
    renderRoute(['client']);
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.getByText('home-redirect')).toBeInTheDocument();
  });

  it('allows superAdmin on admin routes', () => {
    useAuthMock.mockReturnValue({
      user: { type: 'superAdmin' },
      isLoading: false,
    });
    renderRoute(['admin', 'superAdmin']);
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('redirects client away from admin route', () => {
    useAuthMock.mockReturnValue({
      user: { type: 'client' },
      isLoading: false,
    });
    renderRoute(['admin', 'superAdmin']);
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.getByText('home-redirect')).toBeInTheDocument();
  });

  it('redirects deliveryDriver away from client-only route', () => {
    useAuthMock.mockReturnValue({
      user: { type: 'deliveryDriver' },
      isLoading: false,
    });
    renderRoute(['client']);
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.getByText('home-redirect')).toBeInTheDocument();
  });

  it('allows any authenticated user when allowedTypes is omitted', () => {
    useAuthMock.mockReturnValue({
      user: { type: 'admin' },
      isLoading: false,
    });
    renderRoute();
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});
