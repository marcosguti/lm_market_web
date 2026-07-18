import type { OrderStatus } from './order';

export interface OrderTrackingLocation {
  accuracyMeters: null | number;
  headingDegrees: null | number;
  latitude: number;
  longitude: number;
  serverReceivedAt: string;
  speedMps: null | number;
}

export interface OrderTrackingDestination {
  address: null | string;
  latitude: number;
  longitude: number;
}

export interface OrderTrackingRouteGeometry {
  coordinates: [number, number][];
  type: 'LineString';
}

export interface OrderTrackingSnapshot {
  destination: OrderTrackingDestination | null;
  distanceMeters: null | number;
  etaSeconds: null | number;
  isStale: boolean;
  location: OrderTrackingLocation | null;
  orderId: string;
  routeCalculatedAt: null | string;
  routeGeometry: OrderTrackingRouteGeometry | null;
  staleAfterSeconds: number;
  status: OrderStatus;
}

export interface TrackingLocationEvent {
  location: OrderTrackingLocation;
  orderId: string;
}

export interface TrackingRouteEvent {
  distanceMeters: null | number;
  etaSeconds: null | number;
  orderId: string;
  routeCalculatedAt: null | string;
  routeGeometry: OrderTrackingRouteGeometry | null;
}

export interface TrackingEndedEvent {
  orderId: string;
}
