import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useAuthMock = vi.fn();

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../../components/AddressMapPicker', () => ({
  AddressMapPicker: () => <div data-testid="address-map-picker-mock" />,
}));

vi.mock('../../../api/payments', () => ({
  getPaymentBanks: vi.fn().mockResolvedValue({ ok: true, data: { banks: [] } }),
  getPaymentConfig: vi.fn().mockResolvedValue({
    ok: true,
    data: {
      megasoftEnabled: false,
      methods: [
        {
          information: null,
          method: 'cash',
          noteEnabled: true,
          placeholder: 'Toma una foto legible del billete',
        },
        {
          information: null,
          method: 'zelle',
          noteEnabled: true,
          placeholder: null,
        },
      ],
      usdRate: 40,
    },
  }),
  verifyMobilePayment: vi.fn(),
}));

vi.mock('../../../api/orders', () => ({
  confirmOrderPayment: vi.fn(),
  ensureCart: vi.fn().mockResolvedValue({
    ok: true,
    data: {
      order: {
        id: 'o1',
        status: 'pending',
        products: [],
        totalAmount: 10,
        userId: 'u1',
        storeId: 's1',
      },
      changes: [],
    },
  }),
}));

vi.mock('../../../api/stores', () => ({
  getStores: vi.fn().mockResolvedValue([
    {
      id: 's1',
      name: 'Las Americas',
      externalBranchCode: '1',
      city: 'merida',
      latitude: 8.598136,
      longitude: -71.150426,
    },
  ]),
}));

vi.mock('../../../context/CartContext', () => ({
  useCart: () => ({
    cart: [{ product: { code: 'SKU1', name: 'P', price: 1, available: 1 }, quantity: 1 }],
    cartSubtotal: 1,
    clearCart: vi.fn(),
    flushCartSync: vi.fn().mockResolvedValue({
      ok: true,
      order: {
        id: 'o1',
        status: 'pending',
        products: [{ code: 'SKU1', name: 'P', quantity: 1, lineTotal: 1, unitPrice: 1 }],
        totalAmount: 10,
        userId: 'u1',
        storeId: 's1',
      },
      changes: [],
    }),
    removeFromCart: vi.fn(),
    replaceFromOrderLines: vi.fn(),
    totalItemCount: 1,
    updateQuantity: vi.fn(),
  }),
}));

import { getPaymentConfig } from '../../../api/payments';
import CheckoutPage from '../index';

const mockedGetPaymentConfig = vi.mocked(getPaymentConfig);

describe('Checkout page smoke', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: { type: 'client', firstName: 'Ana', lastName: 'Client', email: 'a@test.com' },
      isLoading: false,
      setUser: vi.fn(),
    });
    mockedGetPaymentConfig.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        megasoftEnabled: false,
        methods: [
          {
            information: null,
            method: 'cash',
            noteEnabled: true,
            placeholder: 'Toma una foto legible del billete',
          },
          {
            information: null,
            method: 'zelle',
            noteEnabled: true,
            placeholder: null,
          },
        ],
        usdRate: 40,
      },
    });
  });

  it('renders checkout title for client', async () => {
    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Finalizar pedido')).toBeInTheDocument();
    });
  });

  it('shows cash payment option', async () => {
    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/efectivo/i)).toBeInTheDocument();
    });
  });

  it('requires payment screenshot for cash checkout', async () => {
    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Comprobante de pago')).toBeInTheDocument();
      expect(screen.getByText(/Toma una foto legible del billete/i)).toBeInTheDocument();
    });
  });

  it('prompts to configure map address when missing', async () => {
    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Dirección de entrega')).toBeInTheDocument();
      expect(screen.getByText(/Elige una nueva dirección/i)).toBeInTheDocument();
    });
  });

  it('uses method information and shows Bs and USD amounts for megasoft pago móvil', async () => {
    mockedGetPaymentConfig.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        megasoftEnabled: true,
        methods: [
          {
            information: 'RIF: 502772642\nBanco Plaza',
            method: 'mobilePayment',
            noteEnabled: false,
            placeholder: null,
          },
        ],
        merchant: {
          bankCode: '0138',
          bankName: 'Banco Plaza',
          phone: '04121234567',
          rif: 'SHOULD-NOT-SHOW',
        },
        usdRate: 40,
      },
    });

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Información del método de pago')).toBeInTheDocument();
    });

    expect(screen.getByText(/RIF: 502772642/)).toBeInTheDocument();
    expect(screen.queryByText(/SHOULD-NOT-SHOW/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Teléfono comercio/)).not.toBeInTheDocument();

    const amountAlert = screen.getByText('Monto a pagar').closest('.ant-alert');
    expect(amountAlert).toBeTruthy();
    expect(within(amountAlert as HTMLElement).getByText(/Bs 400,00/)).toBeInTheDocument();
    expect(within(amountAlert as HTMLElement).getByText(/\$ 10,00/)).toBeInTheDocument();
  });

  it('uses method placeholder as note field placeholder', async () => {
    mockedGetPaymentConfig.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        megasoftEnabled: false,
        methods: [
          {
            information: 'mail@mail.com',
            method: 'zelle',
            noteEnabled: true,
            placeholder: 'Hint de nota Zelle',
          },
        ],
        usdRate: 40,
      },
    });

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Hint de nota Zelle')).toBeInTheDocument();
    });
  });
});
