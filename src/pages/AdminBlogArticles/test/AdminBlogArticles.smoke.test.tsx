import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/blogArticles', () => ({
  createAdminBlogArticle: vi.fn(),
  deleteAdminBlogArticle: vi.fn(),
  getAdminBlogArticles: vi.fn().mockResolvedValue({ ok: true, data: { data: [] } }),
  patchAdminBlogArticle: vi.fn(),
}));

vi.mock('../../../components/RichTextEditor', () => ({
  default: ({ value }: { value: string }) => <div data-testid="rich-text-editor">{value}</div>,
}));

import AdminBlogArticles from '../index';

describe('AdminBlogArticles page smoke', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders blog title for admin', async () => {
    render(
      <MemoryRouter>
        <AdminBlogArticles />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Blog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nuevo artículo/i })).toBeInTheDocument();
  });
});
