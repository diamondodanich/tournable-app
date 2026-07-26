import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Турниры — Tournable'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return renderOgCard({
    eyebrow: 'Каталог',
    title: 'Турниры и соревнования онлайн',
    subtitle: 'Таблицы, расписание и результаты — открыто по ссылке',
  })
}
