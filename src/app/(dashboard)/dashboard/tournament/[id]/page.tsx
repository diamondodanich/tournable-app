import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SetupTab from '@/components/tournament/SetupTab'
import FixturesTab from '@/components/tournament/FixturesTab'
import StandingsTab from '@/components/tournament/StandingsTab'
import ScorersTab from '@/components/tournament/ScorersTab'
import TournamentHeader from '@/components/tournament/TournamentHeader'

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

  return (
    <div>
      <TournamentHeader tournament={tournament} />

      <Tabs defaultValue={tournament.generated ? 'fixtures' : 'setup'} className="mt-6">
        <TabsList className="mb-6 w-full grid grid-cols-4 h-12 bg-white border border-emerald-100 p-1 rounded-xl shadow-sm">
          <TabsTrigger value="setup" className="text-sm font-semibold rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
            Настройка
          </TabsTrigger>
          <TabsTrigger value="fixtures" className="text-sm font-semibold rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
            Матчи {fixtures && fixtures.filter(f => !f.is_bye).length > 0 && (
              <span className="ml-1.5 bg-emerald-100 text-emerald-700 data-[state=active]:bg-white/20 data-[state=active]:text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {fixtures.filter(f => !f.is_bye).length}
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
          <SetupTab tournament={tournament} teams={teams ?? []} />
        </TabsContent>
        <TabsContent value="fixtures">
          <FixturesTab tournament={tournament} teams={teams ?? []} fixtures={fixtures ?? []} />
        </TabsContent>
        <TabsContent value="standings">
          <StandingsTab teams={teams ?? []} fixtures={fixtures ?? []} />
        </TabsContent>
        <TabsContent value="scorers">
          <ScorersTab teams={teams ?? []} fixtures={fixtures ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
