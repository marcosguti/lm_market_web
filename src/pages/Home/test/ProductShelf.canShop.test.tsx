import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const useAuthMock = vi.fn();

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../../context/CartContext', () => ({
  useCart: () => ({
    addToCart: vi.fn(() => ({ added: 1, requested: 1 })),
  }),
}));

vi.mock('../../../context/ExchangeRateContext', () => ({
  useUsdRate: () => 36,
}));

vi.mock('../OfferCarousel', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('../ProductShelfImage', () => ({
  default: () => null,
}));

vi.mock('framer-motion', () => ({
  motion: {
    article: ({ children, className }: { children?: ReactNode; className?: string }) => (
      <article className={className}>{children}</article>
    ),
  },
}));

import ProductShelf from '../ProductShelf';

const sampleProduct = {
  id: 'p1',
  name: 'Arroz',
  brand: 'Diana',
  price: 2.5,
  imageUrl: null,
  stockQuantity: 10,
  code: 'SKU1',
};

describe('ProductShelf canShop', () => {
  it('shows Agregar for guest', () => {
    useAuthMock.mockReturnValue({ user: null });
    render(<ProductShelf title="Ofertas" products={[sampleProduct]} />);
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeInTheDocument();
  });

  it('hides Agregar for deliveryDriver', () => {
    useAuthMock.mockReturnValue({
      user: { type: 'deliveryDriver', firstName: 'D', lastName: 'R' },
    });
    render(<ProductShelf title="Ofertas" products={[sampleProduct]} />);
    expect(screen.queryByRole('button', { name: 'Agregar' })).not.toBeInTheDocument();
  });
});
