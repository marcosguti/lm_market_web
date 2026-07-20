import { Alert, Modal, Spin, Typography } from 'antd';
import mapboxgl from 'mapbox-gl';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { ApiResult } from '../../api/client';
import type {
  OrderTrackingSnapshot,
  TrackingEndedEvent,
  TrackingLocationEvent,
  TrackingRouteEvent,
} from '../../types/tracking';

import { connectSocket, getSocket } from '../../realtime/socket';
import { asCoordNumber } from '../../utils/deliveryCities';
import { createDeliveryMotorcycleMarkerElement } from '../DeliveryMotorcycleIcon/marker';
import { formatTrackingDistance, formatTrackingEta } from './formatTracking';

import 'mapbox-gl/dist/mapbox-gl.css';

const { Text } = Typography;

const ROUTE_LAYER_ID = 'delivery-route';
const ROUTE_SOURCE_ID = 'delivery-route-source';
const TOKEN_KEY = 'lm_market_token';

export interface LiveDeliveryMapProps {
  fetchTracking: () => Promise<ApiResult<{ tracking: OrderTrackingSnapshot }>>;
  onClose: () => void;
  open: boolean;
  orderId: string;
  role: 'admin' | 'client';
}

function resolveMapboxToken() {
  return import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim() ?? '';
}

function createDestinationMarkerElement(): HTMLDivElement {
  const element = document.createElement('div');
  element.setAttribute('aria-label', 'Destino');
  element.style.width = '28px';
  element.style.height = '36px';
  element.style.cursor = 'default';
  element.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))';
  element.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="36" aria-hidden="true">
  <path fill="#97BD11" d="M12 0C5.925 0 1 4.925 1 11c0 7.5 9.2 18.4 10.35 19.7a1 1 0 0 0 1.3 0C13.8 29.4 23 18.5 23 11 23 4.925 18.075 0 12 0z"/>
  <circle cx="12" cy="11" r="4.5" fill="#ffffff"/>
</svg>`;
  return element;
}

function toLngLat(longitude: unknown, latitude: unknown): [number, number] | null {
  const lng = asCoordNumber(longitude);
  const lat = asCoordNumber(latitude);
  if (lng === null || lat === null) return null;
  return [lng, lat];
}

function isMapReady(map: mapboxgl.Map): boolean {
  const container = map.getContainer();
  return Boolean(container?.isConnected && container.clientWidth > 0 && container.clientHeight > 0);
}

function fitMapToTracking(map: mapboxgl.Map, tracking: OrderTrackingSnapshot) {
  const points: [number, number][] = [];
  const location = tracking.location
    ? toLngLat(tracking.location.longitude, tracking.location.latitude)
    : null;
  const destination = tracking.destination
    ? toLngLat(tracking.destination.longitude, tracking.destination.latitude)
    : null;
  if (location) points.push(location);
  if (destination) points.push(destination);
  tracking.routeGeometry?.coordinates?.forEach((coordinate) => {
    const point = toLngLat(coordinate[0], coordinate[1]);
    if (point) points.push(point);
  });

  if (points.length === 0) return;
  if (points.length === 1) {
    map.jumpTo({ center: points[0], zoom: 14 });
    return;
  }

  const bounds = new mapboxgl.LngLatBounds(points[0], points[0]);
  for (const point of points) {
    bounds.extend(point);
  }
  map.fitBounds(bounds, { duration: 0, maxZoom: 15, padding: 48 });
}

function updateRouteLayer(map: mapboxgl.Map, tracking: OrderTrackingSnapshot) {
  if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
  if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);

  const rawCoordinates = tracking.routeGeometry?.coordinates;
  if (!rawCoordinates?.length) return;

  const coordinates = rawCoordinates
    .map((coordinate) => toLngLat(coordinate[0], coordinate[1]))
    .filter((point): point is [number, number] => point !== null);
  if (coordinates.length < 2) return;

  map.addSource(ROUTE_SOURCE_ID, {
    data: {
      geometry: { coordinates, type: 'LineString' },
      properties: {},
      type: 'Feature',
    },
    type: 'geojson',
  });
  map.addLayer({
    id: ROUTE_LAYER_ID,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#97BD11', 'line-width': 4 },
    source: ROUTE_SOURCE_ID,
    type: 'line',
  });
}

export function LiveDeliveryMap({
  fetchTracking,
  onClose,
  open,
  orderId,
  role,
}: LiveDeliveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const fetchTrackingRef = useRef(fetchTracking);
  const pendingRouteRef = useRef<TrackingRouteEvent | null>(null);
  const didFitCameraRef = useRef(false);
  const trackingRef = useRef<OrderTrackingSnapshot | null>(null);
  const trackingEndedRef = useRef(false);
  const [tracking, setTracking] = useState<OrderTrackingSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackingEnded, setTrackingEnded] = useState(false);
  const [subscribeError, setSubscribeError] = useState('');
  const [modalOpened, setModalOpened] = useState(false);
  const mapboxToken = resolveMapboxToken();

  useEffect(() => {
    fetchTrackingRef.current = fetchTracking;
  }, [fetchTracking]);

  useEffect(() => {
    trackingRef.current = tracking;
  }, [tracking]);

  useEffect(() => {
    trackingEndedRef.current = trackingEnded;
  }, [trackingEnded]);

  const applyTrackingToMap = useCallback((nextTracking: OrderTrackingSnapshot) => {
    const map = mapRef.current;
    if (!map) return;

    const syncMarker = (
      markerRef: { current: mapboxgl.Marker | null },
      coordinates: [number, number] | null,
      createElement: () => HTMLElement,
      markerOptions?: mapboxgl.MarkerOptions
    ) => {
      if (!coordinates) {
        markerRef.current?.remove();
        markerRef.current = null;
        return;
      }

      if (!markerRef.current) {
        // setLngLat before addTo — Mapbox projects on add and rejects missing LngLat.
        markerRef.current = new mapboxgl.Marker({
          element: createElement(),
          ...markerOptions,
        })
          .setLngLat(coordinates)
          .addTo(map);
        return;
      }
      markerRef.current.setLngLat(coordinates);
    };

    const run = () => {
      if (mapRef.current !== map || !isMapReady(map)) return;

      syncMarker(
        driverMarkerRef,
        nextTracking.location
          ? toLngLat(nextTracking.location.longitude, nextTracking.location.latitude)
          : null,
        createDeliveryMotorcycleMarkerElement
      );
      syncMarker(
        destinationMarkerRef,
        nextTracking.destination
          ? toLngLat(nextTracking.destination.longitude, nextTracking.destination.latitude)
          : null,
        createDestinationMarkerElement,
        { anchor: 'bottom' }
      );

      updateRouteLayer(map, nextTracking);
      if (!didFitCameraRef.current) {
        fitMapToTracking(map, nextTracking);
        didFitCameraRef.current = true;
      } else {
        const center = nextTracking.location
          ? toLngLat(nextTracking.location.longitude, nextTracking.location.latitude)
          : null;
        if (center) {
          map.easeTo({ center });
        }
      }
    };

    if (!map.isStyleLoaded()) {
      map.once('load', () => {
        map.resize();
        run();
      });
      return;
    }

    map.resize();
    if (!isMapReady(map)) {
      requestAnimationFrame(() => {
        if (mapRef.current !== map) return;
        map.resize();
        run();
      });
      return;
    }
    run();
  }, []);

  useEffect(() => {
    if (!open || !orderId) return;

    let cancelled = false;
    pendingRouteRef.current = null;
    didFitCameraRef.current = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setError('');
      setSubscribeError('');
      setTrackingEnded(false);
      setTracking(null);
    });

    void fetchTrackingRef
      .current()
      .then((result) => {
        if (cancelled) return;
        if (!result.ok || !result.data?.tracking) {
          setError(
            (result.data as { error?: string })?.error ?? 'No se pudo cargar el seguimiento'
          );
          setTracking(null);
          return;
        }
        const snapshot = result.data.tracking;
        const pendingRoute = pendingRouteRef.current;
        pendingRouteRef.current = null;
        setTracking(
          pendingRoute
            ? {
                ...snapshot,
                distanceMeters: pendingRoute.distanceMeters,
                etaSeconds: pendingRoute.etaSeconds,
                routeCalculatedAt: pendingRoute.routeCalculatedAt,
                routeGeometry: pendingRoute.routeGeometry,
              }
            : snapshot
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, orderId]);

  useEffect(() => {
    if (!open || !orderId) return;

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const socket = getSocket() ?? connectSocket(token);

    const subscribe = () => {
      socket.emit(
        'tracking:subscribe',
        { orderId },
        (ack: { ok?: boolean; error?: string } | undefined) => {
          if (ack && ack.ok === false) {
            setSubscribeError(ack.error ?? 'No se pudo suscribir al seguimiento');
          }
        }
      );
    };

    subscribe();

    const onLocation = (payload: TrackingLocationEvent) => {
      if (payload.orderId !== orderId) return;
      setTracking((current) =>
        current
          ? { ...current, isStale: false, location: payload.location }
          : {
              destination: null,
              distanceMeters: null,
              etaSeconds: null,
              isStale: false,
              location: payload.location,
              orderId,
              routeCalculatedAt: null,
              routeGeometry: null,
              staleAfterSeconds: 60,
              status: 'delivering',
            }
      );
    };

    const onRoute = (payload: TrackingRouteEvent) => {
      if (payload.orderId !== orderId) return;
      setTracking((current) => {
        if (!current) {
          pendingRouteRef.current = payload;
          return null;
        }
        return {
          ...current,
          distanceMeters: payload.distanceMeters,
          etaSeconds: payload.etaSeconds,
          routeCalculatedAt: payload.routeCalculatedAt,
          routeGeometry: payload.routeGeometry,
        };
      });
    };

    const onEnded = (payload: TrackingEndedEvent) => {
      if (payload.orderId !== orderId) return;
      setTrackingEnded(true);
    };

    socket.on('connect', subscribe);
    socket.on('tracking:location', onLocation);
    socket.on('tracking:route', onRoute);
    socket.on('tracking:ended', onEnded);

    return () => {
      socket.emit('tracking:unsubscribe', { orderId });
      socket.off('connect', subscribe);
      socket.off('tracking:location', onLocation);
      socket.off('tracking:route', onRoute);
      socket.off('tracking:ended', onEnded);
    };
  }, [open, orderId]);

  useEffect(() => {
    if (!modalOpened || !mapboxToken || !mapContainerRef.current) return;

    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      center: [-66.9036, 10.4806],
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      zoom: 12,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;
    didFitCameraRef.current = false;

    const onLoad = () => {
      map.resize();
      const snapshot = trackingRef.current;
      if (snapshot && !trackingEndedRef.current) {
        applyTrackingToMap(snapshot);
      }
    };
    map.once('load', onLoad);

    return () => {
      driverMarkerRef.current?.remove();
      destinationMarkerRef.current?.remove();
      driverMarkerRef.current = null;
      destinationMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [applyTrackingToMap, mapboxToken, modalOpened]);

  useEffect(() => {
    if (!tracking || !mapRef.current || trackingEnded) return;
    applyTrackingToMap(tracking);
  }, [applyTrackingToMap, tracking, trackingEnded]);

  const title = role === 'admin' ? 'Seguimiento en vivo (admin)' : 'Seguimiento en vivo';

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      footer={null}
      width={920}
      destroyOnClose
      afterOpenChange={(visible) => {
        setModalOpened(visible);
        if (!visible) return;
        // Wait a frame after the open animation so the container has real size.
        requestAnimationFrame(() => {
          const map = mapRef.current;
          if (!map) return;
          map.resize();
          const snapshot = trackingRef.current;
          if (snapshot && !trackingEndedRef.current) {
            applyTrackingToMap(snapshot);
          }
        });
      }}
    >
      {!mapboxToken ? (
        <Alert
          type="warning"
          showIcon
          message="Mapa no disponible"
          description="Configura VITE_MAPBOX_ACCESS_TOKEN para ver el seguimiento en el mapa."
        />
      ) : null}
      {error ? <Alert type="error" showIcon message={error} className="mb-3" /> : null}
      {subscribeError ? (
        <Alert type="error" showIcon message={subscribeError} className="mb-3" />
      ) : null}
      {trackingEnded ? (
        <Alert type="info" showIcon message="El seguimiento en vivo finalizó." className="mb-3" />
      ) : null}
      {tracking?.isStale && !trackingEnded ? (
        <Alert
          type="warning"
          showIcon
          message="Ubicación desactualizada"
          description={`Sin actualizaciones recientes del repartidor (más de ${tracking.staleAfterSeconds}s).`}
          className="mb-3"
        />
      ) : null}
      <div className="mb-3 flex flex-wrap items-center gap-4">
        {loading ? <Spin size="small" /> : null}
        <Text>
          <strong>Distancia:</strong> {formatTrackingDistance(tracking?.distanceMeters ?? null)}
        </Text>
        <Text>
          <strong>ETA:</strong> {formatTrackingEta(tracking?.etaSeconds ?? null)}
        </Text>
      </div>
      {mapboxToken ? (
        <div
          ref={mapContainerRef}
          data-testid="live-delivery-map-container"
          className={`h-[420px] w-full overflow-hidden rounded-md border border-gray-200 bg-gray-50 ${
            trackingEnded ? 'pointer-events-none opacity-50' : ''
          }`}
        />
      ) : null}
    </Modal>
  );
}
