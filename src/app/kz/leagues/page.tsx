import type { Metadata } from 'next'
import CatalogPage from '@/components/seo/CatalogPage'
import { trilingualAlternates } from '@/lib/sportSeo'
import { absUrl } from '@/lib/seo'

export const revalidate = 600

const TITLE = 'Чемпионаттар мен лигалар: кестелер, командалар және ойыншылар'
const DESCRIPTION =
  'Tournable-дегі ашық чемпионаттар каталогы: ағымдағы маусым кестесі, командалар мен ойыншылардың тұрақты беттері, бүкіл тарих статистикасы және өткен маусымдар мұрағаты.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: trilingualAlternates('/leagues', 'kz'),
  openGraph: {
    title: TITLE, description: DESCRIPTION, type: 'website',
    url: absUrl('/kz/leagues'), siteName: 'Tournable', locale: 'kk_KZ',
  },
}

export default function LeaguesCatalogPageKz() {
  return <CatalogPage mode="leagues" lang="kz" />
}
