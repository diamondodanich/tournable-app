import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Турнирлер — Tournable'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return renderOgCard({
    eyebrow: 'Каталог',
    title: 'Онлайн турнирлер мен жарыстар',
    subtitle: 'Кестелер, матчтар және нәтижелер — сілтеме арқылы ашық',
  })
}
