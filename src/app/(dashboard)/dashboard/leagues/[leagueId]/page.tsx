import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { getUserPlan } from '@/app/actions/billing'
import ChampionshipAllSeasons from './ChampionshipAllSeasons'
import type { League, LeagueTeam, Player } from '@/types'

export const dynamic = 'force-dynamic'

type Lang = 'ru' | 'kz' | 'en'

function tableTab(format: string | null): string {
  if (format === 'groups_playoff') return 'group-standings'
  if (format === 'playoff') return 'playoff'
  return 'standings'
}

export default async function LeagueManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueId: string }>
  searchParams: Promise<{ view?: string }>
}) {
  const plan = await getUserPlan()
  if (plan !== 'enterprise') redirect('/dashboard')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const langRaw = cookieStore.get('lang')?.value ?? 'ru'
  const lang: Lang = (['ru', 'kz', 'en'] as Lang[]).includes(langRaw as Lang) ? (langRaw as Lang) : 'ru'

  const { leagueId } = await params
  const { view } = await searchParams

  const [{ data: leagueRaw }, { data: seasonsRaw }, { data: teamsRaw }] = await Promise.all([
    supabase.from('leagues').select('*').eq('id', leagueId).eq('owner_id', user.id).maybeSingle(),
    supabase.from('seasons').select('id, name, status, tournament_id, tournaments(format)').eq('league_id', leagueId).order('created_at', { ascending: false }),
    supabase.from('league_teams').select('*, players(*)').eq('league_id', leagueId).order('name'),
  ])

  if (!leagueRaw) notFound()
  const league = leagueRaw as League

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seasons = ((seasonsRaw ?? []) as any[]).map(s => ({
    id: s.id, name: s.name, status: s.status, tournament_id: s.tournament_id,
    format: s.tournaments?.format ?? null,
  }))

  // Default: land straight on the current season's table (Flashscore model), unless
  // the user explicitly asked for the all-seasons overview.
  if (view !== 'all') {
    const current = seasons.find(s => s.status === 'active' && s.tournament_id)
      ?? seasons.find(s => s.tournament_id)
    if (current?.tournament_id) {
      redirect(`/dashboard/tournament/${current.tournament_id}?tab=${tableTab(current.format)}`)
    }
  }

  const teams = (teamsRaw ?? []) as (LeagueTeam & { players: Player[] })[]
  const teamsCount = teams.length
  const playersCount = teams.reduce((sum, t) => sum + (t.players?.length ?? 0), 0)

  return (
    <ChampionshipAllSeasons
      league={{ id: league.id, name: league.name, slug: league.slug, sport: league.sport, logo_url: league.logo_url }}
      seasons={seasons}
      teams={teams}
      teamsCount={teamsCount}
      playersCount={playersCount}
      lang={lang}
      isOwner
    />
  )
}
