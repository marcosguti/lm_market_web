import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import VerifyEmailRoute from '../index';

function renderGuard(initialEntry: string | { pathname: string; state?: unknown }) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/verificar-email"
          element={
            <VerifyEmailRoute>
              <div>Verify email content</div>
            </VerifyEmailRoute>
          }
        />
        <Route path="/iniciar-sesion" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('VerifyEmailRoute', () => {
  it('renders children when state comes from register flow', () => {
    renderGuard({
      pathname: '/verificar-email',
      state: { email: 'user@test.com', verificationContext: 'register' },
    });

    expect(screen.getByText('Verify email content')).toBeInTheDocument();
  });

  it('renders children when state comes from login flow', () => {
    renderGuard({
      pathname: '/verificar-email',
      state: { email: 'user@test.com', verificationContext: 'login' },
    });

    expect(screen.getByText('Verify email content')).toBeInTheDocument();
  });

  it('redirects to login when accessed without navigation state', () => {
    renderGuard('/verificar-email');

    expect(screen.queryByText('Verify email content')).not.toBeInTheDocument();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('redirects to login when email query param is used without context', () => {
    renderGuard('/verificar-email?email=user@test.com');

    expect(screen.queryByText('Verify email content')).not.toBeInTheDocument();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('redirects to login when verificationContext is invalid', () => {
    renderGuard({
      pathname: '/verificar-email',
      state: { email: 'user@test.com', verificationContext: 'admin' },
    });

    expect(screen.queryByText('Verify email content')).not.toBeInTheDocument();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
});
