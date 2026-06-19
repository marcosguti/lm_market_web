import { api, type ApiResult } from './client';

export interface AdminBanner {
  id: string;
  active: boolean;
  imageUrl: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicBanner {
  id: string;
  imageUrl: string;
  description: string | null;
}

export async function getAdminBanners() {
  return api<{ data: AdminBanner[] }>('/api/admin/banners');
}

export async function createAdminBanner(body: {
  imageFile: File;
  active: boolean;
  description?: string | null;
}) {
  const formData = new FormData();
  formData.append('image', body.imageFile);
  formData.append('active', String(body.active));
  formData.append('description', body.description ?? '');

  return api<{ data: AdminBanner }>('/api/admin/banners', {
    body: formData,
    method: 'POST',
  });
}

export async function patchAdminBanner(
  id: string,
  body: Partial<{
    imageFile: File;
    active: boolean;
    description: string | null;
  }>
) {
  const formData = new FormData();
  if (body.imageFile) formData.append('image', body.imageFile);
  if (body.active !== undefined) formData.append('active', String(body.active));
  if (body.description !== undefined) formData.append('description', body.description ?? '');

  return api<{ data: AdminBanner }>(`/api/admin/banners/${id}`, {
    body: formData,
    method: 'PATCH',
  });
}

export async function deleteAdminBanner(id: string) {
  return api<{ message: string }>(`/api/admin/banners/${id}`, {
    method: 'DELETE',
  });
}

export async function getActiveBanners(): Promise<ApiResult<{ data: PublicBanner[] }>> {
  return api<{ data: PublicBanner[] }>('/api/banners', { skipAuth: true });
}
