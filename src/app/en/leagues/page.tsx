import type { Metadata } from 'next'
import CatalogPage from '@/components/seo/CatalogPage'
import { trilingualAlternates } from '@/lib/sportSeo'
import { absUrl } from '@/lib/seo'

export const revalidate = 600

const TITLE = 'Championships and leagues: tables, teams and players'
const DESCRIPTION =
  'A catalogue of public championships on Tournable: the current season table, permanent team and player pages, all-time statistics and an archive of past seasons.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: trilingualAlternates('/leagues', 'en'),
  openGraph: {
    title: TITLE, description: DESCRIPTION, type: 'website',
    url: absUrl('/en/leagues'), siteName: 'Tournable', locale: 'en_US',
  },
}

export default function LeaguesCatalogPageEn() {
  return <CatalogPage mode="leagues" lang="en" />
}
