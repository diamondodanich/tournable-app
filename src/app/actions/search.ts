'use server'

import { createClient } from '@/lib/supabase/server'

export type SearchResult = {
  type: 'team' | 'champTeam' | 'player'
  label: string
  sub: string
  href: string
}

// Search the current user's own tournaments and championships for a team or player.
export async function searchDashboard(query: string): Promise<SearchResult[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const like = `%${q}%`
  const qLower = q.toLowerCase()

  const [{ data: tours }, { data: leagues }] = await Promise.all([
    supabase.from('tournaments').select('id, name').eq('user_id', user.id).is('deleted_at', null),
    supabase.from('leagues').select('id, name, slug').eq('owner_id', user.id),
  ])
  const tourName = new Map((tours ?? []).map(t => [t.id, t.name]))
  const tourIds = (tours ?? []).map(t => t.id)
  const leagueIds = (leagues ?? []).map(l => l.id)
  const leagueName = new Map((leagues ?? []).map(l => [l.id, l.name]))
  const leagueSlug = new Map((leagues ?? []).map(l => [l.id, l.slug]))

  // All championship teams (for team matches + player team labels)
  const { data: champTeams } = leagueIds.length
    ? await supabase.from('league_teams').select('id, name, slug, league_id').in('league_id', leagueIds)
    : { data: [] as { id: string; name: string; slug: string; league_id: string }[] }
  const champTeamById = new Map((champTeams ?? []).map(t => [t.id, t]))
  const champTeamIds = (champTeams ?? []).map(t => t.id)

  const [{ data: tourneyTeams }, { data: players }] = await Promise.all([
    tourIds.length
      ? supabase.from('teams').select('name, tournament_id').in('tournament_id', tourIds).ilike('name', like).limit(6)
      : Promise.resolve({ data: [] as { name: string; tournament_id: string }[] }),
    champTeamIds.length
      ? supabase.from('players').select('id, name, league_team_id').in('league_team_id', champTeamIds).ilike('name', like).limit(8)
      : Promise.resolve({ data: [] as { id: string; name: string; league_team_id: string }[] }),
  ])

  const results: SearchResult[] = []

  // Championship teams (name match)
  for (const t of champTeams ?? []) {
    if (t.name.toLowerCase().includes(qLower)) {
      results.push({
        type: 'champTeam',
        label: t.name,
        sub: leagueName.get(t.league_id) ?? '',
        href: `/dashboard/leagues/${t.league_id}?view=all`,
      })
    }
    if (results.filter(r => r.type === 'champTeam').length >= 6) break
  }

  // Standalone tournament teams
  for (const t of tourneyTeams ?? []) {
    results.push({
      type: 'team',
      label: t.name,
      sub: tourName.get(t.tournament_id) ?? '',
      href: `/dashboard/tournament/${t.tournament_id}`,
    })
  }

  // Players (public profile with career stats)
  for (const p of players ?? []) {
    const team = champTeamById.get(p.league_team_id)
    const slug = team ? leagueSlug.get(team.league_id) : undefined
    if (!team || !slug) continue
    results.push({
      type: 'player',
      label: p.name,
      sub: `${team.name} · ${leagueName.get(team.league_id) ?? ''}`,
      href: `/leagues/${slug}/players/${p.id}`,
    })
  }

  return results.slice(0, 16)
}
