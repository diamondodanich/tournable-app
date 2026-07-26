import { matchOgImage } from '@/lib/ogEntities'
import { OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Tournable-дегі матч'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({ params }: { params: Promise<{ slug: string; matchId: string }> }) {
  const { slug, matchId } = await params
  return matchOgImage(slug, matchId, 'kz')
}
