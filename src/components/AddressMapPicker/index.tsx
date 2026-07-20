import { Alert, Button } from 'antd';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';

import type { DeliveryCitySlug } from '../../utils/deliveryCities';

import { putDeliveryAddress } from '../../api/authAddress';
import {
  asCoordNumber,
  DELIVERY_CITY_BOUNDS,
  DELIVERY_CITY_CENTER,
  DELIVERY_CITY_LABELS,
  deliveryCityMaskGeoJson,
  deliveryCityPolygonGeoJson,
  isInsideDeliveryCityPolygon,
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

function resolveStart(
  expectedCity: DeliveryCitySlug,
  initialLat?: null | number | string,
  initialLng?: null | number | string,
) {
  const center = DELIVERY_CITY_CENTER[expectedCity];
  const lat = asCoordNumber(initialLat) ?? center.lat;
  const lng = asCoordNumber(initialLng) ?? center.lng;
  if (isInsideDeliveryCityPolygon(expectedCity, lat, lng)) {
    return { latitude: lat, longitude: lng };
  }
  return { latitude: center.lat, longitude: center.lng };
}

export interface AddressMapPickerProps {
  expectedCity: DeliveryCitySlug;
  initialLat?: null | number | string;
  initialLng?: null | number | string;
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
  const lastValidRef = useRef(resolveStart(expectedCity, initialLat, initialLng));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const mapboxToken = resolveMapboxToken();
  const bounds = DELIVERY_CITY_BOUNDS[expectedCity];

  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current) return;

    mapboxgl.accessToken = mapboxToken;
    const start = resolveStart(expectedCity, initialLat, initialLng);
    lastValidRef.current = start;

    const map = new mapboxgl.Map({
      center: [start.longitude, start.latitude],
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
      .setLngLat([start.longitude, start.latitude])
      .addTo(map);
    markerRef.current = marker;

    const applyValidPosition = (lng: number, lat: number) => {
      if (isInsideDeliveryCityPolygon(expectedCity, lat, lng)) {
        lastValidRef.current = { latitude: lat, longitude: lng };
        marker.setLngLat([lng, lat]);
        return;
      }
      const fallback = lastValidRef.current;
      marker.setLngLat([fallback.longitude, fallback.latitude]);
    };

    const addZoneLayers = () => {
      if (!map.getSource('delivery-zone')) {
        map.addSource('delivery-zone', {
          type: 'geojson',
          data: deliveryCityPolygonGeoJson(expectedCity),
        });
        map.addLayer({
          id: 'delivery-zone-fill',
          type: 'fill',
          source: 'delivery-zone',
          paint: {
            'fill-color': '#22c55e',
            'fill-opacity': 0.28,
          },
        });
        map.addLayer({
          id: 'delivery-zone-outline',
          type: 'line',
          source: 'delivery-zone',
          paint: {
            'line-color': '#16a34a',
            'line-width': 2,
          },
        });
      }
      if (!map.getSource('delivery-zone-mask')) {
        map.addSource('delivery-zone-mask', {
          type: 'geojson',
          data: deliveryCityMaskGeoJson(expectedCity),
        });
        map.addLayer({
          id: 'delivery-zone-mask-fill',
          type: 'fill',
          source: 'delivery-zone-mask',
          paint: {
            'fill-color': '#f8d7da',
            'fill-opacity': 0.35,
          },
        });
      }
    };

    if (map.isStyleLoaded()) {
      addZoneLayers();
    } else {
      map.on('load', addZoneLayers);
    }

    map.on('click', (event) => {
      applyValidPosition(event.lngLat.lng, event.lngLat.lat);
    });
    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      applyValidPosition(lngLat.lng, lngLat.lat);
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
    expectedCity,
    initialLat,
    initialLng,
    mapboxToken,
  ]);

  const handleConfirm = async () => {
    const lngLat = markerRef.current?.getLngLat();
    if (!lngLat) return;
    if (!isInsideDeliveryCityPolygon(expectedCity, lngLat.lat, lngLat.lng)) {
      const fallback = lastValidRef.current;
      markerRef.current?.setLngLat([fallback.longitude, fallback.latitude]);
      setError('Elige un punto dentro de la zona sombreada en verde.');
      return;
    }
    setSaving(true);
    setError('');
    const result = await putDeliveryAddress({
      expectedCity,
      latitude: lngLat.lat,
      longitude: lngLat.lng,
    });
    setSaving(false);
    if (!result.ok || !result.data?.user) {
      setError(
        (result.data as { error?: string } | undefined)?.error ??
          'No se pudo guardar la ubicación. Debe estar en la ciudad de la tienda.',
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
        description="Solo la zona sombreada en verde es válida para entrega."
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
