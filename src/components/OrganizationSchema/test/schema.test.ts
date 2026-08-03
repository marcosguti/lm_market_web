import { describe, expect, it } from 'vitest'

import {
  buildGroceryStoreSchema,
  buildSiteNavigationSchema,
  buildWebsiteSchema,
} from '../schema'

describe('OrganizationSchema builders', () => {
  it('builds a GroceryStore schema with contact and social data', () => {
    const schema = buildGroceryStoreSchema()

    expect(schema['@type']).toBe('GroceryStore')
    expect(schema.name).toBe('LM Market')
    expect(schema.telephone).toBe('+58-412-1184736')
    expect(schema.email).toBe('Soporte@lmmarketca.com')
    expect(schema.sameAs).toEqual(['https://instagram.com/grupolmmarket'])
  })

  it('builds site navigation for brand sitelink candidates', () => {
    const schema = buildSiteNavigationSchema()

    expect(schema['@type']).toBe('ItemList')
    expect(schema.itemListElement).toHaveLength(5)
    expect(schema.itemListElement.map((item) => item.name)).toEqual([
      'Inicio',
      'Nosotros',
      'Blog',
      'Preguntas frecuentes',
      'Contacto',
    ])
    expect(schema.itemListElement[0]?.url).toBe('https://www.lmmarket.com/')
    expect(schema.itemListElement[2]?.url).toBe('https://www.lmmarket.com/blog')
  })

  it('builds a WebSite schema without SearchAction', () => {
    const schema = buildWebsiteSchema()

    expect(schema['@type']).toBe('WebSite')
    expect(schema.url).toBe('https://www.lmmarket.com')
    expect(schema).not.toHaveProperty('potentialAction')
  })
})
