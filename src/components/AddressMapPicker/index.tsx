import { Alert, Button } from 'antd';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';

import type { DeliveryCitySlug } from '../../utils/deliveryCities';

import { putDeliveryAddress } from '../../api/authAddress';
import {
  clampToDeliveryCityBounds,
  DELIVERY_CITY_BOUNDS,
  DELIVERY_CITY_CENTER,
  DELIVERY_CITY_LABELS,
} from '../../utils/deliveryCities';

import 'mapbox-gl/dist/mapbox-gl.css';

function resolveMapboxToken() {
  return import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim() ?? '';
}

function createPinElement() {
  const element = document.createElement('div');
  element.textContent = '📍';
  element.style.fontSize = '28px';
  element.style.lineHeight = '1';
  element.style.cursor = 'grab';
  return element;
}

export interface AddressMapPickerProps {
  expectedCity: DeliveryCitySlug;
  initialLat?: null | number;
  initialLng?: null | number;
  onSaved: (user: {
    address?: null | string;
    addressCity?: null | string;
    addressLatitude?: null | number;
    addressLongitude?: null | number;
  }) => void;
  storeName?: string;
}

export function AddressMapPicker({
  expectedCity,
  initialLat,
  initialLng,
  onSaved,
  storeName,
}: AddressMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const mapboxToken = resolveMapboxToken();
  const center = DELIVERY_CITY_CENTER[expectedCity];
  const bounds = DELIVERY_CITY_BOUNDS[expectedCity];

  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current) return;

    mapboxgl.accessToken = mapboxToken;
    const clampedStart = clampToDeliveryCityBounds(
      expectedCity,
      initialLat ?? center.lat,
      initialLng ?? center.lng
    );
    const map = new mapboxgl.Map({
      center: [clampedStart.longitude, clampedStart.latitude],
      container: mapContainerRef.current,
      maxBounds: [
        [bounds.west, bounds.south],
        [bounds.east, bounds.north],
      ],
      style: 'mapbox://styles/mapbox/streets-v12',
      zoom: 13,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    const marker = new mapboxgl.Marker({ draggable: true, element: createPinElement() })
      .setLngLat([clampedStart.longitude, clampedStart.latitude])
      .addTo(map);
    markerRef.current = marker;

    const clampMarker = (lng: number, lat: number) => {
      const next = clampToDeliveryCityBounds(expectedCity, lat, lng);
      marker.setLngLat([next.longitude, next.latitude]);
    };

    map.on('click', (event) => {
      clampMarker(event.lngLat.lng, event.lngLat.lat);
    });
    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      clampMarker(lngLat.lng, lngLat.lat);
    });

    return () => {
      marker.remove();
      map.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [
    bounds.east,
    bounds.north,
    bounds.south,
    bounds.west,
    center.lat,
    center.lng,
    expectedCity,
    initialLat,
    initialLng,
    mapboxToken,
  ]);

  const handleConfirm = async () => {
    const lngLat = markerRef.current?.getLngLat();
    if (!lngLat) return;
    const clamped = clampToDeliveryCityBounds(expectedCity, lngLat.lat, lngLat.lng);
    markerRef.current?.setLngLat([clamped.longitude, clamped.latitude]);
    setSaving(true);
    setError('');
    const result = await putDeliveryAddress({
      expectedCity,
      latitude: clamped.latitude,
      longitude: clamped.longitude,
    });
    setSaving(false);
    if (!result.ok || !result.data?.user) {
      setError(
        (result.data as { error?: string } | undefined)?.error ??
          'No se pudo guardar la ubicación. Debe estar en la ciudad de la tienda.'
      );
      return;
    }
    onSaved(result.data.user);
  };

  if (!mapboxToken) {
    return (
      <Alert
        type="error"
        showIcon
        message="Mapa no disponible"
        description="Configura VITE_MAPBOX_ACCESS_TOKEN para elegir la dirección en el mapa."
      />
    );
  }

  return (
    <div className="space-y-3">
      <Alert
        type="info"
        showIcon
        message={`Elige un punto en ${DELIVERY_CITY_LABELS[expectedCity]}${
          storeName ? ` (tienda ${storeName})` : ''
        }`}
        description="Mueve el pin o toca el mapa. Solo se aceptan ubicaciones en esa ciudad."
      />
      {error ? <Alert type="error" showIcon message={error} /> : null}
      <div
        ref={mapContainerRef}
        data-testid="address-map-picker"
        className="h-[280px] w-full overflow-hidden rounded-md border border-gray-200"
      />
      <Button type="primary" block loading={saving} onClick={() => void handleConfirm()}>
        Confirmar dirección
      </Button>
    </div>
  );
}
