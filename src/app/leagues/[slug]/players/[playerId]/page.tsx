import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

type Lang = 'ru' | 'kz' | 'en'
async function getLang(): Promise<Lang> {
  const v = (await cookies()).get('lang')?.value
  return v === 'kz' || v === 'en' ? v : 'ru'
}
const PT = {
  ru: {
    players: 'Игроки', seasonsWord: (n: number) => `${n} ${n === 1 ? 'сезон' : n < 5 ? 'сезона' : 'сезонов'}`,
    allTime: 'За всю историю', matches: 'Матчи', goals: 'Голы', assists: 'Передачи', yellow: 'Жёлтые', red: 'Красные',
    bySeason: 'По сезонам', season: 'Сезон', mp: 'И', pas: 'Пас', yc: 'ЖК', rc: 'КК',
    recent: 'Последние события', evGoal: 'Гол', evAssist: 'Пас', round: 'тур', noStats: 'У игрока пока нет статистики по матчам.',
    pos: { goalkeeper: 'Вратарь', defender: 'Защитник', midfielder: 'Полузащитник', forward: 'Нападающий', other: '—' } as Record<string, string>,
  },
  kz: {
    players: 'Ойыншылар', seasonsWord: (n: number) => `${n} маусым`,
    allTime: 'Барлық тарих', matches: 'Матчтар', goals: 'Голдар', assists: 'Ассисттер', yellow: 'Сары', red: 'Қызыл',
    bySeason: 'Маусымдар бойынша', season: 'Маусым', mp: 'О', pas: 'Ассист', yc: 'СК', rc: 'ҚК',
    recent: 'Соңғы оқиғалар', evGoal: 'Гол', evAssist: 'Ассист', round: 'тур', noStats: 'Ойыншыда әзірге матч статистикасы жоқ.',
    pos: { goalkeeper: 'Қақпашы', defender: 'Қорғаушы', midfielder: 'Жартылай қорғаушы', forward: 'Шабуылшы', other: '—' } as Record<string, string>,
  },
  en: {
    players: 'Players', seasonsWord: (n: number) => `${n} season${n === 1 ? '' : 's'}`,
    allTime: 'All time', matches: 'Matches', goals: 'Goals', assists: 'Assists', yellow: 'Yellow', red: 'Red',
    bySeason: 'By season', season: 'Season', mp: 'MP', pas: 'Ast', yc: 'YC', rc: 'RC',
    recent: 'Recent events', evGoal: 'Goal', evAssist: 'Assist', round: 'round', noStats: 'No match statistics for this player yet.',
    pos: { goalkeeper: 'Goalkeeper', defender: 'Defender', midfielder: 'Midfielder', forward: 'Forward', other: '—' } as Record<string, string>,
  },
} as const

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

type SeasonStat = { tournamentId: string; name: string; mp: number; goals: number; assists: number; yellow: number; red: number }

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

  const tx = PT[await getLang()]

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
  function seasonRow(tid: string): SeasonStat {
    let row = bySeason.get(tid)
    if (!row) { row = { tournamentId: tid, name: seasonName.get(tid) ?? '—', mp: 0, goals: 0, assists: 0, yellow: 0, red: 0 }; bySeason.set(tid, row) }
    return row
  }
  for (const e of events) {
    const tid = teamToTournament.get(e.team_id)
    if (!tid) continue
    const row = seasonRow(tid)
    if (e.type === 'goal') row.goals++
    else if (e.type === 'assist') row.assists++
    else if (e.type === 'yellow_card') row.yellow++
    else if (e.type === 'red_card') row.red++
  }

  // Matches played — from the starting lineups of played fixtures (accurate: also
  // counts games where the player scored nothing). match_lineups.player_id points
  // at the per-season roster (team_players), matched to this player by name.
  let matchesPlayed = 0
  if (seasonTeamIds.length > 0) {
    const { data: tpRows } = await supabase
      .from('team_players').select('id, team_id').in('team_id', seasonTeamIds).eq('name', player.name)
    const tpIds = (tpRows ?? []).map(r => r.id)
    if (tpIds.length > 0) {
      const { data: lns } = await supabase
        .from('match_lineups').select('fixture_id, team_id, role').in('player_id', tpIds).eq('role', 'starter')
      const lnFixtureIds = [...new Set((lns ?? []).map(l => l.fixture_id))]
      const playedSet = new Set<string>()
      if (lnFixtureIds.length > 0) {
        const { data: fx } = await supabase.from('fixtures').select('id, played').in('id', lnFixtureIds)
        for (const f of fx ?? []) if (f.played) playedSet.add(f.id)
      }
      const perSeason = new Map<string, Set<string>>()
      for (const l of lns ?? []) {
        if (!playedSet.has(l.fixture_id)) continue
        const tid = teamToTournament.get(l.team_id)
        if (!tid) continue
        if (!perSeason.has(tid)) perSeason.set(tid, new Set())
        perSeason.get(tid)!.add(l.fixture_id)
      }
      const total = new Set<string>()
      for (const [tid, set] of perSeason) {
        seasonRow(tid).mp = set.size
        set.forEach(f => total.add(f))
      }
      matchesPlayed = total.size
    }
  }

  const seasonStats = [...bySeason.values()]
  const seasonsPlayed = seasonStats.length

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white">
      <div className="border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Link href={`/leagues/${slug}/players`} className="text-xs text-white/30 hover:text-white/60 font-medium mb-4 inline-block">
            ← {tx.players} · {league.name}
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
                  <span className="text-xs text-white/30">· {tx.pos[player.position]}</span>
                )}
                {seasonsPlayed > 0 && (
                  <span className="text-xs text-white/30">· {tx.seasonsWord(seasonsPlayed)}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Career totals */}
        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">{tx.allTime}</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { label: tx.matches, value: matchesPlayed, color: 'text-white' },
            { label: tx.goals, value: goals, color: 'text-emerald-400' },
            { label: tx.assists, value: assists, color: 'text-blue-400' },
            { label: tx.yellow, value: yellowCards, color: 'text-yellow-400' },
            { label: tx.red, value: redCards, color: 'text-red-400' },
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
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">{tx.bySeason}</p>
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[360px]">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-white/30 border-b border-white/10">
                    <th className="text-left px-4 py-2.5">{tx.season}</th>
                    <th className="text-center px-2 py-2.5 w-12">{tx.mp}</th>
                    <th className="text-center px-2 py-2.5 w-14">{tx.goals}</th>
                    <th className="text-center px-2 py-2.5 w-14">{tx.pas}</th>
                    <th className="text-center px-2 py-2.5 w-12">{tx.yc}</th>
                    <th className="text-center px-2 py-2.5 w-12">{tx.rc}</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonStats.map((s, i) => (
                    <tr key={s.tournamentId} className={i > 0 ? 'border-t border-white/5' : ''}>
                      <td className="px-4 py-2.5 font-bold text-white/90 truncate max-w-[160px]">{s.name}</td>
                      <td className="px-2 py-2.5 text-center text-white/70 tabular-nums">{s.mp || '—'}</td>
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
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">{tx.recent}</p>
            <div className="space-y-1">
              {events.slice(0, 20).map((e, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5 text-sm">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${
                    e.type === 'goal' ? 'bg-emerald-900/60 text-emerald-400'
                    : e.type === 'assist' ? 'bg-blue-900/60 text-blue-400'
                    : e.type === 'yellow_card' ? 'bg-yellow-900/60 text-yellow-400'
                    : 'bg-red-900/60 text-red-400'
                  }`}>
                    {e.type === 'goal' ? tx.evGoal : e.type === 'assist' ? tx.evAssist : e.type === 'yellow_card' ? tx.yc : tx.rc}
                  </span>
                  {e.minute != null && <span className="text-xs text-white/30 shrink-0">{e.minute}&apos;</span>}
                  <span className="flex-1 text-white/50 text-xs truncate">
                    {e.fixtures?.tournaments?.name ?? ''}
                    {e.fixtures?.matchday != null ? ` — ${tx.round} ${e.fixtures.matchday}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {events.length === 0 && (
          <p className="text-center py-12 text-white/30 text-sm">{tx.noStats}</p>
        )}
      </div>
    </div>
  )
}
