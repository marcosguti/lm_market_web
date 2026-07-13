import { api } from './client';

export interface NotificationEntity {
  body: string;
  createdAt: string;
  id: string;
  orderId: null | string;
  payload: null | Record<string, unknown>;
  readAt: null | string;
  title: string;
  type: string;
  userId: string;
}

export interface PaginatedNotifications {
  data: NotificationEntity[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface InboxNotifications {
  data: NotificationEntity[];
  total: number;
  unreadCount: number;
}

export type GetNotificationsParams =
  | { inbox: true; recentRead?: number }
  | { inbox?: false; page?: number; pageSize?: number };

export async function getNotifications(params: GetNotificationsParams = {}) {
  if (params.inbox) {
    return api<InboxNotifications>('/api/notifications', {
      params: {
        inbox: 'true',
        recentRead: String(params.recentRead ?? 5),
      },
    });
  }

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  return api<PaginatedNotifications>('/api/notifications', {
    params: {
      page: String(page),
      pageSize: String(pageSize),
    },
  });
}

export async function markNotificationRead(notificationId: string) {
  return api<{ ok: boolean }>(`/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsRead() {
  return api<{ count: number }>('/api/notifications/read-all', {
    method: 'POST',
  });
}
