import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import LiveBoard from '@/components/live/LiveBoard'
import { LiveGame } from '@/types'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('tournaments').select('name').eq('id', id).single()
  return { title: data ? `Live — ${data.name}` : 'Live' }
}

export default async function LivePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ home?: string; away?: string }>
}) {
  const { id } = await params
  const { home: defaultHomeId, away: defaultAwayId } = await searchParams
  const supabase = await createClient()

  const [{ data: tournament }, { data: teams }, { data: liveGame }, { data: { user } }] = await Promise.all([
    supabase.from('tournaments').select('*').eq('id', id).single(),
    supabase.from('teams').select('*').eq('tournament_id', id).order('created_at'),
    supabase.from('live_games').select('*').eq('tournament_id', id).maybeSingle(),
    supabase.auth.getUser(),
  ])

  if (!tournament) notFound()

  const isOwner = user?.id === tournament.user_id

  return (
    <LiveBoard
      tournament={tournament}
      teams={teams ?? []}
      initialGame={liveGame as LiveGame | null}
      isOwner={isOwner}
      defaultHomeId={defaultHomeId}
      defaultAwayId={defaultAwayId}
    />
  )
}
