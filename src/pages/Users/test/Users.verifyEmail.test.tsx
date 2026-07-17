import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetAdminUsers = vi.fn();
const mockVerifyAdminUserEmail = vi.fn();

vi.mock('../../../api/adminUsers', () => ({
  createAdminUser: vi.fn(),
  deleteAdminUser: vi.fn(),
  getAdminUsers: (...args: unknown[]) => mockGetAdminUsers(...args),
  patchAdminUser: vi.fn(),
  verifyAdminUserEmail: (...args: unknown[]) => mockVerifyAdminUserEmail(...args),
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', type: 'admin' },
  }),
}));

import Users from '../index';

describe('Users admin verify email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Modal.confirm).mockImplementation((config) => {
      config.onOk?.();
      return { destroy: vi.fn(), update: vi.fn() };
    });
    mockGetAdminUsers.mockResolvedValue({
      ok: true,
      data: {
        data: [
          {
            id: 'u1',
            email: 'pending@test.com',
            emailVerified: false,
            firstName: 'Pend',
            lastName: 'User',
            numberId: '123',
            numberIdType: 'V',
            type: 'client',
            phone: null,
            phoneVerified: false,
            address: null,
            createdAt: '',
            updatedAt: '',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      },
    });
    mockVerifyAdminUserEmail.mockResolvedValue({
      ok: true,
      data: { user: { emailVerified: true } },
    });
  });

  it('shows verify button for unverified users', async () => {
    render(<Users />);
    expect(await screen.findByRole('button', { name: 'Verificar email' })).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('calls verify API on confirm', async () => {
    const user = userEvent.setup();

    render(<Users />);
    await user.click(await screen.findByRole('button', { name: 'Verificar email' }));

    await waitFor(() => {
      expect(mockVerifyAdminUserEmail).toHaveBeenCalledWith('u1');
    });
    expect(Modal.confirm).toHaveBeenCalled();
  });
});
