import type { Metadata } from 'next'
import CatalogPage from '@/components/seo/CatalogPage'
import { trilingualAlternates } from '@/lib/sportSeo'
import { absUrl } from '@/lib/seo'

export const revalidate = 600

const TITLE = 'Онлайн турнирлер: кестелер, матчтар және нәтижелер'
const DESCRIPTION =
  'Tournable-дегі ашық турнирлер каталогы: футбол, баскетбол, волейбол, хоккей, теннис, шахмат және киберспорт. Турнир кестелері, матчтар кестесі, плей-офф торлары мен статистика — сілтеме арқылы, тіркеусіз.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: trilingualAlternates('/tournaments', 'kz'),
  openGraph: {
    title: TITLE, description: DESCRIPTION, type: 'website',
    url: absUrl('/kz/tournaments'), siteName: 'Tournable', locale: 'kk_KZ',
  },
}

export default function TournamentsCatalogPageKz() {
  return <CatalogPage mode="tournaments" lang="kz" />
}
