import type { Metadata } from 'next'
import MatchPage, { matchMetadata } from '@/components/public/MatchPage'

const LANG = 'en' as const

export async function generateMetadata({ params }: { params: Promise<{ slug: string; matchId: string }> }): Promise<Metadata> {
  const { slug, matchId } = await params
  return matchMetadata(slug, matchId, LANG)
}

export default async function Page({ params }: { params: Promise<{ slug: string; matchId: string }> }) {
  const { slug, matchId } = await params
  return <MatchPage slug={slug} matchId={matchId} lang={LANG} />
}
