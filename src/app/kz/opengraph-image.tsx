import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Tournable — онлайн турнир құру'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return renderOgCard({
    eyebrow: 'Онлайн турнирлер мен чемпионаттар',
    title: 'Турнирді бір минутта құрыңыз',
    subtitle: 'Кесте, турнир кестесі, плей-офф және статистика — бір сілтемеде',
  })
}
