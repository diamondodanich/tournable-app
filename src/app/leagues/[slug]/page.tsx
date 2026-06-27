import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { MapPin, Users, Trophy, ChevronRight } from 'lucide-react'
import type { Team, Fixture } from '@/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tournable.app'

const SPORT_LABELS: Record<string, string> = {
  football: 'Футбол', futsal: 'Футзал', efootball: 'Киберфутбол',
  basketball: 'Баскетбол', streetball: 'Стритбол', ebasketball: 'Кибербаскетбол',
  volleyball: 'Волейбол', beach_volleyball: 'Пляжный волейбол',
  hockey: 'Хоккей', other: 'Другое',
}

type StandingRow = { teamId: string; name: string; GP: number; W: number; D: number; L: number; GF: number; GA: number; GD: number; Pts: number }

function computeStandings(teams: Team[], fixtures: Fixture[], pw = 3, pd = 1, pl = 0): StandingRow[] {
  const map = new Map<string, StandingRow>()
  for (const t of teams) map.set(t.id, { teamId: t.id, name: t.name, GP: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 })
  for (const f of fixtures) {
    if (!f.played || f.is_bye || f.home_score == null || f.away_score == null) continue
    const home = map.get(f.home_team_id ?? '')
    const away = map.get(f.away_team_id ?? '')
    const hs = f.home_score, as = f.away_score
    if (home) { home.GP++; home.GF += hs; home.GA += as; home.GD += hs - as; if (hs > as) { home.W++; home.Pts += pw } else if (hs === as) { home.D++; home.Pts += pd } else { home.L++; home.Pts += pl } }
    if (away) { away.GP++; away.GF += as; away.GA += hs; away.GD += as - hs; if (as > hs) { away.W++; away.Pts += pw } else if (as === hs) { away.D++; away.Pts += pd } else { away.L++; away.Pts += pl } }
  }
  return [...map.values()].sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF)
}

type ScorerRow = { name: string; teamName: string; goals: number }

function computeScorers(events: { player_name: string; team_id: string; type: string }[], teams: Team[]): ScorerRow[] {
  const map = new Map<string, ScorerRow>()
  for (const e of events) {
    if (e.type !== 'goal') continue
    const teamName = teams.find(t => t.id === e.team_id)?.name ?? '—'
    const key = `${e.player_name}||${e.team_id}`
    const existing = map.get(key) ?? { name: e.player_name, teamName, goals: 0 }
    existing.goals++
    map.set(key, existing)
  }
  return [...map.values()].sort((a, b) => b.goals - a.goals).slice(0, 30)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const supabase = await createClient()
  const { slug } = await params
  const { data: l } = await supabase.from('leagues').select('name, description, sport, city, meta_title, meta_description').eq('slug', slug).eq('is_public', true).maybeSingle()
  if (!l) return { title: 'Лига не найдена' }
  const sport = l.sport ? SPORT_LABELS[l.sport] : null
  const title = l.meta_title ?? `${l.name}${sport ? ` — ${sport}` : ''}${l.city ? ` (${l.city})` : ''}`
  const description = l.meta_description ?? l.description ?? `Турнирная таблица, команды и история сезонов — ${l.name}.`
  return {
    title, description,
    openGraph: { title, description, type: 'website', url: `${APP_URL}/leagues/${slug}` },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function LeaguePublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string; season?: string }>
}) {
  const supabase = await createClient()
  const { slug } = await params
  const { tab = 'table', season: seasonParam } = await searchParams

  const { data: league } = await supabase
    .from('leagues').select('*').eq('slug', slug).eq('is_public', true).maybeSingle()
  if (!league) notFound()

  const [{ data: seasonsRaw }, { data: leagueTeamsRaw }] = await Promise.all([
    supabase.from('seasons').select('*').eq('league_id', league.id).order('created_at', { ascending: false }),
    supabase.from('league_teams').select('*').eq('league_id', league.id).order('name'),
  ])

  const allSeasons = (seasonsRaw ?? []) as { id: string; name: string; status: string; tournament_id: string | null }[]
  const leagueTeams = (leagueTeamsRaw ?? []) as { id: string; name: string; slug: string; city: string | null }[]

  const activeSeasons = allSeasons.filter(s => s.status === 'active')
  const selectedSeason = seasonParam
    ? allSeasons.find(s => s.id === seasonParam)
    : (activeSeasons[0] ?? allSeasons[0])

  const tournamentId = selectedSeason?.tournament_id ?? null

  // Fetch tournament data only when needed
  let standings: StandingRow[] = []
  let scorers: ScorerRow[] = []
  let recentFixtures: (Fixture & { home_team: Team | null; away_team: Team | null })[] = []
  let upcomingFixtures: (Fixture & { home_team: Team | null; away_team: Team | null })[] = []
  let tournamentTeams: Team[] = []

  if (tournamentId) {
    const [
      { data: tournamentData },
      { data: teamData },
      { data: fixtureData },
    ] = await Promise.all([
      supabase.from('tournaments').select('points_win,points_draw,points_loss').eq('id', tournamentId).maybeSingle(),
      supabase.from('teams').select('*').eq('tournament_id', tournamentId),
      supabase.from('fixtures').select('*, home_team:teams!home_team_id(id,name,logo_url), away_team:teams!away_team_id(id,name,logo_url)').eq('tournament_id', tournamentId).eq('is_bye', false).order('matchday'),
    ])

    tournamentTeams = (teamData ?? []) as Team[]
    const fixtures = (fixtureData ?? []) as (Fixture & { home_team: Team | null; away_team: Team | null })[]

    standings = computeStandings(tournamentTeams, fixtures, tournamentData?.points_win ?? 3, tournamentData?.points_draw ?? 1, tournamentData?.points_loss ?? 0)

    const played = fixtures.filter(f => f.played)
    const upcoming = fixtures.filter(f => !f.played)
    recentFixtures = played.slice(-5).reverse()
    upcomingFixtures = upcoming.slice(0, 5)

    if (tab === 'scorers') {
      const { data: fixtureIds } = await supabase.from('fixtures').select('id').eq('tournament_id', tournamentId)
      const fids = (fixtureIds ?? []).map((f: any) => f.id as string)
      if (fids.length > 0) {
        const { data: eventsData } = await supabase
          .from('match_events').select('player_name,team_id,type').in('fixture_id', fids)
        scorers = computeScorers((eventsData ?? []) as any[], tournamentTeams)
      }
    }
  }

  const sport = league.sport ? SPORT_LABELS[league.sport] : null
  const tabUrl = (t: string) => `?tab=${t}${selectedSeason ? `&season=${selectedSeason.id}` : ''}`

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white">

      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-2xl font-black text-purple-300 shrink-0">
              {league.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black leading-tight">{league.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {sport && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-900/50 text-purple-300 border border-purple-500/30">{sport}</span>}
                {league.city && <span className="flex items-center gap-1 text-xs text-white/40"><MapPin size={10} /> {league.city}</span>}
                <span className="flex items-center gap-1 text-xs text-white/40"><Users size={10} /> {leagueTeams.length} команд</span>
                <span className="flex items-center gap-1 text-xs text-white/40"><Trophy size={10} /> {allSeasons.length} сезонов</span>
              </div>
              {league.description && <p className="text-sm text-white/50 mt-2 max-w-xl">{league.description}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Season selector */}
      {allSeasons.length > 1 && (
        <div className="border-b border-white/10 bg-white/[0.02]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-white/30 shrink-0 mr-1">Сезон:</span>
            {allSeasons.map(s => (
              <Link key={s.id} href={`?tab=${tab}&season=${s.id}`}
                className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${s.id === selectedSeason?.id ? 'bg-purple-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
                {s.name}
                {s.status === 'active' && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 align-middle" />}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-1">
          {[['table','Таблица'],['matches','Матчи'],['teams','Команды'],['scorers','Бомбардиры']].map(([id, label]) => (
            <Link key={id} href={tabUrl(id)}
              className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${tab === id ? 'border-purple-500 text-purple-400' : 'border-transparent text-white/40 hover:text-white/70'}`}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {tab === 'table' && (
          standings.length === 0
            ? <p className="text-center py-12 text-white/30">{tournamentId ? 'Матчи ещё не сыграны' : 'Турнир для этого сезона не привязан'}</p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-white/30 text-xs">
                    <th className="text-left py-2 pl-4 w-8">#</th>
                    <th className="text-left py-2">Команда</th>
                    <th className="text-center py-2 px-2">И</th>
                    <th className="text-center py-2 px-2">В</th>
                    <th className="text-center py-2 px-2">Н</th>
                    <th className="text-center py-2 px-2">П</th>
                    <th className="text-center py-2 px-2">Мячи</th>
                    <th className="text-center py-2 px-2">+/-</th>
                    <th className="text-center py-2 px-3 text-purple-400">О</th>
                  </tr></thead>
                  <tbody>
                    {standings.map((row, i) => (
                      <tr key={row.teamId} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                        <td className="py-3 pl-4 text-white/30 text-xs">{i + 1}</td>
                        <td className="py-3 font-bold text-white/90">{row.name}</td>
                        <td className="py-3 px-2 text-center text-white/50">{row.GP}</td>
                        <td className="py-3 px-2 text-center text-emerald-400 font-bold">{row.W}</td>
                        <td className="py-3 px-2 text-center text-white/50">{row.D}</td>
                        <td className="py-3 px-2 text-center text-red-400">{row.L}</td>
                        <td className="py-3 px-2 text-center text-white/50">{row.GF}:{row.GA}</td>
                        <td className={`py-3 px-2 text-center text-sm font-bold ${row.GD > 0 ? 'text-emerald-400' : row.GD < 0 ? 'text-red-400' : 'text-white/40'}`}>{row.GD > 0 ? `+${row.GD}` : row.GD}</td>
                        <td className="py-3 px-3 text-center font-black text-white">{row.Pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        )}

        {tab === 'matches' && (
          <div className="space-y-6">
            {upcomingFixtures.length > 0 && (
              <div>
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Предстоящие</p>
                <div className="space-y-1">{upcomingFixtures.map(f => <FixtureRow key={f.id} fixture={f} />)}</div>
              </div>
            )}
            {recentFixtures.length > 0 && (
              <div>
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Результаты</p>
                <div className="space-y-1">{recentFixtures.map(f => <FixtureRow key={f.id} fixture={f} played />)}</div>
              </div>
            )}
            {upcomingFixtures.length === 0 && recentFixtures.length === 0 && (
              <p className="text-center py-12 text-white/30">Матчей пока нет</p>
            )}
            {tournamentId && (
              <div className="text-center pt-2">
                <Link href={`/t/${tournamentId}`} target="_blank" className="text-sm text-purple-400 hover:text-purple-300 font-medium">
                  Все матчи турнира →
                </Link>
              </div>
            )}
          </div>
        )}

        {tab === 'teams' && (
          leagueTeams.length === 0
            ? <p className="text-center py-12 text-white/30">Команды ещё не добавлены</p>
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {leagueTeams.map(t => (
                  <Link key={t.id} href={`/leagues/${slug}/teams/${t.slug}`}>
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 hover:border-purple-500/30 rounded-xl px-4 py-3 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-purple-900/50 flex items-center justify-center text-sm font-black text-purple-300 shrink-0">
                        {t.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white truncate">{t.name}</p>
                        {t.city && <p className="text-xs text-white/40 mt-0.5">{t.city}</p>}
                      </div>
                      <ChevronRight size={14} className="text-white/20" />
                    </div>
                  </Link>
                ))}
              </div>
            )
        )}

        {tab === 'scorers' && (
          scorers.length === 0
            ? <p className="text-center py-12 text-white/30">{tournamentId ? 'Голов ещё нет' : 'Турнир не привязан'}</p>
            : (
              <table className="w-full text-sm">
                <thead><tr className="text-white/30 text-xs">
                  <th className="text-left py-2 pl-4 w-8">#</th>
                  <th className="text-left py-2">Игрок</th>
                  <th className="text-left py-2 text-white/40">Команда</th>
                  <th className="text-center py-2 px-4 text-purple-400 font-black">Голы</th>
                </tr></thead>
                <tbody>
                  {scorers.map((s, i) => (
                    <tr key={`${s.name}-${i}`} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                      <td className="py-3 pl-4 text-white/30 text-xs">{i + 1}</td>
                      <td className="py-3 font-bold text-white/90">{s.name}</td>
                      <td className="py-3 text-white/40 text-xs">{s.teamName}</td>
                      <td className="py-3 px-4 text-center font-black text-white">{s.goals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 mt-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <Link href="/" className="text-xs text-white/20 hover:text-white/40 font-black tracking-wider">TOURNABLE</Link>
          <Link href="/register" className="text-xs text-purple-400 hover:text-purple-300 font-medium">Создать свою лигу →</Link>
        </div>
      </div>
    </div>
  )
}

function FixtureRow({ fixture, played = false }: { fixture: Fixture & { home_team: Team | null; away_team: Team | null }; played?: boolean }) {
  const home = fixture.home_team
  const away = fixture.away_team
  if (!home || !away) return null
  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 text-sm">
      <span className="flex-1 text-right font-bold text-white/80 truncate">{home.name}</span>
      {played
        ? <span className="shrink-0 text-sm font-black text-white px-3 py-1 bg-white/10 rounded-lg min-w-[64px] text-center">{fixture.home_score} : {fixture.away_score}</span>
        : <span className="shrink-0 text-xs font-bold text-white/30 px-2">vs</span>
      }
      <span className="flex-1 text-left font-bold text-white/80 truncate">{away.name}</span>
    </div>
  )
}
