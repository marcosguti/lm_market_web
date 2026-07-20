import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DeliveryMotorcycleIcon } from '../index';
import {
  createDeliveryMotorcycleMarkerElement,
  DELIVERY_MOTORCYCLE_PRIMARY,
  DELIVERY_MOTORCYCLE_SRC,
} from '../marker';

describe('DeliveryMotorcycleIcon', () => {
  it('renders circular primary badge with motorcycle image', () => {
    render(<DeliveryMotorcycleIcon aria-label="Repartidor: Jose" />);

    const icon = screen.getByTestId('delivery-motorcycle-icon');
    expect(icon).toHaveAttribute('aria-label', 'Repartidor: Jose');
    expect(icon).toHaveClass('border-primary', 'bg-white', 'rounded-full');
    expect(icon.querySelector('img')).toHaveAttribute('src', DELIVERY_MOTORCYCLE_SRC);
  });

  it('invokes onClick when pressed', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<DeliveryMotorcycleIcon onClick={onClick} />);

    await user.click(screen.getByTestId('delivery-motorcycle-icon'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('createDeliveryMotorcycleMarkerElement matches circular badge', () => {
    const el = createDeliveryMotorcycleMarkerElement();
    expect(el.style.borderRadius).toBe('9999px');
    expect(el.style.background).toBe('rgb(255, 255, 255)');
    expect(el.style.border).toMatch(/2px solid (?:#97BD11|rgb\(151,\s*189,\s*17\))/i);
    expect(el.querySelector('img')).toHaveAttribute('src', DELIVERY_MOTORCYCLE_SRC);
    expect(DELIVERY_MOTORCYCLE_PRIMARY).toBe('#97BD11');
  });
});
