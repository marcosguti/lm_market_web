import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/blogArticles', () => ({
  getPublicBlogArticleById: vi.fn().mockResolvedValue({
    ok: true,
    data: {
      data: {
        id: 'b1',
        title: 'Detalle post',
        content: '<p>Cuerpo del artículo</p>',
        active: true,
        createdAt: '2026-07-15T12:00:00.000Z',
        updatedAt: '2026-07-15T12:00:00.000Z',
      },
    },
  }),
}));

vi.mock('../../../components/SEO', () => ({
  default: () => null,
}));

import BlogDetail from '../index';

describe('BlogDetail page smoke', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders article detail', async () => {
    render(
      <MemoryRouter initialEntries={['/blog/b1']}>
        <Routes>
          <Route path="/blog/:id" element={<BlogDetail />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Detalle post' })).toBeInTheDocument();
    expect(screen.getByText('Cuerpo del artículo')).toBeInTheDocument();
  });
});
