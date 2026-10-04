import { sportOgImage } from '@/lib/ogSport'
import { OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Create a tournament online — Tournable'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

// Rendering an OG card (Satori) is CPU-heavy and its data is public, so render
// on first request and reuse it for a day instead of on every crawler hit.
export const revalidate = 86400
export function generateStaticParams() {
  return []
}

export default async function Image({ params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params
  return sportOgImage(sport, 'en')
}
