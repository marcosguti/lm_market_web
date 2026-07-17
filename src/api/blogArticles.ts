import { api, type ApiResult } from './client';

export interface AdminBlogArticle {
  id: string;
  title: string;
  content: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PublicBlogArticle = AdminBlogArticle;

export interface PublicBlogArticlesPage {
  data: PublicBlogArticle[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export async function getAdminBlogArticles() {
  return api<{ data: AdminBlogArticle[] }>('/api/admin/blog-articles');
}

export async function createAdminBlogArticle(body: {
  title: string;
  content: string;
  active: boolean;
  files?: File[];
}) {
  const formData = new FormData();
  formData.append('title', body.title);
  formData.append('content', body.content);
  formData.append('active', String(body.active));
  for (const file of body.files ?? []) {
    formData.append('files', file);
  }

  return api<{ data: AdminBlogArticle }>('/api/admin/blog-articles', {
    body: formData,
    method: 'POST',
  });
}

export async function patchAdminBlogArticle(
  id: string,
  body: Partial<{
    title: string;
    content: string;
    active: boolean;
    files: File[];
  }>,
) {
  const formData = new FormData();
  if (body.title !== undefined) formData.append('title', body.title);
  if (body.content !== undefined) formData.append('content', body.content);
  if (body.active !== undefined) formData.append('active', String(body.active));
  for (const file of body.files ?? []) {
    formData.append('files', file);
  }

  return api<{ data: AdminBlogArticle }>(`/api/admin/blog-articles/${id}`, {
    body: formData,
    method: 'PATCH',
  });
}

export async function deleteAdminBlogArticle(id: string) {
  return api<{ message: string }>(`/api/admin/blog-articles/${id}`, {
    method: 'DELETE',
  });
}

export async function getPublicBlogArticles(
  page = 1,
  pageSize = 9,
): Promise<ApiResult<PublicBlogArticlesPage>> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return api<PublicBlogArticlesPage>(`/api/blog-articles?${params.toString()}`, { skipAuth: true });
}

export async function getPublicBlogArticleById(id: string): Promise<ApiResult<{ data: PublicBlogArticle }>> {
  return api<{ data: PublicBlogArticle }>(`/api/blog-articles/${id}`, { skipAuth: true });
}
