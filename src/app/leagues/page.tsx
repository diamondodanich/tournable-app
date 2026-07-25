import type { Metadata } from 'next'
import CatalogPage from '@/components/seo/CatalogPage'
import { trilingualAlternates } from '@/lib/sportSeo'
import { absUrl } from '@/lib/seo'

export const revalidate = 600

const TITLE = 'Чемпионаты и лиги: турнирные таблицы, команды и игроки'
const DESCRIPTION =
  'Каталог публичных чемпионатов на Tournable: турнирная таблица текущего сезона, страницы команд и игроков, статистика за всю историю и архив прошлых сезонов.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: trilingualAlternates('/leagues', 'ru'),
  openGraph: {
    title: TITLE, description: DESCRIPTION, type: 'website',
    url: absUrl('/leagues'), siteName: 'Tournable', locale: 'ru_RU',
    images: [{ url: '/logo-green.png' }],
  },
}

export default function LeaguesCatalogPage() {
  return <CatalogPage mode="leagues" lang="ru" />
}
