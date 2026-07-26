import { sportOgImage } from '@/lib/ogSport'
import { OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Create a tournament online — Tournable'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({ params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params
  return sportOgImage(sport, 'en')
}
