import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getEventDefs, getPositionLabel, getSubtype, type EventIcon, type Lang } from '@/lib/sports'
import { absUrl, trilingualAlternates, langPrefix, jsonLdGraph, breadcrumbsLd, athleteLd } from '@/lib/seo'
import { sportDisplayName } from '@/lib/sportSeo'
import { playerMeta, NOT_FOUND_TITLE } from '@/lib/entitySeo'
import PublicShell from './PublicShell'

const CRUMB: Record<Lang, string> = { ru: 'Чемпионаты', kz: 'Чемпионаттар', en: 'Championships' }

// Accent per event kind (career cards + per-season table). Authored light; the
// `.dark` overrides in globals.css flip these for the dark theme.
const STAT_TEXT: Record<EventIcon, string> = {
  ball: 'text-emerald-600', assist: 'text-blue-600', yellow: 'text-yellow-600', red: 'text-red-600',
  warn: 'text-amber-600', foul: 'text-amber-600', ko: 'text-red-600', submission: 'text-gray-700',
  ace: 'text-sky-600', block: 'text-indigo-600', three: 'text-orange-600', strike: 'text-red-600',
  touchdown: 'text-emerald-600', run: 'text-emerald-600', star: 'text-amber-600',
}
const STAT_BADGE: Record<EventIcon, string> = {
  ball: 'bg-emerald-50 text-emerald-700', assist: 'bg-blue-50 text-blue-700', yellow: 'bg-yellow-50 text-yellow-700', red: 'bg-red-50 text-red-600',
  warn: 'bg-amber-50 text-amber-700', foul: 'bg-amber-50 text-amber-700', ko: 'bg-red-50 text-red-600', submission: 'bg-gray-100 text-gray-700',
  ace: 'bg-sky-50 text-sky-700', block: 'bg-indigo-50 text-indigo-700', three: 'bg-orange-50 text-orange-700', strike: 'bg-red-50 text-red-600',
  touchdown: 'bg-emerald-50 text-emerald-700', run: 'bg-emerald-50 text-emerald-700', star: 'bg-amber-50 text-amber-700',
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

export async function playerMetadata(slug: string, playerId: string, lang: Lang): Promise<Metadata> {
  const supabase = await createClient()
  const { data: p } = await supabase
    .from('players')
    .select('name, number, position, photo_url, league_teams(name, leagues(name, sport, slug))')
    .eq('id', playerId)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lt = (p as any)?.league_teams
  // A player only belongs under the championship slug in the URL — otherwise the
  // same profile would exist at as many URLs as there are championships.
  if (!p || lt?.leagues?.slug !== slug) {
    return { title: NOT_FOUND_TITLE[lang].player, robots: { index: false, follow: false } }
  }

  const { title, description } = playerMeta(lang, {
    name: p.name,
    number: p.number,
    teamName: lt?.name ?? null,
    leagueName: lt?.leagues?.name ?? null,
    sport: lt?.leagues?.sport ?? null,
  })
  const path = `/leagues/${slug}/players/${playerId}`

  return {
    title,
    description,
    alternates: trilingualAlternates(path, lang),
    // Image comes from this segment's opengraph-image.tsx.
    openGraph: { title, description, type: 'profile', url: absUrl(`${langPrefix(lang)}${path}`), siteName: 'Tournable' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

type EventRow = {
  type: string
  minute: number | null
  team_id: string
  fixtures: { matchday: number | null; tournaments: { name: string } | null } | null
}

type SeasonStat = { tournamentId: string; name: string; mp: number; counts: Record<string, number> }

export default async function PlayerProfilePage({ slug, playerId, lang }: { slug: string; playerId: string; lang: Lang }) {
  const supabase = await createClient()
  const prefix = langPrefix(lang)

  const { data: player } = await supabase
    .from('players')
    .select('*, league_teams(id, name, slug, league_id, leagues(id, name, slug, sport))')
    .eq('id', playerId)
    .maybeSingle()

  if (!player) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leagueTeam = (player as any).league_teams
  const league = leagueTeam?.leagues
  if (!league || league.slug !== slug) notFound()

  const tx = PT[lang]

  // Discipline-driven stat columns.
  const statDefs = getEventDefs(league.sport).filter(d => d.stat)
  const defByType = new Map(statDefs.map(d => [d.type, d]))

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

  // Career totals per event type
  const totalCounts: Record<string, number> = {}
  for (const e of events) totalCounts[e.type] = (totalCounts[e.type] ?? 0) + 1

  // Per-season breakdown
  const bySeason = new Map<string, SeasonStat>()
  function seasonRow(tid: string): SeasonStat {
    let row = bySeason.get(tid)
    if (!row) { row = { tournamentId: tid, name: seasonName.get(tid) ?? '—', mp: 0, counts: {} }; bySeason.set(tid, row) }
    return row
  }
  for (const e of events) {
    const tid = teamToTournament.get(e.team_id)
    if (!tid) continue
    const row = seasonRow(tid)
    row.counts[e.type] = (row.counts[e.type] ?? 0) + 1
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

  const playerPath = `${prefix}/leagues/${slug}/players/${playerId}`
  const jsonLd = jsonLdGraph(
    athleteLd({
      name: player.name,
      path: playerPath,
      photoUrl: player.photo_url ?? null,
      teamName: leagueTeam?.name ?? null,
      teamPath: leagueTeam?.slug ? `${prefix}/leagues/${slug}/teams/${leagueTeam.slug}` : null,
      sport: sportDisplayName(league.sport, lang) ?? (league.sport ? getSubtype(league.sport)?.label[lang] ?? league.sport : null),
      jerseyNumber: player.number,
      position: getPositionLabel(league.sport, player.position, lang) || null,
    }),
    breadcrumbsLd([
      { name: 'Tournable', path: prefix || '/' },
      { name: CRUMB[lang], path: `${prefix}/leagues` },
      { name: league.name, path: `${prefix}/leagues/${slug}` },
      { name: tx.players, path: `${prefix}/leagues/${slug}/players` },
      { name: player.name, path: playerPath },
    ]),
  )

  return (
    <PublicShell lang={lang}>
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Link href={`${prefix}/leagues/${slug}/players`} className="text-xs text-gray-400 hover:text-gray-700 font-medium mb-4 inline-block">
            ← {tx.players} · {league.name}
          </Link>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0 overflow-hidden">
              {player.photo_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={player.photo_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl font-black text-purple-600">
                    {player.number != null ? `#${player.number}` : player.name.slice(0, 2).toUpperCase()}
                  </span>}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-black">{player.name}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Link href={`${prefix}/leagues/${slug}/teams/${leagueTeam.slug}`} className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  {leagueTeam.name}
                </Link>
                {(() => { const posLabel = getPositionLabel(league.sport, player.position, lang); return posLabel ? (
                  <span className="text-xs text-gray-400">· {posLabel}</span>
                ) : null })()}
                {seasonsPlayed > 0 && (
                  <span className="text-xs text-gray-400">· {tx.seasonsWord(seasonsPlayed)}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Career totals */}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{tx.allTime}</p>
        <div className={`grid grid-cols-2 gap-3 mb-8 ${statDefs.length >= 4 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}>
          {[
            { label: tx.matches, value: matchesPlayed, color: 'text-gray-900' },
            ...statDefs.map(d => ({ label: d.label[lang], value: totalCounts[d.type] ?? 0, color: STAT_TEXT[d.icon] ?? 'text-gray-900' })),
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Per-season breakdown */}
        {seasonStats.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{tx.bySeason}</p>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[360px]">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                    <th className="text-left px-4 py-2.5">{tx.season}</th>
                    <th className="text-center px-2 py-2.5 w-12">{tx.mp}</th>
                    {statDefs.map(d => <th key={d.type} className="text-center px-2 py-2.5 w-14">{d.label[lang]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {seasonStats.map((s, i) => (
                    <tr key={s.tournamentId} className={i > 0 ? 'border-t border-gray-50' : ''}>
                      <td className="px-4 py-2.5 font-bold text-gray-900 truncate max-w-[160px]">{s.name}</td>
                      <td className="px-2 py-2.5 text-center text-gray-600 tabular-nums">{s.mp || '—'}</td>
                      {statDefs.map((d, di) => (
                        <td key={d.type} className={`px-2 py-2.5 text-center tabular-nums ${di === 0 ? `font-black ${STAT_TEXT[d.icon] ?? 'text-gray-900'}` : 'text-gray-500'}`}>
                          {s.counts[d.type] || '—'}
                        </td>
                      ))}
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
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{tx.recent}</p>
            <div className="space-y-1">
              {events.slice(0, 20).map((e, i) => {
                const def = e.type === 'own_goal' ? undefined : defByType.get(e.type)
                const badgeCls = e.type === 'own_goal' ? 'bg-red-50 text-red-600' : (def ? STAT_BADGE[def.icon] : 'bg-gray-100 text-gray-600')
                const badgeLabel = e.type === 'own_goal' ? tx.evGoal : (def?.label[lang] ?? e.type)
                return (
                <div key={i} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${badgeCls}`}>
                    {badgeLabel}
                  </span>
                  {e.minute != null && <span className="text-xs text-gray-400 shrink-0">{e.minute}&apos;</span>}
                  <span className="flex-1 text-gray-500 text-xs truncate">
                    {e.fixtures?.tournaments?.name ?? ''}
                    {e.fixtures?.matchday != null ? ` — ${tx.round} ${e.fixtures.matchday}` : ''}
                  </span>
                </div>
                )
              })}
            </div>
          </div>
        )}

        {events.length === 0 && (
          <p className="text-center py-12 text-gray-400 text-sm">{tx.noStats}</p>
        )}
      </div>
    </div>
    </PublicShell>
  )
}
