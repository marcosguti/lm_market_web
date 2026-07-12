import { render, screen, waitFor } from '@testing-library/react';
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
});
