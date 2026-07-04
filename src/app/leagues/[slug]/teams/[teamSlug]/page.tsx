import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSportTheme } from '@/lib/sports'
import TeamProfileView from './TeamProfileView'

type Lang = 'ru' | 'kz' | 'en'
async function getLang(): Promise<Lang> {
  const v = (await cookies()).get('lang')?.value
  return v === 'kz' || v === 'en' ? v : 'ru'
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; teamSlug: string }> }): Promise<Metadata> {
  const supabase = await createClient()
  const { slug, teamSlug } = await params
  const { data: t } = await supabase
    .from('league_teams')
    .select('name, leagues!inner(slug)')
    .eq('slug', teamSlug)
    .eq('leagues.slug', slug)
    .maybeSingle()
  return { title: t ? `${t.name} — профиль команды` : 'Команда не найдена' }
}

type SeasonRecord = { seasonName: string; position: number | null; GP: number; W: number; D: number; L: number; Pts: number }
type MatchLite = { id: string; opponent: string; isHome: boolean; homeScore: number | null; awayScore: number | null; played: boolean; scheduledAt: string | null; seasonName: string }

export default async function TeamProfilePage({ params }: { params: Promise<{ slug: string; teamSlug: string }> }) {
  const supabase = await createClient()
  const { slug, teamSlug } = await params
  const lang = await getLang()

  const [{ data: teamRaw }, { data: { user } }] = await Promise.all([
    supabase
      .from('league_teams')
      .select('*, leagues!inner(id, name, slug, sport, owner_id), players(*)')
      .eq('slug', teamSlug)
      .eq('leagues.slug', slug)
      .maybeSingle(),
    supabase.auth.getUser(),
  ])

  if (!teamRaw) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const team = teamRaw as any
  const league = team.leagues
  const isOwner = !!user && user.id === league.owner_id
  const players = (team.players ?? []) as { id: string; name: string; number: number | null; position: string | null; photo_url: string | null }[]

  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, name, status, tournament_id')
    .eq('league_id', league.id)
    .order('created_at', { ascending: false })

  const history: SeasonRecord[] = []
  const matches: MatchLite[] = []

  for (const season of seasons ?? []) {
    if (!season.tournament_id) continue
    const [{ data: tourn }, { data: teamsData }, { data: fixturesData }] = await Promise.all([
      supabase.from('tournaments').select('points_win,points_draw,points_loss').eq('id', season.tournament_id).maybeSingle(),
      supabase.from('teams').select('id,name').eq('tournament_id', season.tournament_id),
      supabase.from('fixtures').select('*').eq('tournament_id', season.tournament_id).eq('is_bye', false).order('matchday'),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchingTeam = (teamsData ?? []).find((t: any) => t.name.toLowerCase() === team.name.toLowerCase())
    if (!matchingTeam) continue
    const nameById = new Map((teamsData ?? []).map((t: { id: string; name: string }) => [t.id, t.name]))

    const pw = tourn?.points_win ?? 3, pd = tourn?.points_draw ?? 1, pl = tourn?.points_loss ?? 0
    const map = new Map<string, { GP: number; W: number; D: number; L: number; GF: number; GA: number; Pts: number }>()
    for (const t of teamsData ?? []) map.set(t.id, { GP: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 })

    for (const f of fixturesData ?? []) {
      // Collect this team's matches (results + upcoming)
      const involvesHome = f.home_team_id === matchingTeam.id
      const involvesAway = f.away_team_id === matchingTeam.id
      if (involvesHome || involvesAway) {
        const oppId = involvesHome ? f.away_team_id : f.home_team_id
        matches.push({
          id: f.id, opponent: nameById.get(oppId) ?? '—', isHome: involvesHome,
          homeScore: f.home_score, awayScore: f.away_score, played: f.played,
          scheduledAt: (f as { scheduled_at?: string | null }).scheduled_at ?? null, seasonName: season.name,
        })
      }
      // Standings accumulation (played only)
      if (!f.played || f.home_score == null || f.away_score == null) continue
      const home = map.get(f.home_team_id); const away = map.get(f.away_team_id)
      const hs = f.home_score, as = f.away_score
      if (home) { home.GP++; home.GF += hs; home.GA += as; if (hs > as) { home.W++; home.Pts += pw } else if (hs === as) { home.D++; home.Pts += pd } else { home.L++; home.Pts += pl } }
      if (away) { away.GP++; away.GF += as; away.GA += hs; if (as > hs) { away.W++; away.Pts += pw } else if (as === hs) { away.D++; away.Pts += pd } else { away.L++; away.Pts += pl } }
    }

    const sorted = [...map.entries()].sort(([, a], [, b]) => b.Pts - a.Pts)
    const position = sorted.findIndex(([id]) => id === matchingTeam.id) + 1
    const stats = map.get(matchingTeam.id)!
    history.push({ seasonName: season.name, position: position || null, ...stats })
  }

  const brand = getSportTheme(league.sport).primary

  return (
    <TeamProfileView
      slug={slug}
      leagueId={league.id}
      leagueName={league.name}
      teamId={team.id}
      teamName={team.name}
      city={team.city ?? null}
      sport={league.sport ?? null}
      brand={brand}
      players={players}
      history={history}
      matches={matches}
      lang={lang}
      isOwner={isOwner}
    />
  )
}
