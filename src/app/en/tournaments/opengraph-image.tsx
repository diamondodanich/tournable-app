import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Tournaments — Tournable'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return renderOgCard({
    eyebrow: 'Catalogue',
    title: 'Online tournaments and competitions',
    subtitle: 'Standings, fixtures and results — open by link',
  })
}
