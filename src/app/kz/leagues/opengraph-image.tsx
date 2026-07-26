import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Чемпионаттар — Tournable'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return renderOgCard({
    eyebrow: 'Каталог',
    title: 'Чемпионаттар мен лигалар',
    subtitle: 'Маусым кестелері, командалар мен ойыншылар беттері, толық статистика',
  })
}
