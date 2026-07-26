import type { Metadata } from 'next'
import LeaguePlayersPage, { leaguePlayersMetadata } from '@/components/public/LeaguePlayersPage'

const LANG = 'en' as const

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return leaguePlayersMetadata(slug, LANG)
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <LeaguePlayersPage slug={slug} lang={LANG} />
}
