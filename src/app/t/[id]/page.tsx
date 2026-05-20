import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StandingsTab from '@/components/tournament/StandingsTab'
import StatsTab from '@/components/tournament/StatsTab'
import PublicFixturesTab from '@/components/tournament/PublicFixturesTab'
import TeamAvatar from '@/components/tournament/TeamAvatar'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('tournaments').select('name').eq('id', id).single()
  return { title: data ? `${data.name} — Tournable` : 'Tournable' }
}

export default async function PublicTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', id).single()
  if (!tournament) notFound()

  const [{ data: teams }, { data: fixtures }, { data: playoffMatches }] = await Promise.all([
    supabase.from('teams').select('*').eq('tournament_id', id).order('created_at'),
    supabase.from('fixtures').select('*, match_events(*)').eq('tournament_id', id).order('matchday'),
    supabase.from('playoff_matches').select('*, match_events(*)').eq('tournament_id', id).order('round_order').order('match_order'),
  ])

  const isRoundRobin = tournament.format === 'round_robin' || !tournament.format

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allEvents = [
    ...(fixtures ?? []).flatMap((f: any) => f.match_events ?? []),
    ...(playoffMatches ?? []).flatMap((m: any) => m.match_events ?? []),
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <header className="bg-white border-b border-emerald-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-2xl font-black tracking-tight text-emerald-700">TOURNABLE</span>
          <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full uppercase tracking-wide">
            Режим просмотра
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start gap-3 mb-6">
          <TeamAvatar name={tournament.name} logoUrl={tournament.logo_url} size={48} />
          <div>
            <h1 className="text-3xl font-black text-gray-900">{tournament.name}</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {tournament.format === 'playoff' ? 'Плей-офф' : `${tournament.num_rounds} ${tournament.num_rounds === 1 ? 'круг' : 'круга'}`}
            </p>
          </div>
        </div>

        {isRoundRobin ? (
          <Tabs defaultValue="standings">
            <TabsList className="mb-6 bg-white border border-emerald-100">
              <TabsTrigger value="standings">Таблица</TabsTrigger>
              <TabsTrigger value="fixtures">Матчи</TabsTrigger>
              <TabsTrigger value="stats">Статистика</TabsTrigger>
            </TabsList>
            <TabsContent value="standings">
              <StandingsTab teams={teams ?? []} fixtures={fixtures ?? []} tournamentName={tournament.name} />
            </TabsContent>
            <TabsContent value="fixtures">
              <PublicFixturesTab tournament={tournament} teams={teams ?? []} fixtures={fixtures ?? []} />
            </TabsContent>
            <TabsContent value="stats">
              <StatsTab teams={teams ?? []} events={allEvents} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-4xl mb-3">🏆</p>
            <p className="font-bold text-gray-600">Турнир в формате плей-офф</p>
          </div>
        )}
      </main>
    </div>
  )
}
