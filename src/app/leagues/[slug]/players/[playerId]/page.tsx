import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: 'Вратарь', defender: 'Защитник',
  midfielder: 'Полузащитник', forward: 'Нападающий', other: '—',
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; playerId: string }> }): Promise<Metadata> {
  const supabase = await createClient()
  const { playerId } = await params
  const { data: p } = await supabase.from('players').select('name, league_teams(name, leagues(name))').eq('id', playerId).maybeSingle()
  const name = p?.name ?? 'Игрок'
  const team = (p as any)?.league_teams?.name
  const league = (p as any)?.league_teams?.leagues?.name
  const desc = [team, league].filter(Boolean).join(' · ')
  return {
    title: `${name}${league ? ` — ${league}` : ''}`,
    description: desc ? `Статистика игрока ${name}: ${desc}. Голы, передачи и карточки по сезонам.` : undefined,
  }
}

type EventRow = {
  type: string
  minute: number | null
  team_id: string
  fixtures: { matchday: number | null; tournaments: { name: string } | null } | null
}

type SeasonStat = { tournamentId: string; name: string; goals: number; assists: number; yellow: number; red: number }

export default async function PlayerProfilePage({ params }: { params: Promise<{ slug: string; playerId: string }> }) {
  const supabase = await createClient()
  const { slug, playerId } = await params

  const { data: player } = await supabase
    .from('players')
    .select('*, league_teams(id, name, slug, league_id, leagues(id, name, slug))')
    .eq('id', playerId)
    .maybeSingle()

  if (!player) notFound()

  const leagueTeam = (player as any).league_teams
  const league = leagueTeam?.leagues
  if (!league || league.slug !== slug) notFound()

  // Seasons of this championship (id → name)
  const { data: seasons } = await supabase
    .from('seasons')
    .select('name, tournament_id')
    .eq('league_id', league.id)
    .order('created_at', { ascending: false })
  const seasonName = new Map(
    (seasons ?? []).filter(s => s.tournament_id).map(s => [s.tournament_id as string, s.name as string])
  )

  // Season teams linked to this persistent championship team (teams.league_team_id)
  const { data: seasonTeams } = await supabase
    .from('teams')
    .select('id, tournament_id')
    .eq('league_team_id', leagueTeam.id)
  const teamToTournament = new Map((seasonTeams ?? []).map(t => [t.id, t.tournament_id as string]))
  const seasonTeamIds = (seasonTeams ?? []).map(t => t.id)

  // All events for this player across every season the persistent team played in
  let events: EventRow[] = []
  if (seasonTeamIds.length > 0) {
    const { data } = await supabase
      .from('match_events')
      .select('type, minute, team_id, fixtures(matchday, tournaments(name))')
      .eq('player_name', player.name)
      .in('team_id', seasonTeamIds)
      .order('created_at', { ascending: false })
    events = (data ?? []) as unknown as EventRow[]
  }

  const goals = events.filter(e => e.type === 'goal').length
  const assists = events.filter(e => e.type === 'assist').length
  const yellowCards = events.filter(e => e.type === 'yellow_card').length
  const redCards = events.filter(e => e.type === 'red_card').length

  // Per-season breakdown
  const bySeason = new Map<string, SeasonStat>()
  for (const e of events) {
    const tid = teamToTournament.get(e.team_id)
    if (!tid) continue
    let row = bySeason.get(tid)
    if (!row) { row = { tournamentId: tid, name: seasonName.get(tid) ?? '—', goals: 0, assists: 0, yellow: 0, red: 0 }; bySeason.set(tid, row) }
    if (e.type === 'goal') row.goals++
    else if (e.type === 'assist') row.assists++
    else if (e.type === 'yellow_card') row.yellow++
    else if (e.type === 'red_card') row.red++
  }
  const seasonStats = [...bySeason.values()]
  const seasonsPlayed = seasonStats.length

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white">
      <div className="border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Link href={`/leagues/${slug}/players`} className="text-xs text-white/30 hover:text-white/60 font-medium mb-4 inline-block">
            ← Игроки {league.name}
          </Link>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-purple-900/60 border border-purple-500/30 flex items-center justify-center shrink-0">
              <span className="text-2xl font-black text-purple-300">
                {player.number != null ? `#${player.number}` : player.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-black">{player.name}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Link href={`/leagues/${slug}/teams/${leagueTeam.slug}`} className="text-sm text-purple-400 hover:text-purple-300 font-medium">
                  {leagueTeam.name}
                </Link>
                {player.position && player.position !== 'other' && (
                  <span className="text-xs text-white/30">· {POSITION_LABELS[player.position]}</span>
                )}
                {seasonsPlayed > 0 && (
                  <span className="text-xs text-white/30">· {seasonsPlayed} {seasonsPlayed === 1 ? 'сезон' : seasonsPlayed < 5 ? 'сезона' : 'сезонов'}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Career totals */}
        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">За всю историю</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Голы', value: goals, color: 'text-emerald-400' },
            { label: 'Передачи', value: assists, color: 'text-blue-400' },
            { label: 'Жёлтые', value: yellowCards, color: 'text-yellow-400' },
            { label: 'Красные', value: redCards, color: 'text-red-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-white/40 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Per-season breakdown */}
        {seasonStats.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">По сезонам</p>
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[360px]">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-white/30 border-b border-white/10">
                    <th className="text-left px-4 py-2.5">Сезон</th>
                    <th className="text-center px-2 py-2.5 w-14">Голы</th>
                    <th className="text-center px-2 py-2.5 w-14">Пас</th>
                    <th className="text-center px-2 py-2.5 w-12">ЖК</th>
                    <th className="text-center px-2 py-2.5 w-12">КК</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonStats.map((s, i) => (
                    <tr key={s.tournamentId} className={i > 0 ? 'border-t border-white/5' : ''}>
                      <td className="px-4 py-2.5 font-bold text-white/90 truncate max-w-[160px]">{s.name}</td>
                      <td className="px-2 py-2.5 text-center font-black text-emerald-400 tabular-nums">{s.goals}</td>
                      <td className="px-2 py-2.5 text-center text-blue-400 tabular-nums">{s.assists}</td>
                      <td className="px-2 py-2.5 text-center text-white/50 tabular-nums">{s.yellow || '—'}</td>
                      <td className="px-2 py-2.5 text-center text-white/50 tabular-nums">{s.red || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent events */}
        {events.length > 0 && (
          <div>
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Последние события</p>
            <div className="space-y-1">
              {events.slice(0, 20).map((e, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5 text-sm">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${
                    e.type === 'goal' ? 'bg-emerald-900/60 text-emerald-400'
                    : e.type === 'assist' ? 'bg-blue-900/60 text-blue-400'
                    : e.type === 'yellow_card' ? 'bg-yellow-900/60 text-yellow-400'
                    : 'bg-red-900/60 text-red-400'
                  }`}>
                    {e.type === 'goal' ? 'Гол' : e.type === 'assist' ? 'Пас' : e.type === 'yellow_card' ? 'ЖК' : 'КК'}
                  </span>
                  {e.minute != null && <span className="text-xs text-white/30 shrink-0">{e.minute}&apos;</span>}
                  <span className="flex-1 text-white/50 text-xs truncate">
                    {e.fixtures?.tournaments?.name ?? ''}
                    {e.fixtures?.matchday != null ? ` — тур ${e.fixtures.matchday}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {events.length === 0 && (
          <p className="text-center py-12 text-white/30 text-sm">У игрока пока нет статистики по матчам.</p>
        )}
      </div>
    </div>
  )
}
