import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/blogArticles', () => ({
  getPublicBlogArticles: vi.fn().mockResolvedValue({
    ok: true,
    data: {
      data: [
        {
          id: 'b1',
          title: 'Primer post',
          content: '<p>Contenido&nbsp;de&nbsp;prueba</p><img src="https://cdn/img.jpg" />',
          active: true,
          createdAt: '2026-07-15T12:00:00.000Z',
          updatedAt: '2026-07-15T12:00:00.000Z',
        },
      ],
      page: 1,
      pageSize: 9,
      total: 1,
      totalPages: 1,
    },
  }),
}));

vi.mock('../../../components/SEO', () => ({
  default: () => null,
}));

import Blog from '../index';

describe('Blog public page smoke', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders posts from public API', async () => {
    render(
      <MemoryRouter>
        <Blog />
      </MemoryRouter>
    );
    expect(await screen.findByRole('heading', { name: 'Blog' })).toBeInTheDocument();
    expect(await screen.findByText('Primer post')).toBeInTheDocument();
    expect(await screen.findByText('Contenido de prueba')).toBeInTheDocument();
    expect(screen.getByText('Leer más')).toBeInTheDocument();
  });
});
