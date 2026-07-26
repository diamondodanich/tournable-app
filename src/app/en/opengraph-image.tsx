import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Tournable — create a tournament online'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return renderOgCard({
    eyebrow: 'Tournaments and leagues online',
    title: 'Create a tournament in a minute',
    subtitle: 'Fixtures, league table, playoff bracket and statistics — in one link',
  })
}
