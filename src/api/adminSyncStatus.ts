import { api } from './client';

export type SyncJobRunStatus = 'failed' | 'incomplete' | 'ok' | 'running';

export interface ProductStoreSyncDetail {
  branch: number;
  complete: boolean;
  deactivated: number;
  error?: string;
  failed: boolean;
  pageErrors: number;
  rowErrors: number;
  sourceCodeCount?: number;
  storeName: string;
  upserted: number;
}

export interface ProductSyncDetails {
  incompleteStoreCount: number;
  storeFailures: number;
  stores: ProductStoreSyncDetail[];
  storesTotal: number;
}

export interface BcvSyncDetails {
  fetchedAt: null | string;
  rate: number;
  source: string;
}

export interface AdminSyncJobStatus {
  details: null | unknown;
  healthy: boolean;
  job: null | string;
  lastAlertedAt: null | string;
  lastError: null | string;
  lastFinishedAt: null | string;
  lastStartedAt: null | string;
  lastSucceededAt: null | string;
  reason: null | string;
  status: null | SyncJobRunStatus;
  updatedAt: null | string;
}

export interface AdminSyncStatusData {
  bcv: AdminSyncJobStatus;
  ok: boolean;
  products: AdminSyncJobStatus;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isProductStoreSyncDetail(value: unknown): value is ProductStoreSyncDetail {
  if (!isRecord(value)) return false;
  return (
    typeof value.branch === 'number' &&
    typeof value.complete === 'boolean' &&
    typeof value.deactivated === 'number' &&
    typeof value.failed === 'boolean' &&
    typeof value.pageErrors === 'number' &&
    typeof value.rowErrors === 'number' &&
    typeof value.storeName === 'string' &&
    typeof value.upserted === 'number' &&
    (value.error === undefined || typeof value.error === 'string')
  );
}

export function isProductSyncDetails(value: unknown): value is ProductSyncDetails {
  if (!isRecord(value)) return false;
  if (typeof value.incompleteStoreCount !== 'number') return false;
  if (typeof value.storeFailures !== 'number') return false;
  if (typeof value.storesTotal !== 'number') return false;
  if (!Array.isArray(value.stores)) return false;
  return value.stores.every(isProductStoreSyncDetail);
}

export function isBcvSyncDetails(value: unknown): value is BcvSyncDetails {
  if (!isRecord(value)) return false;
  if (typeof value.rate !== 'number' || !Number.isFinite(value.rate)) return false;
  if (typeof value.source !== 'string') return false;
  if (value.fetchedAt !== null && typeof value.fetchedAt !== 'string') return false;
  return true;
}

export async function getAdminSyncStatus() {
  return api<{ data: AdminSyncStatusData }>('/api/admin/sync-status');
}
