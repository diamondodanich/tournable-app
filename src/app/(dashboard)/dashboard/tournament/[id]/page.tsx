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
import ScorersTable from '@/components/tournament/ScorersTable'
import ResultsMatrix from '@/components/tournament/ResultsMatrix'
import ExportReportButton from '@/components/tournament/ExportReportButton'
import { Settings2, CalendarDays, BarChart2, Users, Trophy } from 'lucide-react'
import type { Team, Fixture } from '@/types'

// ── Inline stats helper for server-rendered PDF export ────────────────────
function buildStats(teams: Team[], fixtures: Fixture[], type: string) {
  const map = new Map<string, { player: string; teamName: string; count: number }>()
  fixtures.forEach(f => {
    if (!f.played || f.is_bye) return
    f.match_events?.filter(e => e.type === type).forEach(e => {
      const name = e.player_name.trim()
      if (!name) return
      const key = `${e.team_id}|${name.toLowerCase()}`
      const team = teams.find(t => t.id === e.team_id)
      if (!map.has(key)) map.set(key, { player: name, teamName: team?.name ?? '—', count: 0 })
      map.get(key)!.count++
    })
  })
  return [...map.values()].sort((a, b) => b.count - a.count)
}

function ExportStatsTable({ teams, fixtures, type, label, accent }: {
  teams: Team[]; fixtures: Fixture[]
  type: string; label: string; accent: string
}) {
  const rows = buildStats(teams, fixtures, type)
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

  const [{ data: teams }, { data: fixtures }, { data: playoffMatches }] = await Promise.all([
    supabase.from('teams').select('*').eq('tournament_id', id).order('created_at'),
    supabase.from('fixtures').select('*, match_events(*)').eq('tournament_id', id).order('matchday'),
    supabase.from('playoff_matches').select('*').eq('tournament_id', id).order('round_order').order('match_order'),
  ])

  const t = teams ?? []
  const f = fixtures ?? []
  const pm = playoffMatches ?? []
  const slug = tournament.name.toLowerCase().replace(/\s+/g, '-')

  const defaultTab = tournament.generated
    ? (isRoundRobin ? 'fixtures' : 'playoff')
    : 'setup'

  const s1 = SECTION(1, '', '#059669')
  const s2 = SECTION(2, '', '#059669')
  const s3 = SECTION(3, '', '#d97706')
  const s4 = SECTION(4, '', '#2563eb')
  const s5 = SECTION(5, '', '#d97706')
  const s6 = SECTION(6, '', '#dc2626')

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
            Полный отчёт · {new Date().toLocaleDateString('ru-RU')} · {t.length} команд · {f.filter(x => x.played && !x.is_bye).length} сыграно
          </p>
        </div>

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
          <p style={{ ...s3.header, color: '#d97706' }}>3. Бомбардиры ⚽</p>
          <div style={s3.box}>
            <ScorersTable teams={t} fixtures={f} />
          </div>
        </div>

        {/* 4. Assists */}
        <div style={s4}>
          <p style={{ ...s4.header, color: '#2563eb' }}>4. Ассистенты 🎯</p>
          <div style={s4.box}>
            <ExportStatsTable teams={t} fixtures={f} type="assist" label="Ассисты" accent="#2563eb" />
          </div>
        </div>

        {/* 5. Yellow cards */}
        <div style={s5}>
          <p style={{ ...s5.header, color: '#d97706' }}>5. Жёлтые карточки 🟨</p>
          <div style={s5.box}>
            <ExportStatsTable teams={t} fixtures={f} type="yellow_card" label="ЖК" accent="#d97706" />
          </div>
        </div>

        {/* 6. Red cards */}
        <div style={{ marginBottom: 0 }}>
          <p style={{ ...s6.header, color: '#dc2626' }}>6. Красные карточки 🟥</p>
          <div style={s6.box}>
            <ExportStatsTable teams={t} fixtures={f} type="red_card" label="КК" accent="#dc2626" />
          </div>
        </div>
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
                    {f.filter(x => !x.is_bye).length > 0 && (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {f.filter(x => !x.is_bye).length}
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

            {/* Export button — pinned right, only when generated */}
            {tournament.generated && isRoundRobin && (
              <div className="shrink-0 flex items-center pr-2 sm:pr-3 border-l border-gray-100 pl-2">
                <ExportReportButton fileName={`${slug}-report`} />
              </div>
            )}
          </div>
        </div>

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
            <PlayoffTab tournament={tournament} teams={t} matches={pm} />
          </TabsContent>
        )}
        <TabsContent value="stats" className="mt-0 pt-5">
          <StatsTab teams={t} fixtures={f} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
