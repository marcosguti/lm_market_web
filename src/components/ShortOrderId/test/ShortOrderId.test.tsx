import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ShortOrderId } from '../index';

describe('ShortOrderId', () => {
  it('renders short hash form of the order id', () => {
    render(<ShortOrderId id="a5350180-1234-5678-9abc-def012345678" />);
    expect(screen.getByText('#a5350180')).toBeInTheDocument();
  });
});
