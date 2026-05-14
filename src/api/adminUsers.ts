import { api } from './client';

/** Rol que puede asignarse al crear o editar usuarios (nunca superAdmin por API). */
export type AdminAssignableUserType = 'admin' | 'client' | 'deliveryDriver';

export type UserType = AdminAssignableUserType | 'superAdmin';

export interface AdminUser {
  address: null | string;
  createdAt: string;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  numberId: string;
  phone: null | string;
  type: UserType;
  updatedAt: string;
}

export interface PaginatedUsers {
  data: AdminUser[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CreateUserResponse {
  temporaryPassword?: string;
  user: AdminUser;
}

export async function getAdminUsers(page: number, pageSize: number, search?: string) {
  return api<PaginatedUsers>('/api/admin/users', {
    params: {
      page: String(page),
      pageSize: String(pageSize),
      ...(search ? { search } : {}),
    },
  });
}

export async function createAdminUser(body: {
  address?: string;
  email: string;
  firstName: string;
  lastName: string;
  numberId: string;
  password?: string;
  phone?: string;
  type: AdminAssignableUserType;
}) {
  return api<CreateUserResponse>('/api/admin/users', {
    body: JSON.stringify(body),
    method: 'POST',
  });
}

export async function patchAdminUser(
  id: string,
  body: Partial<{
    address: string;
    email: string;
    firstName: string;
    lastName: string;
    numberId: string;
    phone: string;
    type: AdminAssignableUserType;
  }>
) {
  return api<{ user: AdminUser }>(`/api/admin/users/${id}`, {
    body: JSON.stringify(body),
    method: 'PATCH',
  });
}

export async function deleteAdminUser(id: string) {
  return api<{ message: string }>(`/api/admin/users/${id}`, {
    method: 'DELETE',
  });
}
