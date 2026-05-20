import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SetupTab from '@/components/tournament/SetupTab'
import FixturesTab from '@/components/tournament/FixturesTab'
import StandingsTab from '@/components/tournament/StandingsTab'
import StatsTab from '@/components/tournament/StatsTab'
import PlayoffTab from '@/components/tournament/PlayoffTab'
import TournamentHeader from '@/components/tournament/TournamentHeader'
import StandingsTable from '@/components/tournament/StandingsTable'
import ResultsMatrix from '@/components/tournament/ResultsMatrix'
import ExportReportButton from '@/components/tournament/ExportReportButton'
import { Settings2, CalendarDays, BarChart2, Users, Trophy } from 'lucide-react'
import type { Team, Fixture, MatchEvent } from '@/types'

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

const SECTION = (n: number, title: string, color: string) => ({
  marginBottom: '28px',
  header: {
    fontSize: '11px', fontWeight: 700, color, textTransform: 'uppercase' as const,
    letterSpacing: '0.06em', marginBottom: '10px',
  },
  box: { border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' },
})

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single()

  if (!tournament) notFound()

  const isOwner = user?.id === tournament.user_id
  const isRoundRobin = tournament.format === 'round_robin' || !tournament.format

  const [{ data: teams }, { data: fixtures }, { data: playoffMatches }, { data: liveGame }] = await Promise.all([
    supabase.from('teams').select('*').eq('tournament_id', id).order('created_at'),
    supabase.from('fixtures').select('*, match_events(*)').eq('tournament_id', id).order('matchday'),
    supabase.from('playoff_matches').select('*, match_events(*)').eq('tournament_id', id).order('round_order').order('match_order'),
    supabase.from('live_games').select('playoff_match_id').eq('tournament_id', id).maybeSingle(),
  ])

  const t  = teams ?? []
  const f  = fixtures ?? []
  const pm = playoffMatches ?? []
  const slug = tournament.name.toLowerCase().replace(/\s+/g, '-')

  // Unified events for stats (both formats)
  const allEvents: MatchEvent[] = [
    ...f.flatMap((fx: Fixture) => fx.match_events ?? []),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...pm.flatMap((m: any) => m.match_events ?? []),
  ]

  const defaultTab = tournament.generated
    ? (isRoundRobin ? 'fixtures' : 'playoff')
    : 'setup'

  const s1 = SECTION(1, '', '#059669')
  const s2 = SECTION(2, '', '#059669')
  const s3 = SECTION(3, '', '#059669')
  const s4 = SECTION(4, '', '#d97706')
  const s5 = SECTION(5, '', '#2563eb')
  const s6 = SECTION(6, '', '#d97706')
  const s7 = SECTION(7, '', '#dc2626')

  return (
    <div className="space-y-5">
      <TournamentHeader tournament={tournament} isOwner={isOwner} />

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
        {/* Title */}
        <div style={{ marginBottom: '28px', borderBottom: '3px solid #059669', paddingBottom: '14px' }}>
          <p style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: 0 }}>{tournament.name}</p>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Полный отчёт · {new Date().toLocaleDateString('ru-RU')} · {t.length} команд
            {isRoundRobin
              ? ` · ${f.filter((x: Fixture) => x.played && !x.is_bye).length} сыграно`
              : ` · ${pm.filter((m: any) => m.winner_id).length} матчей сыграно`}
          </p>
        </div>

        {isRoundRobin ? (
          <>
            {/* 1. Standings */}
            <div style={s1}>
              <p style={{ ...s1.header, color: '#059669' }}>1. Турнирная таблица</p>
              <div style={s1.box}>
                <StandingsTable teams={t} fixtures={f}
                  pointsWin={tournament.points_win} pointsDraw={tournament.points_draw} pointsLoss={tournament.points_loss} />
              </div>
            </div>

            {/* 2. Results matrix */}
            {t.length >= 2 && (
              <div style={s2}>
                <p style={{ ...s2.header, color: '#059669' }}>2. Матрица результатов</p>
                <div style={{ ...s2.box, padding: '12px' }}>
                  <ResultsMatrix teams={t} fixtures={f} />
                </div>
              </div>
            )}

            {/* 3. Goals */}
            <div style={s3}>
              <p style={{ ...s3.header, color: '#059669' }}>3. Бомбардиры ⚽</p>
              <div style={s3.box}>
                <ExportStatsTable teams={t} events={allEvents} type="goal" label="Голы" accent="#059669" />
              </div>
            </div>

            {/* 4. Assists */}
            <div style={s4}>
              <p style={{ ...s4.header, color: '#d97706' }}>4. Ассистенты 🎯</p>
              <div style={s4.box}>
                <ExportStatsTable teams={t} events={allEvents} type="assist" label="Ассисты" accent="#2563eb" />
              </div>
            </div>

            {/* 5. Yellow cards */}
            <div style={s5}>
              <p style={{ ...s5.header, color: '#d97706' }}>5. Жёлтые карточки 🟨</p>
              <div style={s5.box}>
                <ExportStatsTable teams={t} events={allEvents} type="yellow_card" label="ЖК" accent="#d97706" />
              </div>
            </div>

            {/* 6. Red cards */}
            <div style={{ marginBottom: 0 }}>
              <p style={{ ...s6.header, color: '#dc2626' }}>6. Красные карточки 🟥</p>
              <div style={s6.box}>
                <ExportStatsTable teams={t} events={allEvents} type="red_card" label="КК" accent="#dc2626" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 1. Bracket */}
            <div style={s1}>
              <p style={{ ...s1.header, color: '#059669' }}>1. Результаты сетки</p>
              <div style={{ ...s1.box, padding: '12px' }}>
                <ExportBracket teams={t} matches={pm} />
              </div>
            </div>

            {/* 2. Goals */}
            <div style={s3}>
              <p style={{ ...s3.header, color: '#059669' }}>2. Бомбардиры ⚽</p>
              <div style={s3.box}>
                <ExportStatsTable teams={t} events={allEvents} type="goal" label="Голы" accent="#059669" />
              </div>
            </div>

            {/* 3. Assists */}
            <div style={s4}>
              <p style={{ ...s4.header, color: '#d97706' }}>3. Ассистенты 🎯</p>
              <div style={s4.box}>
                <ExportStatsTable teams={t} events={allEvents} type="assist" label="Ассисты" accent="#2563eb" />
              </div>
            </div>

            {/* 4. Yellow cards */}
            <div style={s5}>
              <p style={{ ...s5.header, color: '#d97706' }}>4. Жёлтые карточки 🟨</p>
              <div style={s5.box}>
                <ExportStatsTable teams={t} events={allEvents} type="yellow_card" label="ЖК" accent="#d97706" />
              </div>
            </div>

            {/* 5. Red cards */}
            <div style={{ marginBottom: 0 }}>
              <p style={{ ...s7.header, color: '#dc2626' }}>5. Красные карточки 🟥</p>
              <div style={s7.box}>
                <ExportStatsTable teams={t} events={allEvents} type="red_card" label="КК" accent="#dc2626" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <Tabs defaultValue={defaultTab}>

        {/* Tab bar — mobile-scrollable, no stretching */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm tournament-tabs">
          <div className="flex items-stretch">

            {/* Scrollable tabs */}
            <div className="flex-1 overflow-x-auto scrollbar-hide px-2 py-2">
              <TabsList className="flex h-auto gap-1 bg-transparent p-0 w-max">

                <TabsTrigger value="setup"
                  className="inline-flex items-center gap-1.5 h-9 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap
                    text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all
                    data-[active]:bg-emerald-600 data-[active]:text-white data-[active]:shadow-md">
                  <Settings2 size={13} className="shrink-0" />
                  <span>Настройка</span>
                </TabsTrigger>

                {isRoundRobin && (
                  <TabsTrigger value="fixtures"
                    className="inline-flex items-center gap-1.5 h-9 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap
                      text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all
                      data-[active]:bg-emerald-600 data-[active]:text-white data-[active]:shadow-md">
                    <CalendarDays size={13} className="shrink-0" />
                    <span>Матчи</span>
                    {f.filter((x: Fixture) => !x.is_bye).length > 0 && (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {f.filter((x: Fixture) => !x.is_bye).length}
                      </span>
                    )}
                  </TabsTrigger>
                )}

                {isRoundRobin && (
                  <TabsTrigger value="standings"
                    className="inline-flex items-center gap-1.5 h-9 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap
                      text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all
                      data-[active]:bg-emerald-600 data-[active]:text-white data-[active]:shadow-md">
                    <BarChart2 size={13} className="shrink-0" />
                    <span>Таблица</span>
                  </TabsTrigger>
                )}

                {!isRoundRobin && (
                  <TabsTrigger value="playoff"
                    className="inline-flex items-center gap-1.5 h-9 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap
                      text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all
                      data-[active]:bg-emerald-600 data-[active]:text-white data-[active]:shadow-md">
                    <Trophy size={13} className="shrink-0" />
                    <span>Сетка</span>
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
                    data-[active]:bg-emerald-600 data-[active]:text-white data-[active]:shadow-md">
                  <Users size={13} className="shrink-0" />
                  <span>Статистика</span>
                </TabsTrigger>

              </TabsList>
            </div>

          </div>
        </div>

        {/* Export button — below tab bar, aligned right */}
        {tournament.generated && (
          <div className="flex justify-end">
            <ExportReportButton fileName={`${slug}-report`} />
          </div>
        )}

        {/* Tab content */}
        <TabsContent value="setup" className="mt-0 pt-5">
          <SetupTab tournament={tournament} teams={t} />
        </TabsContent>
        {isRoundRobin && (
          <TabsContent value="fixtures" className="mt-0 pt-5">
            <FixturesTab tournament={tournament} teams={t} fixtures={f} />
          </TabsContent>
        )}
        {isRoundRobin && (
          <TabsContent value="standings" className="mt-0 pt-5">
            <StandingsTab teams={t} fixtures={f} tournamentName={tournament.name} tournament={tournament} />
          </TabsContent>
        )}
        {!isRoundRobin && (
          <TabsContent value="playoff" className="mt-0 pt-5">
            <PlayoffTab
              tournament={tournament}
              teams={t}
              matches={pm}
              livePlayoffMatchId={liveGame?.playoff_match_id ?? null}
            />
          </TabsContent>
        )}
        <TabsContent value="stats" className="mt-0 pt-5">
          <StatsTab teams={t} events={allEvents} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
