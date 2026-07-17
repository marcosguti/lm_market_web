import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMock = vi.fn();
const fetchBrandsMock = vi.fn();

vi.mock('../../../../api/client', () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

vi.mock('../../../../api/catalog', () => ({
  fetchBrands: () => fetchBrandsMock(),
  fetchDepartments: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../context/HomeCatalogContext', () => ({
  useHomeCatalog: () => ({
    filtersReady: true,
    search: '',
    setSearch: vi.fn(),
    stores: [{ id: 'store-1', name: 'Store 1' }],
    selectedStoreId: 'store-1',
    handleStoreChange: vi.fn(),
    scrollToCatalog: vi.fn(),
  }),
}));

vi.mock('../../../../context/CartContext', () => ({
  useCart: () => ({
    cart: [],
    clearCart: vi.fn(),
    setStoreId: vi.fn(),
    storeId: '',
    addToCart: vi.fn(() => ({ added: 1, requested: 1 })),
  }),
}));

vi.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    message: { error: vi.fn(), info: vi.fn(), success: vi.fn(), warning: vi.fn() },
  };
});

import ProductsCatalog from '../index';

describe('ProductsCatalog loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    fetchBrandsMock.mockResolvedValue([{ id: 'brand-1', name: 'Brand 1' }]);
    apiMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        data: [],
        page: 1,
        pageSize: 24,
        total: 0,
        totalPages: 0,
      },
    });
  });

  it('loads products once when home catalog context is ready with storeId', async () => {
    render(<ProductsCatalog externalDepartments={[]} />);

    await waitFor(() => {
      expect(fetchBrandsMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledTimes(1);
    });

    const [path, options] = apiMock.mock.calls[0] as [string, { params?: Record<string, string> }];
    expect(path).toBe('/api/products');
    expect(options?.params?.storeId).toBe('store-1');
    expect(await screen.findByText('Todos los productos')).toBeInTheDocument();
  });
});
