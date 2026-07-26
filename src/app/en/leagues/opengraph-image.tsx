import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Championships — Tournable'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return renderOgCard({
    eyebrow: 'Catalogue',
    title: 'Championships and leagues',
    subtitle: 'Season tables, team and player pages, all-time statistics',
  })
}
