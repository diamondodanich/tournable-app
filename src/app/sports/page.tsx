import type { Metadata } from 'next'
import SportsIndex from '@/components/seo/SportsIndex'
import { trilingualAlternates } from '@/lib/sportSeo'
import { absUrl } from '@/lib/seo'

const TITLE = 'Виды спорта: создать турнир онлайн по любой дисциплине'
const DESCRIPTION =
  'Конструктор турниров по 30+ дисциплинам: футбол, мини-футбол, баскетбол, волейбол, хоккей, теннис, шахматы, MMA, киберспорт и национальные виды спорта. Расписание, турнирная таблица, сетка плей-офф и статистика — бесплатно.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: trilingualAlternates('/sports', 'ru'),
  openGraph: {
    title: TITLE, description: DESCRIPTION, type: 'website',
    url: absUrl('/sports'), siteName: 'Tournable', locale: 'ru_RU',
    images: [{ url: '/logo-green.png' }],
  },
}

export default function SportsIndexPage() {
  return <SportsIndex lang="ru" />
}
