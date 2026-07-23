import { render, screen, waitFor } from '@testing-library/react';
import { lazy, Suspense, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import Loader from '../../components/Loader';

describe('App route Suspense fallback', () => {
  it('shows the initial-load Loader while a lazy page chunk is pending', async () => {
    let resolveModule: (value: { default: () => ReactElement }) => void;
    const LazyPage = lazy(
      () =>
        new Promise<{ default: () => ReactElement }>((resolve) => {
          resolveModule = resolve;
        }),
    );

    render(
      <Suspense fallback={<Loader />}>
        <LazyPage />
      </Suspense>,
    );

    const logo = screen.getByAltText('LM Market Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/logo.png');

    resolveModule!({ default: () => <div>lazy-page-ready</div> });

    await waitFor(() => {
      expect(screen.getByText('lazy-page-ready')).toBeInTheDocument();
    });
    expect(screen.queryByAltText('LM Market Logo')).not.toBeInTheDocument();
  });
});
