import type { Metadata } from 'next'
import MatchPage, { matchMetadata } from '@/components/public/MatchPage'

const LANG = 'kz' as const

// Public, cookie-free data (see lib/supabase/public): render on first visit,
// then serve from cache and refresh at most every 5 minutes.
export const revalidate = 300
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; matchId: string }> }): Promise<Metadata> {
  const { slug, matchId } = await params
  return matchMetadata(slug, matchId, LANG)
}

export default async function Page({ params }: { params: Promise<{ slug: string; matchId: string }> }) {
  const { slug, matchId } = await params
  return <MatchPage slug={slug} matchId={matchId} lang={LANG} />
}
