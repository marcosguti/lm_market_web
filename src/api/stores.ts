import { api } from './client';

/** Active stores only (API excludes inactive). */
export type Store = {
  city: null | string;
  externalBranchCode: string;
  id: string;
  latitude: null | number;
  longitude: null | number;
  name: string;
};

export async function getStores(): Promise<Store[]> {
  const { data, ok } = await api<Store[]>('/api/stores', { skipAuth: true });
  if (!ok || !data) return [];
  return Array.isArray(data) ? data : [];
}
