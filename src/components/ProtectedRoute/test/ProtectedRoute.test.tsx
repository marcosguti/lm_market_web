import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProtectedRoute from '../index';

const useAuthMock = vi.fn();

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

function renderRoute(allowedTypes?: string[]) {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <ProtectedRoute allowedTypes={allowedTypes}>
        <div>Protected content</div>
      </ProtectedRoute>
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
  });

  it('allows deliveryDriver on delivery route', () => {
    useAuthMock.mockReturnValue({
      user: { type: 'deliveryDriver' },
      isLoading: false,
    });
    renderRoute(['deliveryDriver']);
    expect(screen.getByText('Protected content')).toBeInTheDocument();
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
