import type { PaymentMethod } from '../types/order';

import { api } from './client';

export interface AdminPaymentMethodConfig {
  active: boolean;
  information: null | string;
  method: PaymentMethod;
  noteEnabled: boolean;
  placeholder: null | string;
  updatedAt: string;
}

export interface PatchPaymentMethodParams {
  active?: boolean;
  information?: null | string;
  noteEnabled?: boolean;
  placeholder?: null | string;
}

export async function getAdminPaymentMethods() {
  return api<{ data: AdminPaymentMethodConfig[] }>('/api/admin/payment-methods');
}

export async function patchAdminPaymentMethod(
  method: PaymentMethod,
  params: PatchPaymentMethodParams,
) {
  return api<{ data: AdminPaymentMethodConfig }>(`/api/admin/payment-methods/${method}`, {
    body: JSON.stringify(params),
    method: 'PATCH',
  });
}
