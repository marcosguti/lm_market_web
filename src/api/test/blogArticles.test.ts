import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createAdminBlogArticle,
  deleteAdminBlogArticle,
  getAdminBlogArticles,
  getPublicBlogArticleById,
  getPublicBlogArticles,
  patchAdminBlogArticle,
} from '../blogArticles';
import * as client from '../client';

vi.mock('../client', () => ({ api: vi.fn() }));

describe('blogArticles api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAdminBlogArticles calls admin endpoint', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: { data: [] } });
    await getAdminBlogArticles();
    expect(client.api).toHaveBeenCalledWith('/api/admin/blog-articles');
  });

  it('getPublicBlogArticles uses skipAuth and pagination query', async () => {
    vi.mocked(client.api).mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [], page: 2, pageSize: 9, total: 0, totalPages: 1 },
    });
    await getPublicBlogArticles(2, 9);
    expect(client.api).toHaveBeenCalledWith('/api/blog-articles?page=2&pageSize=9', { skipAuth: true });
  });

  it('getPublicBlogArticleById uses skipAuth', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: { data: {} } });
    await getPublicBlogArticleById('b1');
    expect(client.api).toHaveBeenCalledWith('/api/blog-articles/b1', { skipAuth: true });
  });

  it('createAdminBlogArticle posts FormData', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 201, data: {} });
    await createAdminBlogArticle({
      active: true,
      content: '<p>Hola</p>',
      title: 'Post',
    });
    expect(client.api).toHaveBeenCalledWith(
      '/api/admin/blog-articles',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('patchAdminBlogArticle patches by id', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    await patchAdminBlogArticle('b1', { title: 'Updated' });
    expect(client.api).toHaveBeenCalledWith(
      '/api/admin/blog-articles/b1',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('deleteAdminBlogArticle deletes by id', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    await deleteAdminBlogArticle('b1');
    expect(client.api).toHaveBeenCalledWith('/api/admin/blog-articles/b1', { method: 'DELETE' });
  });
});
