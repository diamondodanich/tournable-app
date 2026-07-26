import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Tournable — создать турнир онлайн'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

// Brand card. Serves as the fallback for every page that has no card of its own.
export default async function Image() {
  return renderOgCard({
    eyebrow: 'Турниры и чемпионаты онлайн',
    title: 'Создайте турнир за минуту',
    subtitle: 'Расписание, турнирная таблица, плей-офф и статистика — по одной ссылке',
  })
}
