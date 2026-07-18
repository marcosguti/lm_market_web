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

function createDriverMarker() {
  const element = document.createElement('img');
  element.src = '/delivery_motorcycle.png';
  element.alt = 'Repartidor';
  element.width = 40;
  element.height = 40;
  element.style.objectFit = 'contain';
  element.style.cursor = 'default';
  element.onerror = () => {
    element.replaceWith(createEmojiMarker('🏍️'));
  };
  return element;
}

function createEmojiMarker(label: string, fontSize = '24px') {
  const element = document.createElement('div');
  element.textContent = label;
  element.style.fontSize = fontSize;
  element.style.lineHeight = '1';
  element.style.cursor = 'default';
  element.setAttribute('aria-hidden', 'true');
  return element;
}

function fitMapToTracking(map: mapboxgl.Map, tracking: OrderTrackingSnapshot) {
  const points: [number, number][] = [];
  if (tracking.location) {
    points.push([tracking.location.longitude, tracking.location.latitude]);
  }
  if (tracking.destination) {
    points.push([tracking.destination.longitude, tracking.destination.latitude]);
  }
  tracking.routeGeometry?.coordinates?.forEach((coordinate) => {
    points.push(coordinate);
  });

  if (points.length === 0) return;
  if (points.length === 1) {
    map.easeTo({ center: points[0], zoom: 14 });
    return;
  }

  const bounds = points.reduce(
    (current, point) => current.extend(point),
    new mapboxgl.LngLatBounds(points[0], points[0])
  );
  map.fitBounds(bounds, { maxZoom: 15, padding: 48 });
}

function updateRouteLayer(map: mapboxgl.Map, tracking: OrderTrackingSnapshot) {
  if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
  if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);

  if (!tracking.routeGeometry?.coordinates?.length) return;

  map.addSource(ROUTE_SOURCE_ID, {
    data: {
      geometry: tracking.routeGeometry,
      properties: {},
      type: 'Feature',
    },
    type: 'geojson',
  });
  map.addLayer({
    id: ROUTE_LAYER_ID,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#2563eb', 'line-width': 4 },
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
  const [tracking, setTracking] = useState<OrderTrackingSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackingEnded, setTrackingEnded] = useState(false);
  const [subscribeError, setSubscribeError] = useState('');
  const mapboxToken = resolveMapboxToken();

  useEffect(() => {
    fetchTrackingRef.current = fetchTracking;
  }, [fetchTracking]);

  const applyTrackingToMap = useCallback((nextTracking: OrderTrackingSnapshot) => {
    const map = mapRef.current;
    if (!map) return;

    const syncMarker = (
      markerRef: { current: mapboxgl.Marker | null },
      coordinates: [number, number] | null,
      createElement: () => HTMLElement
    ) => {
      if (!coordinates) {
        markerRef.current?.remove();
        markerRef.current = null;
        return;
      }

      if (!markerRef.current) {
        markerRef.current = new mapboxgl.Marker({
          element: createElement(),
        }).addTo(map);
      }
      markerRef.current.setLngLat(coordinates);
    };

    syncMarker(
      driverMarkerRef,
      nextTracking.location
        ? [nextTracking.location.longitude, nextTracking.location.latitude]
        : null,
      createDriverMarker
    );
    syncMarker(
      destinationMarkerRef,
      nextTracking.destination
        ? [nextTracking.destination.longitude, nextTracking.destination.latitude]
        : null,
      () => createEmojiMarker('📍')
    );

    const refreshLayers = () => {
      updateRouteLayer(map, nextTracking);
      if (!didFitCameraRef.current) {
        fitMapToTracking(map, nextTracking);
        didFitCameraRef.current = true;
      } else if (nextTracking.location) {
        map.easeTo({
          center: [nextTracking.location.longitude, nextTracking.location.latitude],
        });
      }
    };

    if (map.isStyleLoaded()) {
      refreshLayers();
      return;
    }
    map.once('load', refreshLayers);
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
          setError((result.data as { error?: string })?.error ?? 'No se pudo cargar el seguimiento');
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
    if (!open || !mapboxToken || !mapContainerRef.current) return;

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

    return () => {
      driverMarkerRef.current?.remove();
      destinationMarkerRef.current?.remove();
      driverMarkerRef.current = null;
      destinationMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [mapboxToken, open]);

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
