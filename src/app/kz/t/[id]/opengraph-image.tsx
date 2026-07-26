import { tournamentOgImage } from '@/lib/ogEntities'
import { OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Tournable-дегі турнир'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return tournamentOgImage(id, 'kz')
}
