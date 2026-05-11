import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StandingsTab from '@/components/tournament/StandingsTab'
import ScorersTab from '@/components/tournament/ScorersTab'
import PublicFixturesTab from '@/components/tournament/PublicFixturesTab'
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

  const [{ data: teams }, { data: fixtures }] = await Promise.all([
    supabase.from('teams').select('*').eq('tournament_id', id).order('created_at'),
    supabase.from('fixtures').select('*, scorers(*)').eq('tournament_id', id).order('matchday'),
  ])

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
        <h1 className="text-3xl font-black text-gray-900 mb-1">{tournament.name}</h1>
        <p className="text-gray-400 text-sm mb-6">{tournament.num_rounds} {tournament.num_rounds === 1 ? 'круг' : 'круга'}</p>

        <Tabs defaultValue="standings">
          <TabsList className="mb-6 bg-white border border-emerald-100">
            <TabsTrigger value="standings">Таблица</TabsTrigger>
            <TabsTrigger value="fixtures">Матчи</TabsTrigger>
            <TabsTrigger value="scorers">Бомбардиры</TabsTrigger>
          </TabsList>
          <TabsContent value="standings">
            <StandingsTab teams={teams ?? []} fixtures={fixtures ?? []} />
          </TabsContent>
          <TabsContent value="fixtures">
            <PublicFixturesTab tournament={tournament} teams={teams ?? []} fixtures={fixtures ?? []} />
          </TabsContent>
          <TabsContent value="scorers">
            <ScorersTab teams={teams ?? []} fixtures={fixtures ?? []} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
