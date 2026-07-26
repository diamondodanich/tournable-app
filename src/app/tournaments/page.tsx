import type { Metadata } from 'next'
import CatalogPage from '@/components/seo/CatalogPage'
import { trilingualAlternates } from '@/lib/sportSeo'
import { absUrl } from '@/lib/seo'

// Cached catalogue, refreshed every 10 minutes — new public tournaments appear
// without paying for an SSR pass on every crawl.
export const revalidate = 600

const TITLE = 'Турниры онлайн: таблицы, расписание и результаты'
const DESCRIPTION =
  'Каталог публичных турниров на Tournable: футбол, баскетбол, волейбол, хоккей, теннис, шахматы, киберспорт. Турнирные таблицы, расписание матчей, сетки плей-офф и статистика — открыто по ссылке, без регистрации.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: trilingualAlternates('/tournaments', 'ru'),
  openGraph: {
    title: TITLE, description: DESCRIPTION, type: 'website',
    url: absUrl('/tournaments'), siteName: 'Tournable', locale: 'ru_RU',
  },
}

export default function TournamentsCatalogPage() {
  return <CatalogPage mode="tournaments" lang="ru" />
}
