import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Тарифы Tournable'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return renderOgCard({
    eyebrow: 'Тарифы',
    title: 'Бесплатно для первого турнира',
    subtitle: 'Pro — 4 990 KZT в месяц: безлимит турниров и команд, со-редакторы, отчёты',
  })
}
