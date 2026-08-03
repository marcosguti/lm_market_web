import { Helmet } from 'react-helmet-async'

import {
  buildGroceryStoreSchema,
  buildSiteNavigationSchema,
  buildWebsiteSchema,
} from './schema'

const OrganizationSchema = () => {
  const groceryStoreJson = JSON.stringify(buildGroceryStoreSchema())
  const navigationJson = JSON.stringify(buildSiteNavigationSchema())
  const websiteJson = JSON.stringify(buildWebsiteSchema())

  return (
    <Helmet>
      <script type="application/ld+json">{groceryStoreJson}</script>
      <script type="application/ld+json">{websiteJson}</script>
      <script type="application/ld+json">{navigationJson}</script>
    </Helmet>
  )
}

export default OrganizationSchema
