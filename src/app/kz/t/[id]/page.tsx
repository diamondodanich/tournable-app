import type { Metadata } from 'next'
import TournamentPage, { tournamentMetadata } from '@/components/public/TournamentPage'

const LANG = 'kz' as const

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return tournamentMetadata(id, LANG)
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TournamentPage idOrSlug={id} lang={LANG} />
}
