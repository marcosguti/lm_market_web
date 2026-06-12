import { api } from './client';

export type AdminProductActiveFilter = 'all' | 'false' | 'true';

export interface ProductStoreEntry {
  price: number;
  productId: string;
  stockQuantity: number;
  store: { id: string; name: string; externalBranchCode: string };
  storeId: string;
}

export interface AdminProduct {
  active: boolean;
  brand: string;
  brandId?: string;
  code: string;
  createdAt: string;
  department: string;
  departmentId?: string;
  description: string | null;
  id: string;
  imageUrl: string | null;
  name: string;
  price: number;
  productStores: ProductStoreEntry[];
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
  department?: string,
  storeId?: string
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
      ...(storeId ? { storeId } : {}),
    },
  });
}

export interface StoreEntry { storeId: string; price: number; stockQuantity: number }

export async function createAdminProduct(body: {
  active?: boolean;
  brand: string;
  code: string;
  department: string;
  description?: string;
  imageFile?: File;
  name: string;
  stores: StoreEntry[];
}) {
  const formData = new FormData();
  formData.append('active', String(body.active ?? true));
  formData.append('brand', body.brand);
  formData.append('code', body.code);
  formData.append('department', body.department);
  if (body.description) formData.append('description', body.description);
  if (body.imageFile) formData.append('imageUrl', body.imageFile);
  formData.append('name', body.name);
  formData.append('stores', JSON.stringify(body.stores));

  return api<{ product: AdminProduct }>('/api/admin/products', {
    body: formData,
    method: 'POST',
  });
}

export async function patchAdminProduct(
  id: string,
  body: Partial<{
    brand: string;
    department: string;
    description: string;
    imageFile: File;
    stores: StoreEntry[];
  }>
) {
  const formData = new FormData();
  if (body.brand !== undefined) formData.append('brand', body.brand);
  if (body.department !== undefined) formData.append('department', body.department);
  if (body.description !== undefined) formData.append('description', body.description);
  if (body.imageFile) formData.append('imageUrl', body.imageFile);
  if (body.stores !== undefined) formData.append('stores', JSON.stringify(body.stores));

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
