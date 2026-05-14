import { api } from './client';

export type AdminProductActiveFilter = 'all' | 'false' | 'true';

export interface AdminProduct {
  active: boolean;
  adminMovements: number | null;
  brand: string;
  code: string;
  cost: number;
  createdAt: string;
  department: string;
  description: string | null;
  id: string;
  imageUrl: string | null;
  initialBalance: number | null;
  inventoryValueBs: number | null;
  marginPct: number | null;
  name: string;
  price: number;
  salesToday: number | null;
  totalStock: number | null;
  updatedAt: string;
}

export interface PaginatedAdminProducts {
  data: AdminProduct[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export async function getAdminProducts(
  page: number,
  pageSize: number,
  search?: string,
  sort?: '' | 'priceAsc' | 'priceDesc',
  active: AdminProductActiveFilter = 'all'
) {
  return api<PaginatedAdminProducts>('/api/admin/products', {
    params: {
      page: String(page),
      pageSize: String(pageSize),
      active,
      ...(search ? { search } : {}),
      ...(sort === 'priceAsc' || sort === 'priceDesc' ? { sort } : {}),
    },
  });
}

export async function createAdminProduct(body: {
  active?: boolean;
  adminMovements?: number;
  brand: string;
  code: string;
  cost: number | string;
  department: string;
  description?: string;
  imageUrl?: string;
  initialBalance?: number;
  inventoryValueBs?: number | string;
  marginPct?: number | string;
  name: string;
  price: number | string;
  salesToday?: number;
  totalStock?: number;
}) {
  return api<{ product: AdminProduct }>('/api/admin/products', {
    body: JSON.stringify(body),
    method: 'POST',
  });
}

export async function patchAdminProduct(
  id: string,
  body: Partial<{ brand: string; description: string; imageUrl: string }>
) {
  return api<{ product: AdminProduct }>(`/api/admin/products/${id}`, {
    body: JSON.stringify(body),
    method: 'PATCH',
  });
}

export async function deactivateAdminProduct(id: string) {
  return api<{ message: string; product: AdminProduct }>(`/api/admin/products/${id}`, {
    method: 'DELETE',
  });
}
