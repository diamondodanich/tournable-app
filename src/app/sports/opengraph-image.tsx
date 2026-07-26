import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Виды спорта — Tournable'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return renderOgCard({
    eyebrow: 'Виды спорта',
    title: 'Турнир по любой дисциплине',
    subtitle: 'Футбол, баскетбол, волейбол, хоккей, теннис, шахматы, MMA, киберспорт',
  })
}
