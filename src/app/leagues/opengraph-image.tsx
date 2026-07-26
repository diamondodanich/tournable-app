import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Чемпионаты — Tournable'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return renderOgCard({
    eyebrow: 'Каталог',
    title: 'Чемпионаты и лиги',
    subtitle: 'Таблицы сезонов, страницы команд и игроков, статистика за всю историю',
  })
}
