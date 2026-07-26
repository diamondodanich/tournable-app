import { playerOgImage } from '@/lib/ogEntities'
import { OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Tournable-дегі ойыншы'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({ params }: { params: Promise<{ slug: string; playerId: string }> }) {
  const { slug, playerId } = await params
  return playerOgImage(slug, playerId, 'kz')
}
