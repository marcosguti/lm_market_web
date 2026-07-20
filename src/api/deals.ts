import { api, type ApiResult } from './client';

export interface AdminDeal {
  id: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAdminDeals {
  data: AdminDeal[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export async function getAdminDeals(page = 1, pageSize = 10) {
  return api<PaginatedAdminDeals>('/api/admin/deals', {
    params: { page: String(page), pageSize: String(pageSize) },
  });
}

export async function createAdminDeal(body: {
  imageFile: File;
  startDate: string;
  endDate: string;
  description?: string;
  active?: boolean;
}) {
  const formData = new FormData();
  formData.append('image', body.imageFile);
  formData.append('startDate', body.startDate);
  formData.append('endDate', body.endDate);
  if (body.description) formData.append('description', body.description);
  if (body.active !== undefined) formData.append('active', String(body.active));

  return api<{ deal: AdminDeal }>('/api/admin/deals', {
    body: formData,
    method: 'POST',
  });
}

export async function patchAdminDeal(
  id: string,
  body: Partial<{
    imageFile: File;
    startDate: string;
    endDate: string;
    description: string;
    active: boolean;
  }>
) {
  const formData = new FormData();
  if (body.imageFile) formData.append('image', body.imageFile);
  if (body.startDate) formData.append('startDate', body.startDate);
  if (body.endDate) formData.append('endDate', body.endDate);
  if (body.description !== undefined) formData.append('description', body.description);
  if (body.active !== undefined) formData.append('active', String(body.active));

  return api<{ deal: AdminDeal }>(`/api/admin/deals/${id}`, {
    body: formData,
    method: 'PATCH',
  });
}

export async function deleteAdminDeal(id: string) {
  return api<{ message: string }>(`/api/admin/deals/${id}`, {
    method: 'DELETE',
  });
}

export async function getActiveDeals(): Promise<ApiResult<{ data: string[] }>> {
  return api<{ data: string[] }>('/api/deals', { skipAuth: true });
}
