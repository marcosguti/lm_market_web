import { PATHS } from '../../constants/paths'

const SITE_URL = 'https://www.lmmarket.com'

const NAV_ITEMS = [
  { name: 'Inicio', path: PATHS.home },
  { name: 'Nosotros', path: PATHS.about },
  { name: 'Blog', path: PATHS.blog },
  { name: 'Preguntas frecuentes', path: PATHS.faq },
  { name: 'Contacto', path: PATHS.contact },
] as const

export function buildGroceryStoreSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'GroceryStore',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'VE',
      addressLocality: 'Tovar',
      addressRegion: 'Mérida',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      availableLanguage: 'Spanish',
      contactType: 'customer service',
      email: 'Soporte@lmmarketca.com',
      telephone: '+58-412-1184736',
    },
    email: 'Soporte@lmmarketca.com',
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '8.40',
      longitude: '-71.75',
    },
    logo: `${SITE_URL}/logo.png`,
    name: 'LM Market',
    sameAs: ['https://instagram.com/grupolmmarket'],
    telephone: '+58-412-1184736',
    url: SITE_URL,
  }
}

export function buildSiteNavigationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: NAV_ITEMS.map((item, index) => ({
      '@type': 'SiteNavigationElement',
      name: item.name,
      position: index + 1,
      url: item.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${item.path}`,
    })),
  }
}

export function buildWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LM Market',
    url: SITE_URL,
  }
}
