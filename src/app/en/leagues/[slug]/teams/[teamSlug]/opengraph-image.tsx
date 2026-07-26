import { teamOgImage } from '@/lib/ogEntities'
import { OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Team on Tournable'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({ params }: { params: Promise<{ slug: string; teamSlug: string }> }) {
  const { slug, teamSlug } = await params
  return teamOgImage(slug, teamSlug, 'en')
}
