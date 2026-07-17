import type { SelectProps } from 'antd';

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildAntdTestMock, createSelectCapture } from '../../../test/antdMocks';

const authState = vi.hoisted(() => ({
  user: null as { id: string; type: string } | null,
}));

const roleSelectOptions = vi.hoisted(() => ({
  latest: [] as NonNullable<SelectProps['options']>,
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: authState.user,
    isLoading: false,
  }),
}));

vi.mock('antd', async (importOriginal) => {
  const mocked = await buildAntdTestMock(() => importOriginal<typeof import('antd')>());
  const Select = createSelectCapture(mocked.Select, roleSelectOptions);
  return { ...mocked, Select };
});

vi.mock('../../../api/adminUsers', () => ({
  createAdminUser: vi.fn(),
  deleteAdminUser: vi.fn(),
  getAdminUsers: vi.fn().mockResolvedValue({
    ok: true,
    data: { data: [], page: 1, pageSize: 20, total: 0, totalPages: 1 },
  }),
  patchAdminUser: vi.fn(),
  verifyAdminUserEmail: vi.fn(),
}));

import Users from '../index';

async function openCreateModal(): Promise<HTMLElement> {
  fireEvent.click(screen.getByRole('button', { name: /nuevo usuario/i }));
  const dialog = await screen.findByRole('dialog');
  await waitFor(() => {
    expect(within(dialog).getByText('Nuevo usuario')).toBeInTheDocument();
  });
  return dialog;
}

function roleOptionValues(): string[] {
  return roleSelectOptions.latest.map((option) => String(option?.value ?? ''));
}

describe('Users page RBAC smoke', () => {
  beforeEach(() => {
    authState.user = null;
    roleSelectOptions.latest = [];
  });

  it('renders users title for admin', async () => {
    authState.user = { id: 'admin-1', type: 'admin' };
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Usuarios')).toBeInTheDocument();
  });

  it('superAdmin create form includes Admin type option', async () => {
    authState.user = { id: 'super-1', type: 'superAdmin' };
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>,
    );
    await screen.findByText('Usuarios');
    await openCreateModal();
    await waitFor(() => {
      expect(roleOptionValues()).toEqual(expect.arrayContaining(['client', 'deliveryDriver', 'admin']));
    });
  });

  it('admin create form does not include Admin type option', async () => {
    authState.user = { id: 'admin-1', type: 'admin' };
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>,
    );
    await screen.findByText('Usuarios');
    await openCreateModal();
    await waitFor(() => {
      expect(roleOptionValues()).toEqual(expect.arrayContaining(['client', 'deliveryDriver']));
      expect(roleOptionValues()).not.toContain('admin');
    });
  });
});
