import { api } from './client';

export type AdminProductActiveFilter = 'all' | 'false' | 'true';

export interface AdminProduct {
  active: boolean;
  adminMovements: number | null;
  brand: string;
  brandId?: string;
  code: string;
  cost: number;
  createdAt: string;
  department: string;
  departmentId?: string;
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
  active: AdminProductActiveFilter = 'all',
  brand?: string,
  department?: string
) {
  return api<PaginatedAdminProducts>('/api/admin/products', {
    params: {
      page: String(page),
      pageSize: String(pageSize),
      active,
      ...(search ? { search } : {}),
      ...(sort === 'priceAsc' || sort === 'priceDesc' ? { sort } : {}),
      ...(brand ? { brand } : {}),
      ...(department ? { department } : {}),
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
  imageFile?: File;
  initialBalance?: number;
  inventoryValueBs?: number | string;
  marginPct?: number | string;
  name: string;
  price: number | string;
  salesToday?: number;
  totalStock?: number;
}) {
  const formData = new FormData();
  formData.append('active', String(body.active ?? true));
  if (body.adminMovements !== undefined) formData.append('adminMovements', String(body.adminMovements));
  formData.append('brand', body.brand);
  formData.append('code', body.code);
  formData.append('cost', String(body.cost));
  formData.append('department', body.department);
  if (body.description) formData.append('description', body.description);
  if (body.imageFile) formData.append('imageUrl', body.imageFile);
  if (body.initialBalance !== undefined) formData.append('initialBalance', String(body.initialBalance));
  if (body.inventoryValueBs !== undefined) formData.append('inventoryValueBs', String(body.inventoryValueBs));
  if (body.marginPct !== undefined) formData.append('marginPct', String(body.marginPct));
  formData.append('name', body.name);
  formData.append('price', String(body.price));
  if (body.salesToday !== undefined) formData.append('salesToday', String(body.salesToday));
  if (body.totalStock !== undefined) formData.append('totalStock', String(body.totalStock));

  return api<{ product: AdminProduct }>('/api/admin/products', {
    body: formData,
    method: 'POST',
  });
}

export async function patchAdminProduct(
  id: string,
  body: Partial<{ brand: string; department: string; description: string; imageFile: File }>
) {
  const formData = new FormData();
  if (body.brand !== undefined) formData.append('brand', body.brand);
  if (body.department !== undefined) formData.append('department', body.department);
  if (body.description !== undefined) formData.append('description', body.description);
  if (body.imageFile) formData.append('imageUrl', body.imageFile);

  return api<{ product: AdminProduct }>(`/api/admin/products/${id}`, {
    body: formData,
    method: 'PATCH',
  });
}

export async function deactivateAdminProduct(id: string) {
  return api<{ message: string; product: AdminProduct }>(`/api/admin/products/${id}`, {
    method: 'DELETE',
  });
}
