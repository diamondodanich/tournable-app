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

const FORMAT_LABELS: Record<string, string> = {
  round_robin:    'Круговой',
  playoff:        'Плей-офф',
  groups_playoff: 'Группы + Плей-офф',
  league_playoff: 'Лига + Плей-офф',
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

  const fmt = tournament.format ?? 'round_robin'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allEvents = [
    ...(fixtures ?? []).flatMap((f: any) => f.match_events ?? []),
    ...(playoffMatches ?? []).flatMap((m: any) => m.match_events ?? []),
  ]

  const showGroupStandings = fmt === 'groups_playoff' && (teams ?? []).some((t: any) => t.group_name)
  const groups = showGroupStandings
    ? [...new Set((teams ?? []).map((t: any) => t.group_name).filter(Boolean))].sort()
    : []

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#ecfdf5 0%,#f0fdf4 50%,#ffffff 100%)' }}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-black text-lg tracking-tight text-emerald-700" style={{ letterSpacing: '-.03em' }}>TOURNABLE</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">
            Просмотр
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Tournament identity */}
        <div className="flex items-center gap-4 mb-6">
          <TeamAvatar name={tournament.name} logoUrl={tournament.logo_url} size={56} />
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">{tournament.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {FORMAT_LABELS[fmt] ?? fmt}
              {fmt === 'round_robin' && tournament.num_rounds > 1 && ` · ${tournament.num_rounds} круга`}
              {fmt === 'groups_playoff' && tournament.groups_count && ` · ${tournament.groups_count} групп`}
            </p>
          </div>
        </div>

        {/* ── ROUND-ROBIN / LEAGUE+PLAYOFF: standings + fixtures + stats ── */}
        {(fmt === 'round_robin' || fmt === 'league_playoff') && (
          <Tabs defaultValue="standings">
            <TabsList className="mb-6 bg-white/70 border border-emerald-100 backdrop-blur-sm">
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
        )}

        {/* ── GROUPS + PLAYOFF: group stage standings + fixtures + stats ── */}
        {fmt === 'groups_playoff' && (
          <Tabs defaultValue="groups">
            <TabsList className="mb-6 bg-white/70 border border-emerald-100 backdrop-blur-sm">
              <TabsTrigger value="groups">Группы</TabsTrigger>
              <TabsTrigger value="fixtures">Матчи</TabsTrigger>
              <TabsTrigger value="stats">Статистика</TabsTrigger>
            </TabsList>
            <TabsContent value="groups">
              {showGroupStandings ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {groups.map(groupName => {
                    const groupTeams = (teams ?? []).filter((t: any) => t.group_name === groupName)
                    const groupFixtures = (fixtures ?? []).filter((f: any) =>
                      groupTeams.some((t: any) => t.id === f.home_team_id || t.id === f.away_team_id)
                    )
                    return (
                      <div key={groupName} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 bg-emerald-600">
                          <p className="font-black text-white text-sm">Группа {groupName}</p>
                        </div>
                        <StandingsTab teams={groupTeams} fixtures={groupFixtures} tournamentName="" />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                  <p className="font-bold text-gray-500">Групповой этап начнётся после старта турнира</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="fixtures">
              <PublicFixturesTab tournament={tournament} teams={teams ?? []} fixtures={fixtures ?? []} />
            </TabsContent>
            <TabsContent value="stats">
              <StatsTab teams={teams ?? []} events={allEvents} />
            </TabsContent>
          </Tabs>
        )}

        {/* ── PLAYOFF: bracket view ── */}
        {fmt === 'playoff' && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-black text-emerald-600">PO</span>
            </div>
            <p className="font-bold text-gray-700 text-lg mb-1">Плей-офф</p>
            <p className="text-sm text-gray-400">{(teams ?? []).length} команд</p>
          </div>
        )}
      </main>
    </div>
  )
}
