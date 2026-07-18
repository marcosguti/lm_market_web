import { api } from './client';

export type DeliveryAddressUser = {
  address?: null | string;
  addressCity?: null | string;
  addressLatitude?: null | number;
  addressLongitude?: null | number;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
};

export async function putDeliveryAddress(params: {
  expectedCity?: string;
  latitude: number;
  longitude: number;
}) {
  return api<{ user: DeliveryAddressUser }>('/api/auth/delivery-address', {
    body: JSON.stringify(params),
    method: 'PUT',
  });
}
