import { leaguePlayersOgImage } from '@/lib/ogEntities'
import { OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Championship players — Tournable'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return leaguePlayersOgImage(slug, 'en')
}
