import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/authAddress', () => ({
  putDeliveryAddress: vi.fn(),
}));

vi.mock('mapbox-gl', () => {
  const Map = vi.fn().mockImplementation(() => ({
    addControl: vi.fn(),
    on: vi.fn(),
    remove: vi.fn(),
  }));
  const Marker = vi.fn().mockImplementation(() => ({
    addTo: vi.fn().mockReturnThis(),
    getLngLat: vi.fn(() => ({ lat: 8.59, lng: -71.15 })),
    on: vi.fn(),
    remove: vi.fn(),
    setLngLat: vi.fn().mockReturnThis(),
  }));
  return {
    default: {
      Map,
      Marker,
      NavigationControl: vi.fn(),
      accessToken: '',
    },
  };
});

import { AddressMapPicker } from '../index';

describe('AddressMapPicker', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_MAPBOX_ACCESS_TOKEN', '');
  });

  it('shows missing token message when Mapbox is not configured', () => {
    render(<AddressMapPicker expectedCity="merida" onSaved={vi.fn()} storeName="Las Americas" />);
    expect(screen.getByText('Mapa no disponible')).toBeInTheDocument();
  });
});
