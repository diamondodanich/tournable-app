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
  searchParams: Promise<{ home?: string; away?: string }>
}) {
  const { id } = await params
  const { home: defaultHomeId, away: defaultAwayId } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', id).single()
  if (!tournament) notFound()

  const [{ data: teams }, { data: liveGame }] = await Promise.all([
    supabase.from('teams').select('*').eq('tournament_id', id).order('created_at'),
    supabase.from('live_games').select('*').eq('tournament_id', id).maybeSingle(),
  ])

  const isOwner = user?.id === tournament.user_id

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-4 h-12 flex items-center justify-between shrink-0">
        <span className="text-sm font-black tracking-tight text-emerald-400">TOURNABLE LIVE</span>
        <span className="text-xs text-gray-500 truncate max-w-[50%]">{tournament.name}</span>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <LiveBoard
            tournament={tournament}
            teams={teams ?? []}
            initialGame={liveGame ?? null}
            isOwner={isOwner}
            defaultHomeId={defaultHomeId}
            defaultAwayId={defaultAwayId}
          />
        </div>
      </main>
    </div>
  )
}
