import { api } from './client';

export type Store = {
  id: string;
  name: string;
  externalBranchCode: string;
};

export async function getStores(): Promise<Store[]> {
  const { data, ok } = await api<Store[]>('/api/stores', { skipAuth: true });
  if (!ok || !data) return [];
  return Array.isArray(data) ? data : [];
}