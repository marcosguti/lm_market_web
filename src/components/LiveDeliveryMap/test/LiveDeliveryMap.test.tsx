import { render, screen, waitFor } from '@testing-library/react';
import { type ReactNode, useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OrderTrackingSnapshot } from '../../types/tracking';

const mapInstances: Array<{
  addControl: ReturnType<typeof vi.fn>;
  addLayer: ReturnType<typeof vi.fn>;
  addSource: ReturnType<typeof vi.fn>;
  easeTo: ReturnType<typeof vi.fn>;
  fitBounds: ReturnType<typeof vi.fn>;
  getContainer: ReturnType<typeof vi.fn>;
  getLayer: ReturnType<typeof vi.fn>;
  getSource: ReturnType<typeof vi.fn>;
  isStyleLoaded: ReturnType<typeof vi.fn>;
  jumpTo: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  once: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  removeLayer: ReturnType<typeof vi.fn>;
  removeSource: ReturnType<typeof vi.fn>;
  resize: ReturnType<typeof vi.fn>;
}> = [];

const markerInstances: Array<{
  addTo: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  setLngLat: ReturnType<typeof vi.fn>;
}> = [];

vi.mock('mapbox-gl', () => {
  class Map {
    addControl = vi.fn();
    addLayer = vi.fn();
    addSource = vi.fn();
    easeTo = vi.fn();
    fitBounds = vi.fn();
    getContainer = vi.fn(() => ({
      clientHeight: 420,
      clientWidth: 800,
      isConnected: true,
    }));
    getLayer = vi.fn();
    getSource = vi.fn();
    isStyleLoaded = vi.fn(() => true);
    jumpTo = vi.fn();
    on = vi.fn();
    once = vi.fn((_event: string, callback: () => void) => callback());
    remove = vi.fn();
    removeLayer = vi.fn();
    removeSource = vi.fn();
    resize = vi.fn();

    constructor() {
      mapInstances.push(this);
    }
  }

  class Marker {
    addTo = vi.fn().mockReturnThis();
    remove = vi.fn();
    setLngLat = vi.fn().mockReturnThis();

    constructor() {
      markerInstances.push(this);
    }
  }

  class LngLatBounds {
    extend = vi.fn().mockReturnThis();
    constructor() {}
  }

  return {
    default: {
      LngLatBounds,
      Map,
      Marker,
      NavigationControl: vi.fn(),
      accessToken: '',
    },
  };
});

const { socketEmit, socketOff, socketOn } = vi.hoisted(() => ({
  socketEmit: vi.fn(),
  socketOff: vi.fn(),
  socketOn: vi.fn(),
}));

vi.mock('../../../realtime/socket', () => ({
  connectSocket: vi.fn(() => ({
    emit: socketEmit,
    off: socketOff,
    on: socketOn,
  })),
  getSocket: vi.fn(() => ({
    emit: socketEmit,
    off: socketOff,
    on: socketOn,
  })),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');

  function TestModal({
    afterOpenChange,
    children,
    open,
    title,
  }: {
    afterOpenChange?: (visible: boolean) => void;
    children?: ReactNode;
    open?: boolean;
    title?: ReactNode;
  }) {
    useEffect(() => {
      afterOpenChange?.(Boolean(open));
    }, [afterOpenChange, open]);

    if (!open) return null;

    return (
      <div data-testid="live-delivery-modal">
        <div>{title}</div>
        {children}
      </div>
    );
  }

  return {
    ...actual,
    Modal: TestModal,
  };
});

import { formatTrackingDistance, formatTrackingEta } from '../formatTracking';
import { LiveDeliveryMap } from '../index';

const trackingSnapshot: OrderTrackingSnapshot = {
  destination: {
    address: 'Calle 1',
    latitude: 10.49,
    longitude: -66.88,
  },
  distanceMeters: 1250,
  etaSeconds: 420,
  isStale: false,
  location: {
    accuracyMeters: 10,
    headingDegrees: 90,
    latitude: 10.48,
    longitude: -66.9,
    serverReceivedAt: '2026-07-17T20:00:00.000Z',
    speedMps: 5,
  },
  orderId: 'order-1',
  routeCalculatedAt: '2026-07-17T20:00:00.000Z',
  routeGeometry: {
    coordinates: [
      [-66.9, 10.48],
      [-66.88, 10.49],
    ],
    type: 'LineString',
  },
  staleAfterSeconds: 60,
  status: 'delivering',
};

describe('formatTracking helpers', () => {
  it('formats distance and eta', () => {
    expect(formatTrackingDistance(850)).toBe('850 m');
    expect(formatTrackingDistance(1500)).toBe('1.5 km');
    expect(formatTrackingEta(420)).toBe('7 min');
    expect(formatTrackingEta(null)).toBe('—');
  });
});

describe('LiveDeliveryMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mapInstances.length = 0;
    markerInstances.length = 0;
    localStorage.setItem('lm_market_token', 'token');
    vi.stubEnv('VITE_MAPBOX_ACCESS_TOKEN', 'pk.test-token');
  });

  it('shows missing token warning without map container', async () => {
    vi.stubEnv('VITE_MAPBOX_ACCESS_TOKEN', '');

    render(
      <LiveDeliveryMap
        role="client"
        orderId="order-1"
        open
        onClose={vi.fn()}
        fetchTracking={vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          data: { tracking: trackingSnapshot },
        })}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Mapa no disponible')).toBeInTheDocument();
      expect(screen.queryByTestId('live-delivery-map-container')).not.toBeInTheDocument();
    });
  });

  it('loads tracking snapshot and subscribes to socket events', async () => {
    const fetchTracking = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      data: { tracking: trackingSnapshot },
    });

    render(
      <LiveDeliveryMap
        role="client"
        orderId="order-1"
        open
        onClose={vi.fn()}
        fetchTracking={fetchTracking}
      />
    );

    await waitFor(() => {
      expect(fetchTracking).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Distancia:')).toBeInTheDocument();
      expect(screen.getByText('1.3 km', { exact: false })).toBeInTheDocument();
      expect(screen.getByText('7 min', { exact: false })).toBeInTheDocument();
      expect(screen.getByTestId('live-delivery-map-container')).toBeInTheDocument();
      expect(socketEmit).toHaveBeenCalledWith(
        'tracking:subscribe',
        { orderId: 'order-1' },
        expect.any(Function)
      );
    });

    expect(socketOn).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(socketOn).toHaveBeenCalledWith('tracking:location', expect.any(Function));
    expect(socketOn).toHaveBeenCalledWith('tracking:route', expect.any(Function));
    expect(socketOn).toHaveBeenCalledWith('tracking:ended', expect.any(Function));
    expect(mapInstances.length).toBeGreaterThan(0);
  });

  it('creates map and calls resize after modal opens', async () => {
    render(
      <LiveDeliveryMap
        role="admin"
        orderId="order-1"
        open
        onClose={vi.fn()}
        fetchTracking={vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          data: { tracking: trackingSnapshot },
        })}
      />
    );

    await waitFor(() => {
      expect(mapInstances.length).toBe(1);
      expect(mapInstances[0].resize).toHaveBeenCalled();
    });
  });

  it('sets marker LngLat before adding to map', async () => {
    render(
      <LiveDeliveryMap
        role="admin"
        orderId="order-1"
        open
        onClose={vi.fn()}
        fetchTracking={vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          data: { tracking: trackingSnapshot },
        })}
      />
    );

    await waitFor(() => {
      expect(markerInstances.length).toBeGreaterThanOrEqual(2);
    });

    for (const marker of markerInstances) {
      expect(marker.setLngLat).toHaveBeenCalled();
      expect(marker.addTo).toHaveBeenCalled();
      const setOrder = marker.setLngLat.mock.invocationCallOrder[0];
      const addOrder = marker.addTo.mock.invocationCallOrder[0];
      expect(setOrder).toBeLessThan(addOrder);
    }
  });

  it('shows stale banner when tracking is stale', async () => {
    render(
      <LiveDeliveryMap
        role="admin"
        orderId="order-1"
        open
        onClose={vi.fn()}
        fetchTracking={vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          data: {
            tracking: { ...trackingSnapshot, isStale: true },
          },
        })}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Ubicación desactualizada')).toBeInTheDocument();
    });
  });

  it('unsubscribes when modal unmounts', async () => {
    const onClose = vi.fn();

    const { unmount } = render(
      <LiveDeliveryMap
        role="client"
        orderId="order-1"
        open
        onClose={onClose}
        fetchTracking={vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          data: { tracking: trackingSnapshot },
        })}
      />
    );

    await waitFor(() => {
      expect(socketEmit).toHaveBeenCalledWith(
        'tracking:subscribe',
        { orderId: 'order-1' },
        expect.any(Function)
      );
    });

    unmount();

    expect(socketEmit).toHaveBeenCalledWith('tracking:unsubscribe', { orderId: 'order-1' });
  });
});
