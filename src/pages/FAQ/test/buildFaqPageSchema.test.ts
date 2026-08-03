import { describe, expect, it } from 'vitest'

import { buildFaqPageSchema } from '../buildFaqPageSchema'

describe('buildFaqPageSchema', () => {
  it('maps FAQ items to FAQPage JSON-LD', () => {
    const schema = buildFaqPageSchema([
      {
        answer: 'Entregamos en Mérida y Tovar.',
        question: '¿En qué ciudades hacen entregas?',
      },
    ])

    expect(schema['@type']).toBe('FAQPage')
    expect(schema.mainEntity).toHaveLength(1)
    expect(schema.mainEntity[0]).toMatchObject({
      '@type': 'Question',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Entregamos en Mérida y Tovar.',
      },
      name: '¿En qué ciudades hacen entregas?',
    })
  })
})
