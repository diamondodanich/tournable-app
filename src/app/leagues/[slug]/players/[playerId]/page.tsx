import type { Metadata } from 'next'
import PlayerPage, { playerMetadata } from '@/components/public/PlayerPage'

const LANG = 'ru' as const

// Public, cookie-free data (see lib/supabase/public): render on first visit,
// then serve from cache and refresh at most every 5 minutes.
export const revalidate = 300
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; playerId: string }> }): Promise<Metadata> {
  const { slug, playerId } = await params
  return playerMetadata(slug, playerId, LANG)
}

export default async function Page({ params }: { params: Promise<{ slug: string; playerId: string }> }) {
  const { slug, playerId } = await params
  return <PlayerPage slug={slug} playerId={playerId} lang={LANG} />
}
