import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const getActiveDealsMock = vi.fn();

vi.mock('../../../api/deals', () => ({
  getActiveDeals: () => getActiveDealsMock(),
}));

import DealBannerModal from '../index';

describe('DealBannerModal', () => {
  it('renders provided images without fetching deals', () => {
    render(
      <DealBannerModal
        images={['https://example.com/deal-1.jpg']}
        loading={false}
        onClose={vi.fn()}
      />,
    );

    expect(getActiveDealsMock).not.toHaveBeenCalled();
    expect(screen.getByAltText('Oferta 1')).toHaveAttribute(
      'src',
      'https://example.com/deal-1.jpg',
    );
  });

  it('does not render while loading', () => {
    const { container } = render(
      <DealBannerModal images={[]} loading onClose={vi.fn()} />,
    );

    expect(getActiveDealsMock).not.toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });
});
