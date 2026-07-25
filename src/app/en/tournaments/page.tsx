import type { Metadata } from 'next'
import CatalogPage from '@/components/seo/CatalogPage'
import { trilingualAlternates } from '@/lib/sportSeo'
import { absUrl } from '@/lib/seo'

export const revalidate = 600

const TITLE = 'Online tournaments: standings, fixtures and results'
const DESCRIPTION =
  'A catalogue of public tournaments on Tournable: football, basketball, volleyball, ice hockey, tennis, chess and esports. League tables, fixtures, playoff brackets and statistics — open by link, no sign-up.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: trilingualAlternates('/tournaments', 'en'),
  openGraph: {
    title: TITLE, description: DESCRIPTION, type: 'website',
    url: absUrl('/en/tournaments'), siteName: 'Tournable', locale: 'en_US',
    images: [{ url: '/logo-green.png' }],
  },
}

export default function TournamentsCatalogPageEn() {
  return <CatalogPage mode="tournaments" lang="en" />
}
