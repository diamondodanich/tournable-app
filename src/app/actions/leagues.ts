'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ─── Slug generation (same transliteration as tournaments) ────────────────────
const CYRILLIC: Record<string, string> = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',
  к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
  х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  ә:'a',ғ:'g',қ:'k',ң:'n',ө:'o',ұ:'u',ү:'u',һ:'h',і:'i',
}

function toSlug(name: string, id: string): string {
  const base = name
    .toLowerCase()
    .split('')
    .map(c => CYRILLIC[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
  return `${base}-${id.slice(0, 6)}`
}

function teamSlug(name: string): string {
  return name
    .toLowerCase()
    .split('')
    .map(c => CYRILLIC[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

async function requireEnterprise() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован', supabase: null, userId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.plan !== 'enterprise') return { error: 'Требуется Enterprise', supabase: null, userId: null }
  return { error: null, supabase, userId: user.id }
}

// ── League CRUD ───────────────────────────────────────────────────────────────

export async function createLeague(formData: FormData): Promise<{ error?: string }> {
  const { error: authErr, supabase, userId } = await requireEnterprise()
  if (authErr || !supabase || !userId) return { error: authErr ?? 'Ошибка авторизации' }

  const name = (formData.get('name') as string ?? '').trim()
  const sport = (formData.get('sport') as string ?? '') || null
  const city = (formData.get('city') as string ?? '').trim() || null
  const description = (formData.get('description') as string ?? '').trim() || null

  if (!name) return { error: 'Введите название лиги' }

  const id = crypto.randomUUID()
  const slug = toSlug(name, id)

  const { error } = await supabase.from('leagues').insert({
    id,
    owner_id: userId,
    name,
    slug,
    sport,
    city,
    description,
    is_public: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/leagues')
  redirect(`/dashboard/leagues/${id}`)
}

export async function updateLeague(
  leagueId: string,
  data: { name?: string; sport?: string | null; city?: string | null; description?: string | null; is_public?: boolean; meta_title?: string | null; meta_description?: string | null }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { error } = await supabase
    .from('leagues')
    .update(data)
    .eq('id', leagueId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return {}
}

export async function deleteLeague(leagueId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('leagues').delete().eq('id', leagueId).eq('owner_id', user.id)
  revalidatePath('/dashboard/leagues')
  redirect('/dashboard/leagues')
}

// ── Seasons ───────────────────────────────────────────────────────────────────

export async function addSeason(
  leagueId: string,
  name: string,
  tournamentId: string | null
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: league } = await supabase.from('leagues').select('owner_id').eq('id', leagueId).single()
  if (!league || league.owner_id !== user.id) return { error: 'Нет доступа' }

  const { error } = await supabase.from('seasons').insert({
    league_id: leagueId,
    tournament_id: tournamentId || null,
    name: name.trim(),
    status: 'active',
  })

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return {}
}

export async function updateSeason(
  seasonId: string,
  leagueId: string,
  data: { name?: string; status?: 'active' | 'finished'; tournament_id?: string | null; start_date?: string | null; end_date?: string | null }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: league } = await supabase.from('leagues').select('owner_id').eq('id', leagueId).single()
  if (!league || league.owner_id !== user.id) return { error: 'Нет доступа' }

  const { error } = await supabase.from('seasons').update(data).eq('id', seasonId)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return {}
}

export async function removeSeason(seasonId: string, leagueId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: league } = await supabase.from('leagues').select('owner_id').eq('id', leagueId).single()
  if (!league || league.owner_id !== user.id) return { error: 'Нет доступа' }

  await supabase.from('seasons').delete().eq('id', seasonId)
  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return {}
}

// ── League teams ──────────────────────────────────────────────────────────────

export async function addLeagueTeam(
  leagueId: string,
  name: string,
  city?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: league } = await supabase.from('leagues').select('owner_id').eq('id', leagueId).single()
  if (!league || league.owner_id !== user.id) return { error: 'Нет доступа' }

  const slug = teamSlug(name) || name.slice(0, 20).toLowerCase()

  const { error } = await supabase.from('league_teams').insert({
    league_id: leagueId,
    name: name.trim(),
    slug,
    city: city?.trim() || null,
  })

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return {}
}

export async function removeLeagueTeam(teamId: string, leagueId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: league } = await supabase.from('leagues').select('owner_id').eq('id', leagueId).single()
  if (!league || league.owner_id !== user.id) return { error: 'Нет доступа' }

  await supabase.from('league_teams').delete().eq('id', teamId)
  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return {}
}

// ── Players ───────────────────────────────────────────────────────────────────

export async function addPlayer(
  leagueTeamId: string,
  leagueId: string,
  data: { name: string; number?: number | null; position?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: league } = await supabase.from('leagues').select('owner_id').eq('id', leagueId).single()
  if (!league || league.owner_id !== user.id) return { error: 'Нет доступа' }

  const { error } = await supabase.from('players').insert({
    league_team_id: leagueTeamId,
    name: data.name.trim(),
    number: data.number ?? null,
    position: data.position ?? 'other',
  })

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return {}
}

export async function removePlayer(playerId: string, leagueId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: league } = await supabase.from('leagues').select('owner_id').eq('id', leagueId).single()
  if (!league || league.owner_id !== user.id) return { error: 'Нет доступа' }

  await supabase.from('players').delete().eq('id', playerId)
  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return {}
}
