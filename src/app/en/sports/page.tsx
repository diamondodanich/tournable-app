import type { Metadata } from 'next'
import SportsIndex from '@/components/seo/SportsIndex'
import { trilingualAlternates } from '@/lib/sportSeo'
import { absUrl } from '@/lib/seo'

const TITLE = 'Sports: create an online tournament in any discipline'
const DESCRIPTION =
  'A tournament maker for 30+ disciplines: football, futsal, basketball, volleyball, ice hockey, tennis, chess, MMA, esports and Kazakh national sports. Fixtures, league table, playoff bracket and statistics — free to start.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: trilingualAlternates('/sports', 'en'),
  openGraph: {
    title: TITLE, description: DESCRIPTION, type: 'website',
    url: absUrl('/en/sports'), siteName: 'Tournable', locale: 'en_US',
  },
}

export default function SportsIndexPageEn() {
  return <SportsIndex lang="en" />
}
