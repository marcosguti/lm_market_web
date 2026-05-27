import { api } from './client';

export type CatalogFilterItem = {
  id: string;
  name: string;
};

type CatalogListResponse = {
  data: CatalogFilterItem[];
};

export async function fetchBrands(): Promise<CatalogFilterItem[]> {
  const { data, ok } = await api<CatalogListResponse>('/api/brands', { skipAuth: true });
  if (!ok || !data?.data) return [];
  return data.data;
}

export async function fetchDepartments(): Promise<CatalogFilterItem[]> {
  const { data, ok } = await api<CatalogListResponse>('/api/departments', { skipAuth: true });
  if (!ok || !data?.data) return [];
  return data.data;
}
