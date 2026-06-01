import { Helmet } from 'react-helmet-async';

const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'LM Market',
  url: 'https://www.lmmarket.com',
  logo: 'https://www.lmmarket.com/logo.png',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Tovar',
    addressRegion: 'Mérida',
    addressCountry: 'VE',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '8.40',
    longitude: '-71.75',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: 'Spanish',
  },
  sameAs: [],
};

const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'LM Market',
  url: 'https://www.lmmarket.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://www.lmmarket.com/?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

const OrganizationSchema = () => {
  const organizationJson = JSON.stringify(ORGANIZATION_SCHEMA);
  const websiteJson = JSON.stringify(WEBSITE_SCHEMA);

  return (
    <Helmet>
      <script type="application/ld+json">{organizationJson}</script>
      <script type="application/ld+json">{websiteJson}</script>
    </Helmet>
  );
};

export default OrganizationSchema;
