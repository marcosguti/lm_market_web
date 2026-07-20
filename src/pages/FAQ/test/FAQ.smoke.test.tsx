import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../components/SEO', () => ({
  default: () => null,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: { children?: ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
    h1: ({ children, className }: { children?: ReactNode; className?: string }) => (
      <h1 className={className}>{children}</h1>
    ),
    p: ({ children, className }: { children?: ReactNode; className?: string }) => (
      <p className={className}>{children}</p>
    ),
  },
}));

import faqs from '../faqs.json';
import FAQ from '../index';

describe('FAQ page smoke', () => {
  it('renders questions from faqs.json', () => {
    render(
      <MemoryRouter>
        <FAQ />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Preguntas Frecuentes' })).toBeInTheDocument();
    for (const faq of faqs) {
      expect(screen.getByText(faq.question)).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: 'Ir a Contacto' })).toHaveAttribute(
      'href',
      '/contacto'
    );
  });
});
