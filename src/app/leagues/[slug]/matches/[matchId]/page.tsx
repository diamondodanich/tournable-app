import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string; matchId: string }> }): Promise<Metadata> {
  const supabase = await createClient()
  const { matchId } = await params
  const { data: f } = await supabase
    .from('fixtures')
    .select('home_score, away_score, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)')
    .eq('id', matchId)
    .maybeSingle()

  if (!f) return { title: 'Матч не найден' }
  const home = (f as any).home_team?.name ?? '?'
  const away = (f as any).away_team?.name ?? '?'
  const score = f.home_score != null ? ` ${f.home_score}:${f.away_score}` : ''
  return { title: `${home}${score} — ${away}` }
}

export default async function MatchDetailPage({ params }: { params: Promise<{ slug: string; matchId: string }> }) {
  const supabase = await createClient()
  const { slug, matchId } = await params

  const { data: fixture } = await supabase
    .from('fixtures')
    .select(`
      *,
      home_team:teams!home_team_id(id, name),
      away_team:teams!away_team_id(id, name),
      match_events(id, type, minute, player_name, team_id)
    `)
    .eq('id', matchId)
    .maybeSingle()

  if (!fixture) notFound()

  const home = (fixture as any).home_team
  const away = (fixture as any).away_team
  const events = ((fixture as any).match_events ?? []) as { id: string; type: string; minute: number | null; player_name: string; team_id: string }[]
  const sortedEvents = events.slice().sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))

  const EVENT_LABELS: Record<string, string> = {
    goal: 'Гол', own_goal: 'Автогол', assist: 'Пас', yellow_card: 'ЖК', red_card: 'КК',
  }
  const EVENT_COLORS: Record<string, string> = {
    goal: 'text-emerald-400', own_goal: 'text-red-400', assist: 'text-blue-400',
    yellow_card: 'text-yellow-400', red_card: 'text-red-500',
  }

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white">
      <div className="border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <Link href={`/leagues/${slug}`} className="text-xs text-white/30 hover:text-white/60 font-medium mb-4 inline-block">
            ← Лига
          </Link>

          <div className="flex items-center justify-around py-6">
            <div className="text-center flex-1">
              <div className="w-14 h-14 rounded-xl bg-purple-900/50 flex items-center justify-center text-xl font-black text-purple-300 mx-auto mb-2">
                {home?.name?.slice(0, 2).toUpperCase() ?? '?'}
              </div>
              <p className="font-black text-lg">{home?.name ?? '?'}</p>
            </div>
            <div className="text-center px-6">
              {fixture.played ? (
                <p className="text-4xl font-black">{fixture.home_score} : {fixture.away_score}</p>
              ) : (
                <p className="text-2xl font-black text-white/30">vs</p>
              )}
              <p className="text-xs text-white/30 mt-1">тур {(fixture as any).matchday}</p>
            </div>
            <div className="text-center flex-1">
              <div className="w-14 h-14 rounded-xl bg-purple-900/50 flex items-center justify-center text-xl font-black text-purple-300 mx-auto mb-2">
                {away?.name?.slice(0, 2).toUpperCase() ?? '?'}
              </div>
              <p className="font-black text-lg">{away?.name ?? '?'}</p>
            </div>
          </div>
        </div>
      </div>

      {sortedEvents.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">События матча</p>
          <div className="space-y-1">
            {sortedEvents.map(e => {
              const isHome = e.team_id === home?.id
              return (
                <div key={e.id} className={`flex items-center gap-3 px-4 py-2.5 bg-white/5 rounded-xl ${isHome ? '' : 'flex-row-reverse'}`}>
                  {e.minute != null && (
                    <span className="text-xs font-black text-white/30 shrink-0 w-8 text-center">{e.minute}'</span>
                  )}
                  <span className={`text-xs font-bold shrink-0 ${EVENT_COLORS[e.type] ?? 'text-white/50'}`}>
                    {EVENT_LABELS[e.type] ?? e.type}
                  </span>
                  <span className={`flex-1 text-sm font-bold text-white/90 ${isHome ? '' : 'text-right'}`}>
                    {e.player_name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
