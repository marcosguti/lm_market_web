import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'

interface SEOProps {
  canonical?: string
  description?: string
  keywords?: string
  ogImage?: string
  ogType?: string
  robots?: string
  title?: string
}

const SITE_URL = 'https://www.lmmarket.com'

const SEO = ({
  canonical,
  description = 'LM Market, tu supermercado de confianza. Productos de excelente calidad al mejor precio. Encuentra todo lo que necesitas para tu hogar.',
  keywords = 'supermercado, LM Market, compras, productos, calidad, precios bajos, Tovar, Mérida, Venezuela',
  ogImage = '/logo.png',
  ogType = 'website',
  robots = 'index, follow',
  title = 'LM Market - Calidad al mejor precio',
}: SEOProps) => {
  const { pathname } = useLocation()
  const fullTitle = title.includes('LM Market') ? title : `${title} | LM Market`
  const path = pathname.replace(/\/+$/, '') || '/'
  const resolvedCanonical = canonical ?? `${SITE_URL}${path === '/' ? '/' : path}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={resolvedCanonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${SITE_URL}${ogImage}`} />
      <meta property="og:site_name" content="LM Market" />
      <meta property="og:locale" content="es_VE" />
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={resolvedCanonical} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={`${SITE_URL}${ogImage}`} />
      <meta name="robots" content={robots} />
      <meta name="language" content="Spanish" />
      <meta name="author" content="LM Market" />
      <meta name="geo.region" content="VE-M" />
      <meta name="geo.placename" content="Tovar, Mérida" />
    </Helmet>
  )
}

export default SEO
