import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useAuthMock = vi.fn();
const getNotificationsMock = vi.fn();
const markAllNotificationsReadMock = vi.fn();

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../../context/CartContext', () => ({
  useCart: () => ({
    cart: [],
    cartSubtotal: 0,
    clearCart: vi.fn(),
    flushCartSync: vi.fn(),
    removeFromCart: vi.fn(),
    totalItemCount: 0,
    updateQuantity: vi.fn(),
  }),
}));

vi.mock('../../../api/notifications', () => ({
  getNotifications: (...args: unknown[]) => getNotificationsMock(...args),
  markAllNotificationsRead: (...args: unknown[]) => markAllNotificationsReadMock(...args),
}));

vi.mock('../../../realtime/socket', () => ({
  connectSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
}));

import Header from '../index';

describe('Header notifications', () => {
  beforeEach(() => {
    getNotificationsMock.mockReset();
    markAllNotificationsReadMock.mockReset();
    markAllNotificationsReadMock.mockResolvedValue({ ok: true, data: { count: 1 } });
    getNotificationsMock.mockResolvedValue({
      ok: true,
      data: {
        data: [
          {
            id: 'n1',
            userId: 'u1',
            title: 'Actualización de orden',
            body: 'Tu orden cambió de pending a preparing',
            type: 'ORDER_STATUS_CHANGED',
            orderId: 'b582331c-1234-5678-90ab-cdef12345678',
            payload: { previousStatus: 'pending', newStatus: 'preparing' },
            readAt: null,
            createdAt: '2026-01-03T10:00:00.000Z',
          },
        ],
        unreadCount: 1,
        total: 1,
      },
    });
    useAuthMock.mockReturnValue({
      user: { id: 'u1', type: 'client', email: 'client@test.com' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  it('fetches inbox notifications on login', async () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getNotificationsMock).toHaveBeenCalledWith({ inbox: true, recentRead: 5 });
    });
  });

  it('shows short order id and marks all as read when opening the panel', async () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getNotificationsMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByLabelText('Notificaciones'));

    expect(await screen.findByText(/#b582331c · Actualización de orden/)).toBeInTheDocument();
    await waitFor(() => {
      expect(markAllNotificationsReadMock).toHaveBeenCalledTimes(1);
    });
  });
});
