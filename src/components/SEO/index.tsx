import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  ogType?: string
  canonical?: string
}

const SEO = ({
  title = 'LM Market - Calidad al mejor precio',
  description = 'LM Market, tu supermercado de confianza. Productos de excelente calidad al mejor precio. Encuentra todo lo que necesitas para tu hogar.',
  keywords = 'supermercado, LM Market, compras, productos, calidad, precios bajos, Tovar, Mérida, Venezuela',
  ogImage = '/logo.png',
  ogType = 'website',
  canonical,
}: SEOProps) => {
  const fullTitle = title.includes('LM Market') ? title : `${title} | LM Market`
  const siteUrl = 'https://www.lmmarket.com'

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical || siteUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical || siteUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonical || siteUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={`${siteUrl}${ogImage}`} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Spanish" />
      <meta name="author" content="LM Market" />
      <meta name="geo.region" content="VE-M" />
      <meta name="geo.placename" content="Tovar, Mérida" />
    </Helmet>
  )
}

export default SEO

