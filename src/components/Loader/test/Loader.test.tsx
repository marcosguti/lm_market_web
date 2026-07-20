import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Loader from '../index'

describe('Loader', () => {
  it('renders the logo without a spinner', () => {
    const { container } = render(<Loader />)

    const logo = screen.getByAltText('LM Market Logo')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', '/logo.png')
    expect(container.querySelector('.animate-spin')).toBeNull()
  })
})
