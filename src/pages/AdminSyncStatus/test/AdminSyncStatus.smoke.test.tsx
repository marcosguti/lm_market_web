import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/adminSyncStatus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/adminSyncStatus')>();
  return {
    ...actual,
    getAdminSyncStatus: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        data: {
          bcv: {
            details: {
              fetchedAt: '2026-07-20T08:00:00.000Z',
              rate: 736.9339,
              source: 'bcv',
            },
            healthy: true,
            job: 'bcv_rate',
            lastAlertedAt: null,
            lastError: null,
            lastFinishedAt: '2026-07-20T08:00:00.000Z',
            lastStartedAt: '2026-07-20T08:00:00.000Z',
            lastSucceededAt: '2026-07-20T08:00:00.000Z',
            reason: null,
            status: 'ok',
            updatedAt: '2026-07-20T08:00:00.000Z',
          },
          ok: false,
          products: {
            details: {
              incompleteStoreCount: 0,
              storeFailures: 1,
              stores: [
                {
                  branch: 1,
                  complete: true,
                  deactivated: 0,
                  failed: false,
                  pageErrors: 0,
                  rowErrors: 0,
                  storeName: 'Las Americas',
                  upserted: 9996,
                },
                {
                  branch: 2,
                  complete: false,
                  deactivated: 0,
                  error: 'timeout',
                  failed: true,
                  pageErrors: 2,
                  rowErrors: 0,
                  storeName: 'Otra',
                  upserted: 0,
                },
              ],
              storesTotal: 2,
            },
            healthy: false,
            job: 'external_products',
            lastAlertedAt: null,
            lastError: '1/2 store sync(s) failed',
            lastFinishedAt: '2026-07-20T09:00:00.000Z',
            lastStartedAt: '2026-07-20T09:00:00.000Z',
            lastSucceededAt: '2026-07-20T07:00:00.000Z',
            reason: 'incomplete',
            status: 'incomplete',
            updatedAt: '2026-07-20T09:00:00.000Z',
          },
        },
      },
    }),
  };
});

import AdminSyncStatus from '../index';

describe('AdminSyncStatus smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders structured sync details instead of raw JSON', async () => {
    render(
      <MemoryRouter>
        <AdminSyncStatus />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Sincronización')).toBeInTheDocument();
      expect(screen.getByText('Catálogo de productos')).toBeInTheDocument();
      expect(screen.getByText('Tasa USD → VES')).toBeInTheDocument();
      expect(screen.getByText('Hay problemas')).toBeInTheDocument();
      expect(screen.getByText('1/2 store sync(s) failed')).toBeInTheDocument();
      expect(screen.getByText('Las Americas')).toBeInTheDocument();
      expect(screen.getAllByText('Actualizados').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('BCV')).toBeInTheDocument();
      expect(screen.getByText('Tasa actual')).toBeInTheDocument();
    });

    expect(screen.queryByText(/"storeName"/)).not.toBeInTheDocument();
    expect(screen.queryByText(/"rate":/)).not.toBeInTheDocument();
  });
});
