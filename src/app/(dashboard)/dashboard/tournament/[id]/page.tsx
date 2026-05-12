import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SetupTab from '@/components/tournament/SetupTab'
import FixturesTab from '@/components/tournament/FixturesTab'
import StandingsTab from '@/components/tournament/StandingsTab'
import ScorersTab from '@/components/tournament/ScorersTab'
import TournamentHeader from '@/components/tournament/TournamentHeader'
import StandingsTable from '@/components/tournament/StandingsTable'
import ScorersTable from '@/components/tournament/ScorersTable'
import ResultsMatrix from '@/components/tournament/ResultsMatrix'
import ExportReportButton from '@/components/tournament/ExportReportButton'

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single()

  if (!tournament) notFound()

  const [{ data: teams }, { data: fixtures }] = await Promise.all([
    supabase.from('teams').select('*').eq('tournament_id', id).order('created_at'),
    supabase.from('fixtures').select('*, scorers(*)').eq('tournament_id', id).order('matchday'),
  ])

  const t = teams ?? []
  const f = fixtures ?? []
  const slug = tournament.name.toLowerCase().replace(/\s+/g, '-')

  return (
    <div>
      <TournamentHeader tournament={tournament} />

      {/* Hidden off-screen container for full PDF export */}
      <div
        id="full-report-export"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '900px',
          background: 'white',
          padding: '32px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px', borderBottom: '2px solid #059669', paddingBottom: '12px' }}>
          <p style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: 0 }}>{tournament.name}</p>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Полный отчёт · {new Date().toLocaleDateString('ru-RU')}</p>
        </div>

        {/* Section 1: Standings */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            1. Турнирная таблица
          </p>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <StandingsTable teams={t} fixtures={f} />
          </div>
        </div>

        {/* Section 2: Results matrix */}
        {t.length >= 2 && (
          <div style={{ marginBottom: '28px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              2. Матрица результатов
            </p>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', padding: '12px' }}>
              <ResultsMatrix teams={t} fixtures={f} />
            </div>
          </div>
        )}

        {/* Section 3: Scorers */}
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            3. Бомбардиры
          </p>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <ScorersTable teams={t} fixtures={f} />
          </div>
        </div>
      </div>

      {/* Export button above tabs */}
      {tournament.generated && (
        <div className="flex justify-end mt-4 mb-2">
          <ExportReportButton fileName={`${slug}-report`} />
        </div>
      )}

      <Tabs defaultValue={tournament.generated ? 'fixtures' : 'setup'} className="mt-2">
        <TabsList className="mb-6 w-full grid grid-cols-4 h-12 bg-white border border-emerald-100 p-1 rounded-xl shadow-sm">
          <TabsTrigger value="setup" className="text-sm font-semibold rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
            Настройка
          </TabsTrigger>
          <TabsTrigger value="fixtures" className="text-sm font-semibold rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
            Матчи {f.filter(x => !x.is_bye).length > 0 && (
              <span className="ml-1.5 bg-emerald-100 text-emerald-700 data-[state=active]:bg-white/20 data-[state=active]:text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {f.filter(x => !x.is_bye).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="standings" className="text-sm font-semibold rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
            Таблица
          </TabsTrigger>
          <TabsTrigger value="scorers" className="text-sm font-semibold rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
            Бомбардиры
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup">
          <SetupTab tournament={tournament} teams={t} />
        </TabsContent>
        <TabsContent value="fixtures">
          <FixturesTab tournament={tournament} teams={t} fixtures={f} />
        </TabsContent>
        <TabsContent value="standings">
          <StandingsTab teams={t} fixtures={f} tournamentName={tournament.name} />
        </TabsContent>
        <TabsContent value="scorers">
          <ScorersTab teams={t} fixtures={f} tournamentName={tournament.name} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
