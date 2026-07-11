import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getOwnerPlan } from '@/app/actions/billing'
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SetupTab from '@/components/tournament/SetupTab'
import TournamentHeader from '@/components/tournament/TournamentHeader'
import ChampionshipSeasonBar from '@/components/championship/ChampionshipSeasonBar'
import StandingsTable from '@/components/tournament/StandingsTable'
import ResultsMatrix from '@/components/tournament/ResultsMatrix'
import { CalendarDays, BarChart2, Users, Trophy, Layers, ListOrdered } from 'lucide-react'
import type { Team, Fixture, MatchEvent, TournamentMember } from '@/types'
import ChampionBanner from '@/components/tournament/ChampionBanner'
import { getSportTheme, getCategoryForSport } from '@/lib/sports'
import { getLeaderboardEntries } from '@/app/actions/leaderboard'
import { tx, getLang } from '@/lib/i18n'

// ── Exported-report i18n — the PDF report must render in the selected language ──
const REPORT_DATE_LOCALE: Record<'ru' | 'kz' | 'en', string> = { ru: 'ru-RU', kz: 'kk-KZ', en: 'en-US' }
const REPORT_STRINGS: Record<'ru' | 'kz' | 'en', {
  fullReport: string; teams: (n: number) => string
  standings: string; matrix: string; scorers: string; assists: string; yellow: string; red: string
  groupStage: string; leagueStage: string; bracket: string; bracketOnly: string
  goalsLbl: string; assistsLbl: string; ycLbl: string; rcLbl: string; noData: string
}> = {
  ru: { fullReport: 'Полный отчёт', teams: n => `${n} команд`, standings: 'Турнирная таблица', matrix: 'Матрица матчей', scorers: 'Бомбардиры', assists: 'Ассистенты', yellow: 'Жёлтые карточки', red: 'Красные карточки', groupStage: 'Групповой этап — таблицы', leagueStage: 'Этап лиги — таблица', bracket: 'Плей-офф — результаты сетки', bracketOnly: 'Результаты сетки', goalsLbl: 'Голы', assistsLbl: 'Ассисты', ycLbl: 'ЖК', rcLbl: 'КК', noData: 'Нет данных' },
  kz: { fullReport: 'Толық есеп', teams: n => `${n} команда`, standings: 'Турнир кестесі', matrix: 'Матчтар матрицасы', scorers: 'Бомбардирлер', assists: 'Ассистенттер', yellow: 'Сары карточкалар', red: 'Қызыл карточкалар', groupStage: 'Топтық кезең — кестелер', leagueStage: 'Лига кезеңі — кесте', bracket: 'Плей-офф — сетка нәтижелері', bracketOnly: 'Сетка нәтижелері', goalsLbl: 'Голдар', assistsLbl: 'Ассисттер', ycLbl: 'СК', rcLbl: 'ҚК', noData: 'Деректер жоқ' },
  en: { fullReport: 'Full report', teams: n => `${n} teams`, standings: 'Standings', matrix: 'Match matrix', scorers: 'Top scorers', assists: 'Assists', yellow: 'Yellow cards', red: 'Red cards', groupStage: 'Group stage — tables', leagueStage: 'League stage — table', bracket: 'Playoff — bracket results', bracketOnly: 'Bracket results', goalsLbl: 'Goals', assistsLbl: 'Assists', ycLbl: 'YC', rcLbl: 'RC', noData: 'No data' },
}

// ── Tab skeleton — shown while lazy JS chunk is loading ───────────────────
function TabSkeleton() {
  return (
    <div className="space-y-3 animate-pulse pt-1">
      <div className="h-20 bg-gray-100 rounded-xl" />
      <div className="h-20 bg-gray-100 rounded-xl" />
      <div className="h-20 bg-gray-100 rounded-xl" />
    </div>
  )
}

// ── Lazy-loaded heavy client components ───────────────────────────────────
const FixturesTab        = dynamic(() => import('@/components/tournament/FixturesTab'),        { loading: () => <TabSkeleton /> })
const StandingsTab       = dynamic(() => import('@/components/tournament/StandingsTab'),       { loading: () => <TabSkeleton /> })
const GroupStandingsTab  = dynamic(() => import('@/components/tournament/GroupStandingsTab'),  { loading: () => <TabSkeleton /> })
const PlayoffTab         = dynamic(() => import('@/components/tournament/PlayoffTab'),         { loading: () => <TabSkeleton /> })
const StatsTab           = dynamic(() => import('@/components/tournament/StatsTab'),           { loading: () => <TabSkeleton /> })
const CalendarTab        = dynamic(() => import('@/components/tournament/CalendarTab'),        { loading: () => <TabSkeleton /> })
const ExportReportButton = dynamic(() => import('@/components/tournament/ExportReportButton'), {
  loading: () => <div className="h-8 w-44 bg-gray-100 rounded-lg animate-pulse" />,
})
const LeaderboardTab = dynamic(() => import('@/components/tournament/LeaderboardTab'), { loading: () => <TabSkeleton /> })

// ── Inline stats helper for server-rendered PDF export ────────────────────
function buildStats(teams: Team[], events: MatchEvent[], type: string) {
  const map = new Map<string, { player: string; teamName: string; count: number }>()
  events.filter(e => e.type === type).forEach(e => {
    const name = e.player_name.trim()
    if (!name) return
    const key = `${e.team_id}|${name.toLowerCase()}`
    const team = teams.find(t => t.id === e.team_id)
    if (!map.has(key)) map.set(key, { player: name, teamName: team?.name ?? '—', count: 0 })
    map.get(key)!.count++
  })
  return [...map.values()].sort((a, b) => b.count - a.count)
}

function ExportStatsTable({ teams, events, type, label, accent }: {
  teams: Team[]; events: MatchEvent[]
  type: string; label: string; accent: string
}) {
  const rows = buildStats(teams, events, type)
  if (rows.length === 0) return (
    <p style={{ color: '#9ca3af', fontSize: '12px', padding: '8px' }}>Нет данных</p>
  )
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
      <thead>
        <tr style={{ background: '#f9fafb' }}>
          <th style={{ padding: '6px 8px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>#</th>
          <th style={{ padding: '6px 8px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Игрок</th>
          <th style={{ padding: '6px 8px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Команда</th>
          <th style={{ padding: '6px 8px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>{label}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
            <td style={{ padding: '6px 8px', color: '#9ca3af', fontWeight: 700 }}>{i + 1}</td>
            <td style={{ padding: '6px 8px', fontWeight: 700, color: '#111827' }}>{r.player}</td>
            <td style={{ padding: '6px 8px', color: '#6b7280' }}>{r.teamName}</td>
            <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800, color: accent }}>{r.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Playoff bracket summary for PDF
function ExportBracket({ teams, matches }: {
  teams: Team[]
  matches: { round_order: number; home_team_id: string | null; away_team_id: string | null; home_score: number | null; away_score: number | null; winner_id: string | null }[]
}) {
  const ROUND_LABELS: Record<number, string> = { 1: 'Финал', 2: 'Полуфинал', 4: 'Четвертьфинал', 8: '1/8 финала', 16: '1/16 финала' }
  const rounds = [...new Set(matches.map(m => m.round_order))].sort((a, b) => b - a)
  return (
    <div>
      {rounds.map(ro => {
        const ms = matches.filter(m => m.round_order === ro)
        return (
          <div key={ro} style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              {ROUND_LABELS[ro] ?? `Раунд ${ro}`}
            </p>
            {ms.map((m, i) => {
              const home = teams.find(t => t.id === m.home_team_id)?.name ?? 'TBD'
              const away = teams.find(t => t.id === m.away_team_id)?.name ?? 'TBD'
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '12px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ flex: 1, fontWeight: m.winner_id === m.home_team_id ? 700 : 400, color: '#111827' }}>{home}</span>
                  <span style={{ fontWeight: 800, color: '#111827', fontFamily: 'monospace', minWidth: '40px', textAlign: 'center' }}>
                    {m.home_score != null ? `${m.home_score} – ${m.away_score}` : '– – –'}
                  </span>
                  <span style={{ flex: 1, fontWeight: m.winner_id === m.away_team_id ? 700 : 400, color: '#111827', textAlign: 'right' }}>{away}</span>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// Group standings for groups_playoff PDF export
function ExportGroupStandings({ teams, fixtures, pointsWin = 3, pointsDraw = 1, pointsLoss = 0 }: {
  teams: Team[]; fixtures: Fixture[]; pointsWin?: number; pointsDraw?: number; pointsLoss?: number
}) {
  const groupNames = [...new Set(teams.map(t => t.group_name).filter(Boolean))].sort() as string[]
  if (groupNames.length === 0) return null

  return (
    <div>
      {groupNames.map(gName => {
        const groupTeams = teams.filter(t => t.group_name === gName)
        const groupIds = new Set(groupTeams.map(t => t.id))
        // Only group-stage fixtures (both teams in the same group)
        const groupFixtures = fixtures.filter(f =>
          !f.is_bye &&
          f.home_team_id && f.away_team_id &&
          groupIds.has(f.home_team_id) && groupIds.has(f.away_team_id)
        )

        const map = new Map<string, { name: string; logoUrl: string | null; GP: number; W: number; D: number; L: number; GF: number; GA: number; GD: number; Pts: number }>()
        groupTeams.forEach(t => map.set(t.id, { name: t.name, logoUrl: t.logo_url ?? null, GP: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 }))

        groupFixtures.filter(f => f.played && f.home_score != null && f.away_score != null).forEach(f => {
          const home = map.get(f.home_team_id!); const away = map.get(f.away_team_id!)
          const hs = f.home_score!, as = f.away_score!
          if (home) { home.GP++; home.GF += hs; home.GA += as; home.GD += hs - as; if (hs > as) { home.W++; home.Pts += pointsWin } else if (hs === as) { home.D++; home.Pts += pointsDraw } else { home.L++; home.Pts += pointsLoss } }
          if (away) { away.GP++; away.GF += as; away.GA += hs; away.GD += as - hs; if (as > hs) { away.W++; away.Pts += pointsWin } else if (as === hs) { away.D++; away.Pts += pointsDraw } else { away.L++; away.Pts += pointsLoss } }
        })

        const rows = [...map.values()].sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF)

        return (
          <div key={gName} style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', borderLeft: '3px solid #059669', paddingLeft: '6px' }}>
              Группа {gName}
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '5px 6px', textAlign: 'left', color: '#9ca3af', fontWeight: 600, width: '18px' }}>#</th>
                  <th style={{ padding: '5px 6px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Команда</th>
                  <th style={{ padding: '5px 4px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>И</th>
                  <th style={{ padding: '5px 4px', textAlign: 'center', color: '#059669', fontWeight: 700 }}>В</th>
                  <th style={{ padding: '5px 4px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>Н</th>
                  <th style={{ padding: '5px 4px', textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>П</th>
                  <th style={{ padding: '5px 4px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>ЗМ</th>
                  <th style={{ padding: '5px 4px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>ПМ</th>
                  <th style={{ padding: '5px 6px', textAlign: 'center', color: '#111827', fontWeight: 700 }}>О</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.name} style={{ borderTop: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '5px 6px', color: '#9ca3af', fontWeight: 700, fontSize: '10px' }}>{i + 1}</td>
                    <td style={{ padding: '5px 6px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {r.logoUrl && <img src={r.logoUrl} alt="" style={{ width: '16px', height: '16px', borderRadius: '3px', objectFit: 'cover' }} />}
                      {r.name}
                    </td>
                    <td style={{ padding: '5px 4px', textAlign: 'center', color: '#6b7280' }}>{r.GP}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'center', color: '#059669', fontWeight: 700 }}>{r.W}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'center', color: '#6b7280' }}>{r.D}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'center', color: '#dc2626' }}>{r.L}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'center', color: '#059669' }}>{r.GF}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'center', color: '#dc2626' }}>{r.GA}</td>
                    <td style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 800, color: '#111827' }}>{r.Pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}

// League standings for league_playoff PDF export (no groups)
function ExportLeagueStandings({ teams, fixtures, pointsWin = 3, pointsDraw = 1, pointsLoss = 0 }: {
  teams: Team[]; fixtures: Fixture[]; pointsWin?: number; pointsDraw?: number; pointsLoss?: number
}) {
  const map = new Map<string, { name: string; logoUrl: string | null; GP: number; W: number; D: number; L: number; GF: number; GA: number; GD: number; Pts: number }>()
  teams.forEach(t => map.set(t.id, { name: t.name, logoUrl: t.logo_url ?? null, GP: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 }))

  fixtures.filter(f => !f.is_bye && f.played && f.home_score != null && f.away_score != null).forEach(f => {
    const home = map.get(f.home_team_id!); const away = map.get(f.away_team_id!)
    const hs = f.home_score!, as = f.away_score!
    if (home) { home.GP++; home.GF += hs; home.GA += as; home.GD += hs - as; if (hs > as) { home.W++; home.Pts += pointsWin } else if (hs === as) { home.D++; home.Pts += pointsDraw } else { home.L++; home.Pts += pointsLoss } }
    if (away) { away.GP++; away.GF += as; away.GA += hs; away.GD += as - hs; if (as > hs) { away.W++; away.Pts += pointsWin } else if (as === hs) { away.D++; away.Pts += pointsDraw } else { away.L++; away.Pts += pointsLoss } }
  })

  const rows = [...map.values()].sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF)

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
      <thead>
        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
          <th style={{ padding: '5px 6px', textAlign: 'left', color: '#9ca3af', fontWeight: 600, width: '18px' }}>#</th>
          <th style={{ padding: '5px 6px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Команда</th>
          <th style={{ padding: '5px 4px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>И</th>
          <th style={{ padding: '5px 4px', textAlign: 'center', color: '#059669', fontWeight: 700 }}>В</th>
          <th style={{ padding: '5px 4px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>Н</th>
          <th style={{ padding: '5px 4px', textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>П</th>
          <th style={{ padding: '5px 4px', textAlign: 'center', color: '#059669', fontWeight: 600 }}>ЗМ</th>
          <th style={{ padding: '5px 4px', textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>ПМ</th>
          <th style={{ padding: '5px 6px', textAlign: 'center', color: '#111827', fontWeight: 700 }}>О</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.name} style={{ borderTop: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
            <td style={{ padding: '5px 6px', color: '#9ca3af', fontWeight: 700, fontSize: '10px' }}>{i + 1}</td>
            <td style={{ padding: '5px 6px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {r.logoUrl && <img src={r.logoUrl} alt="" style={{ width: '16px', height: '16px', borderRadius: '3px', objectFit: 'cover' }} />}
              {r.name}
            </td>
            <td style={{ padding: '5px 4px', textAlign: 'center', color: '#6b7280' }}>{r.GP}</td>
            <td style={{ padding: '5px 4px', textAlign: 'center', color: '#059669', fontWeight: 700 }}>{r.W}</td>
            <td style={{ padding: '5px 4px', textAlign: 'center', color: '#6b7280' }}>{r.D}</td>
            <td style={{ padding: '5px 4px', textAlign: 'center', color: '#dc2626' }}>{r.L}</td>
            <td style={{ padding: '5px 4px', textAlign: 'center', color: '#059669' }}>{r.GF}</td>
            <td style={{ padding: '5px 4px', textAlign: 'center', color: '#dc2626' }}>{r.GA}</td>
            <td style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 800, color: '#111827' }}>{r.Pts}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const SECTION = (n: number, title: string, color: string) => ({
  marginBottom: '28px',
  header: {
    fontSize: '11px', fontWeight: 700, color, textTransform: 'uppercase' as const,
    letterSpacing: '0.06em', marginBottom: '10px',
  },
  box: { border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' },
})

export default async function TournamentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params
  const { tab: tabParam } = await searchParams
  const supabase = await createClient()
  const cookieStore = await cookies()
  const lang = getLang(cookieStore.get('lang')?.value)
  const T = tx[lang]
  const rt = REPORT_STRINGS[lang]
  const reportLocale = REPORT_DATE_LOCALE[lang]

  const [{ data: { user } }, plan] = await Promise.all([
    supabase.auth.getUser(),
    getOwnerPlan(id),
  ])
  const isPro = plan === 'pro' || plan === 'enterprise'
  const isEnterprise = plan === 'enterprise'

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single()

  if (!tournament) notFound()

  const isOwner = user?.id === tournament.user_id
  const isRoundRobin = tournament.format === 'round_robin' || !tournament.format

  // Tab visibility: groups_playoff and league_playoff have BOTH fixtures and a playoff bracket
  const fmt = tournament.format ?? 'round_robin'
  const showLeaderboardTab    = fmt === 'leaderboard'                                     // points ranking, no fixtures/bracket
  const showFixturesTab       = fmt !== 'playoff' && fmt !== 'leaderboard'                // round_robin, groups_playoff, league_playoff, swiss
  const showStandingsTab      = fmt === 'round_robin' || fmt === 'league_playoff' || fmt === 'swiss' || !tournament.format
  const showGroupStandingsTab = fmt === 'groups_playoff'                                 // per-group standings tables
  const leaderboardEntries    = showLeaderboardTab ? await getLeaderboardEntries(tournament.id) : []
  const showPlayoffTab        = fmt !== 'round_robin' && fmt !== 'swiss'                 // playoff, groups_playoff, league_playoff
  // Combat sports (MMA/boxing/wrestling): fights, not matches; participants, not teams.
  const isCombat = getCategoryForSport(tournament.sport ?? '')?.id === 'combat'
  const fixturesTabLabel = isCombat
    ? (lang === 'en' ? 'Fights' : lang === 'kz' ? 'Жекпе-жектер' : 'Бои')
    : T.tabFixtures

  const [{ data: teams }, { data: fixtures }, { data: playoffMatches }, { data: liveGame }, { data: membersRaw }, { data: seasonRow }] = await Promise.all([
    supabase.from('teams').select('*').eq('tournament_id', id).order('created_at'),
    supabase.from('fixtures').select('*, match_events(*)').eq('tournament_id', id).order('matchday'),
    // select without match_events join — works even before migration 009 is applied
    supabase.from('playoff_matches').select('*').eq('tournament_id', id).order('round_order').order('match_order'),
    supabase.from('live_games').select('playoff_match_id').eq('tournament_id', id).maybeSingle(),
    isOwner
      ? supabase.from('tournament_members').select('*').eq('tournament_id', id).order('created_at')
      : Promise.resolve({ data: [] as TournamentMember[] }),
    // Is this tournament a championship season? If so we swap in the season bar header.
    // leagues(*) so optional columns (calendar_enabled) don't break before migration 030.
    supabase.from('seasons').select('id, league_id, leagues(*)').eq('tournament_id', id).maybeSingle(),
  ])
  const members = (membersRaw ?? []) as TournamentMember[]

  // Championship-season context: the league (championship) + all its seasons.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const season = seasonRow as any
  const champLeague = season?.leagues ?? null
  let champSeasons: { id: string; name: string; status: string; tournament_id: string | null; format: string | null }[] = []
  // Persistent championship-team id → public slug, for linking standings rows to team pages.
  const champTeamSlugById = new Map<string, string>()
  if (champLeague) {
    const [{ data: cs }, { data: lt }] = await Promise.all([
      supabase.from('seasons').select('id, name, status, tournament_id, tournaments(format)').eq('league_id', season.league_id).order('created_at', { ascending: false }),
      supabase.from('league_teams').select('id, slug').eq('league_id', season.league_id),
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    champSeasons = (cs ?? []).map((s: any) => ({
      id: s.id, name: s.name, status: s.status, tournament_id: s.tournament_id,
      format: s.tournaments?.format ?? null,
    }))
    for (const row of (lt ?? []) as { id: string; slug: string }[]) champTeamSlugById.set(row.id, row.slug)
  }

  // Separately fetch playoff match events (requires migration 009 — falls back to [] if not yet applied)
  const pmIds = (playoffMatches ?? []).map((m: { id: string }) => m.id)
  const { data: pmEvents } = pmIds.length > 0
    ? await supabase.from('match_events').select('*').in('playoff_match_id', pmIds)
    : { data: [] }

  const t  = teams ?? []
  const f  = fixtures ?? []
  // Merge separately-fetched playoff events back into each match object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pm = (playoffMatches ?? []).map((m: any) => ({
    ...m,
    match_events: (pmEvents ?? []).filter((e: MatchEvent) => e.playoff_match_id === m.id),
  }))
  const slug = tournament.name.toLowerCase().replace(/\s+/g, '-')

  // Unified events for stats (both formats)
  const allEvents: MatchEvent[] = [
    ...f.flatMap((fx: Fixture) => fx.match_events ?? []),
    ...(pmEvents ?? []),
  ]

  // Default tab when generated. A ?tab= param (used when landing from a championship)
  // overrides it, so a season can open straight on its table / groups / league stage.
  // Calendar tab: championship season with the calendar feature enabled.
  const calendarEnabled = !!champLeague && !!(champLeague as { calendar_enabled?: boolean }).calendar_enabled && showFixturesTab
  const validTabs = new Set(
    [
      showLeaderboardTab && 'leaderboard',
      showFixturesTab && 'fixtures',
      showGroupStandingsTab && 'group-standings',
      showStandingsTab && 'standings',
      showPlayoffTab && 'playoff',
      calendarEnabled && 'calendar',
      'stats',
    ].filter(Boolean) as string[],
  )
  // Table-first: default to standings / groups / league stage, then playoff, then fixtures.
  const tableDefault = showLeaderboardTab ? 'leaderboard'
    : showGroupStandingsTab ? 'group-standings'
    : showStandingsTab ? 'standings'
    : showPlayoffTab ? 'playoff'
    : 'fixtures'
  const defaultTab = (tabParam && validTabs.has(tabParam)) ? tabParam : tableDefault

  // ── Champion detection ────────────────────────────────────────────────────
  let champion: Team | null = null
  let runnerUp: Team | null = null

  if (!isRoundRobin && pm.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalMatch = pm.find((m: any) => m.round_order === 1)
    if (finalMatch?.winner_id) {
      champion  = t.find((x: Team) => x.id === finalMatch.winner_id) ?? null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loserId = finalMatch.winner_id === finalMatch.home_team_id ? finalMatch.away_team_id : finalMatch.home_team_id
      runnerUp  = t.find((x: Team) => x.id === loserId) ?? null
    }
  }

  // Swiss champion only once every planned round is generated AND played
  const swissAllDone = fmt === 'swiss'
    && f.length > 0
    && f.filter((x: Fixture) => !x.is_bye).every((x: Fixture) => x.played)
    && f.reduce((m: number, x: Fixture) => Math.max(m, x.matchday), 0) >= (tournament.num_rounds ?? 0)

  if ((isRoundRobin || swissAllDone) && f.length > 0 && f.filter((x: Fixture) => !x.is_bye).every((x: Fixture) => x.played)) {
    // Simple standings: accumulate points
    const pWin  = tournament.points_win  ?? 3
    const pDraw = tournament.points_draw ?? 1
    const pLoss = tournament.points_loss ?? 0
    const pts   = new Map<string, number>()
    const gd    = new Map<string, number>()
    t.forEach((tm: Team) => { pts.set(tm.id, 0); gd.set(tm.id, 0) })
    f.filter((x: Fixture) => x.played && !x.is_bye).forEach((x: Fixture) => {
      const h = x.home_score ?? 0; const a = x.away_score ?? 0
      if (x.home_team_id) { gd.set(x.home_team_id, (gd.get(x.home_team_id) ?? 0) + (h - a)) }
      if (x.away_team_id) { gd.set(x.away_team_id, (gd.get(x.away_team_id) ?? 0) + (a - h)) }
      if (h > a) {
        if (x.home_team_id) pts.set(x.home_team_id, (pts.get(x.home_team_id) ?? 0) + pWin)
        if (x.away_team_id) pts.set(x.away_team_id, (pts.get(x.away_team_id) ?? 0) + pLoss)
      } else if (a > h) {
        if (x.away_team_id) pts.set(x.away_team_id, (pts.get(x.away_team_id) ?? 0) + pWin)
        if (x.home_team_id) pts.set(x.home_team_id, (pts.get(x.home_team_id) ?? 0) + pLoss)
      } else {
        if (x.home_team_id) pts.set(x.home_team_id, (pts.get(x.home_team_id) ?? 0) + pDraw)
        if (x.away_team_id) pts.set(x.away_team_id, (pts.get(x.away_team_id) ?? 0) + pDraw)
      }
    })
    // Swiss: byes count as a win (Wikipedia rule)
    if (fmt === 'swiss') {
      f.filter((x: Fixture) => x.is_bye && x.home_team_id).forEach((x: Fixture) => {
        pts.set(x.home_team_id!, (pts.get(x.home_team_id!) ?? 0) + pWin)
      })
    }
    const sorted = [...t].sort((a: Team, b: Team) =>
      ((pts.get(b.id) ?? 0) - (pts.get(a.id) ?? 0)) || ((gd.get(b.id) ?? 0) - (gd.get(a.id) ?? 0))
    )
    champion = sorted[0] ?? null
    runnerUp = sorted[1] ?? null
  }

  const s1 = SECTION(1, '', '#059669')
  const s2 = SECTION(2, '', '#059669')
  const s3 = SECTION(3, '', '#059669')
  const s4 = SECTION(4, '', '#d97706')
  const s5 = SECTION(5, '', '#2563eb')
  const s6 = SECTION(6, '', '#d97706')
  const s7 = SECTION(7, '', '#dc2626')

  const sportTheme = getSportTheme(tournament.sport)

  // Championship season → standings rows link to the public team page.
  const teamHrefs: Record<string, string> = champLeague
    ? Object.fromEntries(
        t.flatMap((tm: Team) => {
          const ltId = (tm as { league_team_id?: string | null }).league_team_id
          const slug = ltId ? champTeamSlugById.get(ltId) : undefined
          return slug ? [[tm.id, `/leagues/${champLeague.slug}/teams/${slug}`]] : []
        }),
      )
    : {}
  const teamLinkBrand = sportTheme.primary
  // Championship season: match-card "Состав" edits the persistent team roster.
  const champSquad = champLeague
    ? {
        leagueId: champLeague.id as string,
        sport: (champLeague.sport ?? null) as string | null,
        brand: sportTheme.primary,
        teamLeagueMap: Object.fromEntries(
          t.map((tm: Team) => [tm.id, (tm as { league_team_id?: string | null }).league_team_id ?? null]),
        ) as Record<string, string | null>,
      }
    : undefined

  return (
    <div className="space-y-5" style={{ ['--sp' as string]: sportTheme.primary, ['--spd' as string]: sportTheme.primaryDark, ['--spl' as string]: sportTheme.light } as React.CSSProperties}>
      {champLeague ? (
        <ChampionshipSeasonBar
          league={{ id: champLeague.id, name: champLeague.name, slug: champLeague.slug, sport: champLeague.sport, logo_url: champLeague.logo_url }}
          seasons={champSeasons}
          currentSeasonId={season.id}
          lang={lang}
          isOwner={isOwner}
        />
      ) : (
        <TournamentHeader tournament={tournament} isOwner={isOwner} isPro={isPro} members={members} lang={lang} />
      )}

      {!tournament.generated ? (
        <SetupTab tournament={tournament} teams={t} members={isOwner ? members : []} isOwner={isOwner} lang={lang} />
      ) : (
      <>
      {/* Hidden off-screen container for full PDF export */}
      <div
        id="full-report-export"
        aria-hidden="true"
        style={{
          position: 'absolute', left: '-9999px', top: 0, width: '860px',
          background: 'white', padding: '36px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Title — branded with sport colour + tournament logo */}
        <div style={{ marginBottom: '28px', borderBottom: `3px solid ${sportTheme.primary}`, paddingBottom: '14px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {tournament.logo_url && (
            <img
              src={tournament.logo_url}
              alt=""
              width={52}
              height={52}
              style={{ width: '52px', height: '52px', borderRadius: '12px', objectFit: 'cover', border: `1px solid ${sportTheme.primary}44`, flexShrink: 0 }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: 0 }}>{tournament.name}</p>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              {rt.fullReport} · {new Date().toLocaleDateString(reportLocale)} · {rt.teams(t.length)}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-green.png" alt="" width={20} height={20} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
            <span style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '-0.02em', color: sportTheme.primary }}>TOURNABLE</span>
          </div>
        </div>

        {isRoundRobin ? (
          <>
            {/* 1. Standings */}
            <div style={s1}>
              <p style={{ ...s1.header, color: '#059669' }}>1. {rt.standings}</p>
              <div style={s1.box}>
                <StandingsTable teams={t} fixtures={f}
                  pointsWin={tournament.points_win} pointsDraw={tournament.points_draw} pointsLoss={tournament.points_loss} />
              </div>
            </div>

            {/* 2. Results matrix */}
            {t.length >= 2 && (
              <div style={s2}>
                <p style={{ ...s2.header, color: '#059669' }}>2. {rt.matrix}</p>
                <div style={{ ...s2.box, padding: '12px' }}>
                  <ResultsMatrix teams={t} fixtures={f} />
                </div>
              </div>
            )}

            {/* 3. Goals */}
            <div style={s3}>
              <p style={{ ...s3.header, color: '#059669' }}>3. {rt.scorers}</p>
              <div style={s3.box}>
                <ExportStatsTable teams={t} events={allEvents} type="goal" label={rt.goalsLbl} accent="#059669" />
              </div>
            </div>

            {/* 4. Assists */}
            <div style={s4}>
              <p style={{ ...s4.header, color: '#d97706' }}>4. {rt.assists}</p>
              <div style={s4.box}>
                <ExportStatsTable teams={t} events={allEvents} type="assist" label={rt.assistsLbl} accent="#2563eb" />
              </div>
            </div>

            {/* 5. Yellow cards */}
            <div style={s5}>
              <p style={{ ...s5.header, color: '#d97706' }}>5. {rt.yellow}</p>
              <div style={s5.box}>
                <ExportStatsTable teams={t} events={allEvents} type="yellow_card" label={rt.ycLbl} accent="#d97706" />
              </div>
            </div>

            {/* 6. Red cards */}
            <div style={{ marginBottom: 0 }}>
              <p style={{ ...s6.header, color: '#dc2626' }}>6. {rt.red}</p>
              <div style={s6.box}>
                <ExportStatsTable teams={t} events={allEvents} type="red_card" label={rt.rcLbl} accent="#dc2626" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* groups_playoff: group stage standings */}
            {fmt === 'groups_playoff' && (
              <div style={s1}>
                <p style={{ ...s1.header, color: '#059669' }}>1. {rt.groupStage}</p>
                <div style={{ ...s1.box, padding: '12px' }}>
                  <ExportGroupStandings
                    teams={t}
                    fixtures={f}
                    pointsWin={tournament.points_win}
                    pointsDraw={tournament.points_draw}
                    pointsLoss={tournament.points_loss}
                  />
                </div>
              </div>
            )}

            {/* league_playoff: league stage standings */}
            {fmt === 'league_playoff' && (
              <div style={s1}>
                <p style={{ ...s1.header, color: '#059669' }}>1. {rt.leagueStage}</p>
                <div style={s1.box}>
                  <ExportLeagueStandings
                    teams={t}
                    fixtures={f}
                    pointsWin={tournament.points_win}
                    pointsDraw={tournament.points_draw}
                    pointsLoss={tournament.points_loss}
                  />
                </div>
              </div>
            )}

            {/* Bracket */}
            <div style={s2}>
              <p style={{ ...s2.header, color: '#059669' }}>
                {fmt === 'groups_playoff' ? `2. ${rt.bracket}` :
                 fmt === 'league_playoff' ? `2. ${rt.bracket}` :
                 `1. ${rt.bracketOnly}`}
              </p>
              <div style={{ ...s2.box, padding: '12px' }}>
                <ExportBracket teams={t} matches={pm} />
              </div>
            </div>

            {/* Goals */}
            <div style={s3}>
              <p style={{ ...s3.header, color: '#059669' }}>
                {fmt === 'groups_playoff' || fmt === 'league_playoff' ? `3. ${rt.scorers}` : `2. ${rt.scorers}`}
              </p>
              <div style={s3.box}>
                <ExportStatsTable teams={t} events={allEvents} type="goal" label={rt.goalsLbl} accent="#059669" />
              </div>
            </div>

            {/* Assists */}
            <div style={s4}>
              <p style={{ ...s4.header, color: '#d97706' }}>
                {fmt === 'groups_playoff' || fmt === 'league_playoff' ? `4. ${rt.assists}` : `3. ${rt.assists}`}
              </p>
              <div style={s4.box}>
                <ExportStatsTable teams={t} events={allEvents} type="assist" label={rt.assistsLbl} accent="#2563eb" />
              </div>
            </div>

            {/* Yellow cards */}
            <div style={s5}>
              <p style={{ ...s5.header, color: '#d97706' }}>
                {fmt === 'groups_playoff' || fmt === 'league_playoff' ? `5. ${rt.yellow}` : `4. ${rt.yellow}`}
              </p>
              <div style={s5.box}>
                <ExportStatsTable teams={t} events={allEvents} type="yellow_card" label={rt.ycLbl} accent="#d97706" />
              </div>
            </div>

            {/* Red cards */}
            <div style={{ marginBottom: 0 }}>
              <p style={{ ...s7.header, color: '#dc2626' }}>
                {fmt === 'groups_playoff' || fmt === 'league_playoff' ? `6. ${rt.red}` : `5. ${rt.red}`}
              </p>
              <div style={s7.box}>
                <ExportStatsTable teams={t} events={allEvents} type="red_card" label={rt.rcLbl} accent="#dc2626" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Champion banner ───────────────────────────────────────── */}
      {champion && (
        <ChampionBanner
          champion={champion}
          runnerUp={runnerUp}
          label={isRoundRobin ? T.tournamentWinner : T.playoffChampion}
          tournamentName={tournament.name}
          tournamentId={tournament.id}
          sport={tournament.sport}
          lang={lang}
        />
      )}

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <Tabs defaultValue={defaultTab}>

        {/* Tab bar — mobile-scrollable, no stretching */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm tournament-tabs">
          <div className="flex items-stretch">

            {/* Scrollable tabs */}
            <div className="flex-1 overflow-x-auto scrollbar-hide px-2 py-2">
              <TabsList className="flex h-auto gap-1 bg-transparent p-0 w-max">

                {showLeaderboardTab && (
                  <TabsTrigger value="leaderboard"
                    className="inline-flex items-center gap-1.5 h-9 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap
                      text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all
                      data-[active]:bg-[var(--sp)] data-[active]:text-white data-[active]:shadow-md">
                    <ListOrdered size={13} className="shrink-0" />
                    <span>{lang === 'en' ? 'Leaderboard' : lang === 'kz' ? 'Рейтинг' : 'Рейтинг'}</span>
                  </TabsTrigger>
                )}

                {showGroupStandingsTab && (
                  <TabsTrigger value="group-standings"
                    className="inline-flex items-center gap-1.5 h-9 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap
                      text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all
                      data-[active]:bg-[var(--sp)] data-[active]:text-white data-[active]:shadow-md">
                    <Layers size={13} className="shrink-0" />
                    <span>{T.tabGroups}</span>
                  </TabsTrigger>
                )}

                {showStandingsTab && (
                  <TabsTrigger value="standings"
                    className="inline-flex items-center gap-1.5 h-9 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap
                      text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all
                      data-[active]:bg-[var(--sp)] data-[active]:text-white data-[active]:shadow-md">
                    <BarChart2 size={13} className="shrink-0" />
                    <span>{fmt === 'league_playoff' ? T.tabLeagueStage : T.tabStandings}</span>
                  </TabsTrigger>
                )}

                {showFixturesTab && (
                  <TabsTrigger value="fixtures"
                    className="inline-flex items-center gap-1.5 h-9 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap
                      text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all
                      data-[active]:bg-[var(--sp)] data-[active]:text-white data-[active]:shadow-md">
                    <CalendarDays size={13} className="shrink-0" />
                    <span>{fixturesTabLabel}</span>
                    {f.filter((x: Fixture) => !x.is_bye).length > 0 && (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {f.filter((x: Fixture) => !x.is_bye).length}
                      </span>
                    )}
                  </TabsTrigger>
                )}

                {calendarEnabled && (
                  <TabsTrigger value="calendar"
                    className="inline-flex items-center gap-1.5 h-9 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap
                      text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all
                      data-[active]:bg-[var(--sp)] data-[active]:text-white data-[active]:shadow-md">
                    <CalendarDays size={13} className="shrink-0" />
                    <span>{lang === 'en' ? 'Calendar' : lang === 'kz' ? 'Күнтізбе' : 'Календарь'}</span>
                  </TabsTrigger>
                )}

                {showPlayoffTab && (
                  <TabsTrigger value="playoff"
                    className="inline-flex items-center gap-1.5 h-9 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap
                      text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all
                      data-[active]:bg-[var(--sp)] data-[active]:text-white data-[active]:shadow-md">
                    <Trophy size={13} className="shrink-0" />
                    <span>{T.tabBracket}</span>
                    {pm.filter((m: any) => m.winner_id !== null).length > 0 && (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {pm.filter((m: any) => m.winner_id !== null).length}/{pm.length}
                      </span>
                    )}
                  </TabsTrigger>
                )}

                <TabsTrigger value="stats"
                  className="inline-flex items-center gap-1.5 h-9 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap
                    text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all
                    data-[active]:bg-[var(--sp)] data-[active]:text-white data-[active]:shadow-md">
                  <Users size={13} className="shrink-0" />
                  <span>{T.tabStats}</span>
                </TabsTrigger>

              </TabsList>
            </div>

          </div>
        </div>

        {/* Export button — below tab bar, aligned right */}
        {tournament.generated && !showLeaderboardTab && (
          <div className="flex justify-end">
            <ExportReportButton fileName={`${slug}-report`} isPro={isPro} lang={lang} />
          </div>
        )}

        {/* Tab content */}
        {showLeaderboardTab && (
          <TabsContent value="leaderboard" className="mt-0 pt-5">
            <LeaderboardTab
              tournamentId={tournament.id}
              teams={t}
              entries={leaderboardEntries}
              isOwner={isOwner}
              lang={lang}
              brand={sportTheme.primary}
              initialRounds={tournament.num_rounds ?? 1}
            />
          </TabsContent>
        )}
        {showFixturesTab && (
          <TabsContent value="fixtures" className="mt-0 pt-5">
            <FixturesTab tournament={tournament} teams={t} fixtures={f} isPro={isPro} isEnterprise={isEnterprise} isOwner={isOwner} lang={lang} champSquad={champSquad} />
          </TabsContent>
        )}
        {calendarEnabled && (
          <TabsContent value="calendar" className="mt-0 pt-5">
            <CalendarTab fixtures={f} teams={t} tournamentId={tournament.id} isOwner={isOwner} lang={lang} />
          </TabsContent>
        )}
        {showGroupStandingsTab && (
          <TabsContent value="group-standings" className="mt-0 pt-5">
            <GroupStandingsTab teams={t} fixtures={f} tournament={tournament} lang={lang} isPro={isPro} />
          </TabsContent>
        )}
        {showStandingsTab && (
          <TabsContent value="standings" className="mt-0 pt-5">
            <StandingsTab teams={t} fixtures={f} tournamentName={tournament.name} tournament={tournament} lang={lang} teamHrefs={teamHrefs} teamLinkBrand={teamLinkBrand} isPro={isPro} />
          </TabsContent>
        )}
        {showPlayoffTab && (
          <TabsContent value="playoff" className="mt-0 pt-5">
            <PlayoffTab
              tournament={tournament}
              teams={t}
              matches={pm}
              livePlayoffMatchId={liveGame?.playoff_match_id ?? null}
              isPro={isPro}
              lang={lang}
            />
          </TabsContent>
        )}
        <TabsContent value="stats" className="mt-0 pt-5">
          <StatsTab teams={t} events={allEvents} lang={lang} sport={tournament.sport} hideUpsell={isEnterprise || !!champLeague} />
        </TabsContent>
      </Tabs>
      </>
      )}
    </div>
  )
}
