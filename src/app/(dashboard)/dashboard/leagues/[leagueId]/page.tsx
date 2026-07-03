import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { getUserPlan } from '@/app/actions/billing'
import ChampionshipView from './ChampionshipView'
import type { League, Season, LeagueTeam, Player } from '@/types'

export const dynamic = 'force-dynamic'

type Lang = 'ru' | 'kz' | 'en'

export default async function LeagueManagePage({
  params,
}: {
  params: Promise<{ leagueId: string }>
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

  const [
    { data: leagueRaw },
    { data: seasonsRaw },
    { data: teamsRaw },
  ] = await Promise.all([
    supabase.from('leagues').select('*').eq('id', leagueId).eq('owner_id', user.id).maybeSingle(),
    supabase.from('seasons').select('*').eq('league_id', leagueId).order('created_at', { ascending: false }),
    supabase.from('league_teams').select('*, players(*)').eq('league_id', leagueId).order('name'),
  ])

  if (!leagueRaw) notFound()

  const league = leagueRaw as League
  const seasons = (seasonsRaw ?? []) as Season[]
  const teams = (teamsRaw ?? []) as (LeagueTeam & { players: Player[] })[]

  return (
    <ChampionshipView
      league={league}
      seasons={seasons}
      teams={teams}
      lang={lang}
      publicPath={league.is_public ? `/leagues/${league.slug}` : null}
    />
  )
}
