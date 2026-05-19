import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import LiveBoard from '@/components/live/LiveBoard'
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
  searchParams: Promise<{ home?: string; away?: string; fixture?: string }>
}) {
  const { id } = await params
  const { home: defaultHomeId, away: defaultAwayId, fixture: fixtureId } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', id).single()
  if (!tournament) notFound()

  const [{ data: teams }, { data: liveGame }] = await Promise.all([
    supabase.from('teams').select('*').eq('tournament_id', id).order('created_at'),
    supabase.from('live_games').select('*').eq('tournament_id', id).maybeSingle(),
  ])

  // Fetch initial events if there's an active fixture
  const activeFixtureId = liveGame?.fixture_id ?? fixtureId
  const { data: initialEvents } = activeFixtureId
    ? await supabase
        .from('match_events')
        .select('*')
        .eq('fixture_id', activeFixtureId)
        .order('minute', { ascending: true })
    : { data: [] }

  const isOwner = user?.id === tournament.user_id

  // Check editor access
  let isEditor = false
  if (user && !isOwner) {
    const { data: member } = await supabase
      .from('tournament_members')
      .select('role')
      .eq('tournament_id', id)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .eq('role', 'editor')
      .maybeSingle()
    isEditor = !!member
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-4 h-12 flex items-center justify-between shrink-0">
        <span className="text-sm font-black tracking-tight text-emerald-400">TOURNABLE LIVE</span>
        <span className="text-xs text-gray-500 truncate max-w-[60%] text-right">{tournament.name}</span>
      </header>
      <main className="flex-1 flex flex-col">
        <LiveBoard
          tournament={tournament}
          teams={teams ?? []}
          initialGame={liveGame ?? null}
          initialEvents={initialEvents ?? []}
          isOwner={isOwner || isEditor}
          defaultHomeId={defaultHomeId}
          defaultAwayId={defaultAwayId}
          defaultFixtureId={fixtureId}
        />
      </main>
    </div>
  )
}
