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

  return (
    <div className="space-y-6">
      <TournamentHeader tournament={tournament} isOwner={isOwner} />

      {/* Hidden off-screen container for full PDF export */}
      <div
        id="full-report-export"
        aria-hidden="true"
        style={{
          position: 'absolute', left: '-9999px', top: 0, width: '900px',
          background: 'white', padding: '32px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ marginBottom: '24px', borderBottom: '2px solid #059669', paddingBottom: '12px' }}>
          <p style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: 0 }}>{tournament.name}</p>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Полный отчёт · {new Date().toLocaleDateString('ru-RU')}</p>
        </div>
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>1. Турнирная таблица</p>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <StandingsTable teams={t} fixtures={f} />
          </div>
        </div>
        {t.length >= 2 && (
          <div style={{ marginBottom: '28px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>2. Матрица результатов</p>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', padding: '12px' }}>
              <ResultsMatrix teams={t} fixtures={f} />
            </div>
          </div>
        )}
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>3. Бомбардиры</p>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <ScorersTable teams={t} fixtures={f} />
          </div>
        </div>
      </div>

      <Tabs defaultValue={defaultTab}>
        {/* ── Tab bar block ──────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm tournament-tabs">
          <div className="flex items-center gap-2 px-3 py-3 overflow-x-auto">
            <TabsList className="flex h-auto gap-1 bg-transparent p-0 flex-1 min-w-0">
              <TabsTrigger
                value="setup"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold whitespace-nowrap
                  text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all
                  data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                <Settings2 size={14} />
                Настройка
              </TabsTrigger>

              {isRoundRobin && (
                <TabsTrigger
                  value="fixtures"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold whitespace-nowrap
                    text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all
                    data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  <CalendarDays size={14} />
                  Матчи
                  {f.filter(x => !x.is_bye).length > 0 && (
                    <span className="ml-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {f.filter(x => !x.is_bye).length}
                    </span>
                  )}
                </TabsTrigger>
              )}

              {isRoundRobin && (
                <TabsTrigger
                  value="standings"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold whitespace-nowrap
                    text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all
                    data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  <BarChart2 size={14} />
                  Таблица
                </TabsTrigger>
              )}

              {!isRoundRobin && (
                <TabsTrigger
                  value="playoff"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold whitespace-nowrap
                    text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all
                    data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  <Trophy size={14} />
                  Сетка
                </TabsTrigger>
              )}

              <TabsTrigger
                value="stats"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold whitespace-nowrap
                  text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all
                  data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                <Users size={14} />
                Бомбардиры
              </TabsTrigger>
            </TabsList>

            {tournament.generated && isRoundRobin && (
              <div className="shrink-0">
                <ExportReportButton fileName={`${slug}-report`} />
              </div>
            )}
          </div>
        </div>

        {/* ── Tab content ────────────────────────────────── */}
        <TabsContent value="setup" className="mt-0 pt-6">
          <SetupTab tournament={tournament} teams={t} />
        </TabsContent>
        {isRoundRobin && (
          <TabsContent value="fixtures" className="mt-0 pt-6">
            <FixturesTab tournament={tournament} teams={t} fixtures={f} />
          </TabsContent>
        )}
        {isRoundRobin && (
          <TabsContent value="standings" className="mt-0 pt-6">
            <StandingsTab teams={t} fixtures={f} tournamentName={tournament.name} tournament={tournament} />
          </TabsContent>
        )}
        {!isRoundRobin && (
          <TabsContent value="playoff" className="mt-0 pt-6">
            <PlayoffTab tournament={tournament} teams={t} matches={pm} />
          </TabsContent>
        )}
        <TabsContent value="stats" className="mt-0 pt-6">
          <StatsTab teams={t} fixtures={f} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
