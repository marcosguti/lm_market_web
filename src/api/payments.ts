import type { PaymentMethod } from '../types/order';

import { api } from './client';

export interface VenezuelanBank {
  code: string;
  name: string;
}

export interface PaymentMethodPublicConfig {
  information: null | string;
  method: PaymentMethod;
  noteEnabled: boolean;
  placeholder: null | string;
}

export interface PaymentConfig {
  megasoftEnabled: boolean;
  merchant: {
    bankCode: string;
    bankName: string;
    phone: string;
    rif: string;
  };
  methods?: PaymentMethodPublicConfig[];
  usdRate: number;
  usdRateSource?: string;
  usdRateUpdatedAt?: null | string;
}

export async function getPaymentBanks() {
  return api<{ banks: VenezuelanBank[] }>('/api/payments/banks', { skipAuth: true });
}

export async function getPaymentConfig() {
  return api<PaymentConfig>('/api/payments/config', { skipAuth: true });
}

export interface VerifyMobilePaymentParams {
  amount: number;
  bankCode: string;
  customerNotes?: string;
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  nationalId: string;
  phone: string;
  reference: string;
}

export interface VerifyMobilePaymentResponse {
  changes: unknown[];
  order: unknown;
  voucher: string;
}

export async function verifyMobilePayment(orderId: string, params: VerifyMobilePaymentParams) {
  return api<VerifyMobilePaymentResponse>(`/api/orders/${orderId}/verify-mobile-payment`, {
    body: JSON.stringify(params),
    method: 'POST',
  });
}
