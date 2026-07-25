import type { Metadata } from 'next'
import SportsIndex from '@/components/seo/SportsIndex'
import { trilingualAlternates } from '@/lib/sportSeo'
import { absUrl } from '@/lib/seo'

const TITLE = 'Спорт түрлері: кез келген пән бойынша онлайн турнир құру'
const DESCRIPTION =
  '30-дан астам пән бойынша турнир конструкторы: футбол, мини-футбол, баскетбол, волейбол, хоккей, теннис, шахмат, MMA, киберспорт және ұлттық спорт түрлері. Кесте, турнир кестесі, плей-офф торы және статистика — тегін.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: trilingualAlternates('/sports', 'kz'),
  openGraph: {
    title: TITLE, description: DESCRIPTION, type: 'website',
    url: absUrl('/kz/sports'), siteName: 'Tournable', locale: 'kk_KZ',
    images: [{ url: '/logo-green.png' }],
  },
}

export default function SportsIndexPageKz() {
  return <SportsIndex lang="kz" />
}
