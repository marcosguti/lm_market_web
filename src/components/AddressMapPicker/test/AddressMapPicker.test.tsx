import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/authAddress', () => ({
  putDeliveryAddress: vi.fn(),
}));

vi.mock('mapbox-gl', () => ({
  default: {
    Map: vi.fn(),
    Marker: vi.fn(),
    NavigationControl: vi.fn(),
    accessToken: '',
  },
}));

import { AddressMapPicker } from '../index';

describe('AddressMapPicker', () => {
  it('shows missing token message when Mapbox is not configured', () => {
    render(
      <AddressMapPicker expectedCity="merida" onSaved={vi.fn()} storeName="Las Americas" />
    );
    expect(screen.getByText('Mapa no disponible')).toBeInTheDocument();
  });
});
