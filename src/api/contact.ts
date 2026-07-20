import { api, type ApiResult } from './client';

export type ContactArea = 'contacto' | 'ventas' | 'mercadeo' | 'talento-humano' | 'soporte';

export const CONTACT_AREAS: ContactArea[] = [
  'contacto',
  'ventas',
  'mercadeo',
  'talento-humano',
  'soporte',
];

export const CONTACT_LIMITS = {
  messageMax: 5000,
  messageMin: 10,
  nameMax: 100,
  nameMin: 2,
  subjectMax: 200,
  subjectMin: 3,
} as const;

export type ContactPayload = {
  area: ContactArea;
  email: string;
  message: string;
  name: string;
  subject: string;
};

export async function sendContactMessage(
  body: ContactPayload
): Promise<ApiResult<{ error?: string; message?: string }>> {
  return api<{ error?: string; message?: string }>('/api/contact', {
    body: JSON.stringify(body),
    method: 'POST',
    skipAuth: true,
  });
}
