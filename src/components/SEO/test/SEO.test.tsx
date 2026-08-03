import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import SEO from '../index'

function renderSEO(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </HelmetProvider>,
  )
}

describe('SEO', () => {
  it('sets canonical from the current route pathname', () => {
    renderSEO(<SEO title="Nosotros" description="Sobre LM Market." />, {
      route: '/nosotros',
    })

    const canonical = document.querySelector('link[rel="canonical"]')
    expect(canonical).toHaveAttribute('href', 'https://www.lmmarket.com/nosotros')
    expect(document.title).toBe('Nosotros | LM Market')
  })

  it('uses an explicit canonical override when provided', () => {
    renderSEO(
      <SEO
        title="Blog"
        description="Blog LM Market."
        canonical="https://www.lmmarket.com/blog/custom"
      />,
      { route: '/blog' },
    )

    const canonical = document.querySelector('link[rel="canonical"]')
    expect(canonical).toHaveAttribute('href', 'https://www.lmmarket.com/blog/custom')
  })

  it('applies robots and Open Graph site metadata', () => {
    renderSEO(
      <SEO title="Iniciar sesión" description="Login." robots="noindex, nofollow" />,
      { route: '/iniciar-sesion' },
    )

    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    )
    expect(document.querySelector('meta[property="og:site_name"]')).toHaveAttribute(
      'content',
      'LM Market',
    )
    expect(document.querySelector('meta[property="og:locale"]')).toHaveAttribute(
      'content',
      'es_VE',
    )
  })
})
