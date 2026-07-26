import type { Metadata } from 'next'
import PlayerPage, { playerMetadata } from '@/components/public/PlayerPage'

const LANG = 'en' as const

export async function generateMetadata({ params }: { params: Promise<{ slug: string; playerId: string }> }): Promise<Metadata> {
  const { slug, playerId } = await params
  return playerMetadata(slug, playerId, LANG)
}

export default async function Page({ params }: { params: Promise<{ slug: string; playerId: string }> }) {
  const { slug, playerId } = await params
  return <PlayerPage slug={slug} playerId={playerId} lang={LANG} />
}
