import type { Metadata } from 'next'
import TournamentPage, { tournamentMetadata } from '@/components/public/TournamentPage'

const LANG = 'kz' as const

// Public, cookie-free data: render on first visit, then serve from cache.
// Edits from the dashboard purge it at once (lib/revalidate); 60s is the fallback.
export const revalidate = 60
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return tournamentMetadata(id, LANG)
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TournamentPage idOrSlug={id} lang={LANG} />
}
