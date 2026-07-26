import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Спорт түрлері — Tournable'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return renderOgCard({
    eyebrow: 'Спорт түрлері',
    title: 'Кез келген пән бойынша турнир',
    subtitle: 'Футбол, баскетбол, волейбол, хоккей, теннис, шахмат, MMA, киберспорт',
  })
}
