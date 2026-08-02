'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadTeamLogo(teamId: string, tournamentId: string, base64: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const blob = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
  if (blob.length > 1_048_576) return { error: 'Файл слишком большой (макс. 1 МБ)' }

  const path = `teams/${teamId}.webp`
  const { error: uploadError } = await supabase.storage.from('logos').upload(path, blob, {
    contentType: 'image/webp',
    upsert: true,
  })
  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
  const cacheBusted = `${publicUrl}?v=${Date.now()}`

  await supabase.from('teams').update({ logo_url: cacheBusted }).eq('id', teamId)
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
}

export async function removeTeamLogo(teamId: string, tournamentId: string) {
  const supabase = await createClient()
  const path = `teams/${teamId}.webp`
  await supabase.storage.from('logos').remove([path])
  await supabase.from('teams').update({ logo_url: null }).eq('id', teamId)
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
}

export async function uploadTournamentLogo(tournamentId: string, base64: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const blob = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
  if (blob.length > 1_048_576) return { error: 'Файл слишком большой (макс. 1 МБ)' }

  const path = `tournaments/${tournamentId}.webp`
  const { error: uploadError } = await supabase.storage.from('logos').upload(path, blob, {
    contentType: 'image/webp',
    upsert: true,
  })
  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
  const cacheBusted = `${publicUrl}?v=${Date.now()}`

  await supabase.from('tournaments').update({ logo_url: cacheBusted }).eq('id', tournamentId)
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
}

export async function removeTournamentLogo(tournamentId: string) {
  const supabase = await createClient()
  const path = `tournaments/${tournamentId}.webp`
  await supabase.storage.from('logos').remove([path])
  await supabase.from('tournaments').update({ logo_url: null }).eq('id', tournamentId)
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
}

export async function uploadLeagueLogo(leagueId: string, base64: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const blob = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
  if (blob.length > 1_048_576) return { error: 'Файл слишком большой (макс. 1 МБ)' }

  const path = `leagues/${leagueId}.webp`
  const { error: uploadError } = await supabase.storage.from('logos').upload(path, blob, {
    contentType: 'image/webp',
    upsert: true,
  })
  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
  const cacheBusted = `${publicUrl}?v=${Date.now()}`

  await supabase.from('leagues').update({ logo_url: cacheBusted }).eq('id', leagueId)
  revalidateLeague(leagueId)
}

export async function removeLeagueLogo(leagueId: string) {
  const supabase = await createClient()
  const path = `leagues/${leagueId}.webp`
  await supabase.storage.from('logos').remove([path])
  await supabase.from('leagues').update({ logo_url: null }).eq('id', leagueId)
  revalidateLeague(leagueId)
}

// ── Championship cover ────────────────────────────────────────────────────────
// Mirrors the tournament cover: either an uploaded 1440×480 banner or a
// "theme:<id>" gradient preset. Writes fail loudly (toast) if migration 049
// isn't applied yet — silently swallowing them would look like a saved cover.

export async function uploadLeagueCover(leagueId: string, base64: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const blob = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
  if (blob.length > 5_242_880) return { error: 'Файл слишком большой (макс. 5 МБ)' }

  const path = `covers/league-${leagueId}.webp`
  const { error: uploadError } = await supabase.storage.from('logos').upload(path, blob, {
    contentType: 'image/webp',
    upsert: true,
  })
  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
  const url = `${publicUrl}?v=${Date.now()}`
  const { error } = await supabase.from('leagues').update({ cover_url: url }).eq('id', leagueId)
  if (error) return { error: error.message }
  revalidateLeague(leagueId)
  return { url }
}

export async function removeLeagueCover(leagueId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const path = `covers/league-${leagueId}.webp`
  await supabase.storage.from('logos').remove([path])
  const { error } = await supabase.from('leagues').update({ cover_url: null }).eq('id', leagueId)
  if (error) return { error: error.message }
  revalidateLeague(leagueId)
  return {}
}

export async function setLeagueCoverTheme(leagueId: string, themeId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }
  const value = themeId ? `theme:${themeId}` : null
  const { error } = await supabase.from('leagues').update({ cover_url: value }).eq('id', leagueId)
  if (error) return { error: error.message }
  revalidateLeague(leagueId)
}

// A championship shows its branding on the overview and on the settings page,
// so both need refreshing after a logo/cover change.
function revalidateLeague(leagueId: string) {
  revalidatePath(`/dashboard/leagues/${leagueId}`)
  revalidatePath(`/dashboard/leagues/${leagueId}/settings`)
}

export async function uploadPlayerPhoto(playerId: string, base64: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const blob = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
  if (blob.length > 1_048_576) return { error: 'Файл слишком большой (макс. 1 МБ)' }

  const path = `players/${playerId}.webp`
  const { error: uploadError } = await supabase.storage.from('logos').upload(path, blob, {
    contentType: 'image/webp',
    upsert: true,
  })
  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
  const url = `${publicUrl}?v=${Date.now()}`
  await supabase.from('players').update({ photo_url: url }).eq('id', playerId)
  return { url }
}

export async function uploadTournamentCover(tournamentId: string, base64: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const blob = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
  if (blob.length > 5_242_880) return { error: 'Файл слишком большой (макс. 5 МБ)' }

  const path = `covers/${tournamentId}.webp`
  const { error: uploadError } = await supabase.storage.from('logos').upload(path, blob, {
    contentType: 'image/webp',
    upsert: true,
  })
  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
  const url = `${publicUrl}?v=${Date.now()}`
  await supabase.from('tournaments').update({ cover_url: url }).eq('id', tournamentId)
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
  return { url }
}

export async function removeTournamentCover(tournamentId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const path = `covers/${tournamentId}.webp`
  await supabase.storage.from('logos').remove([path])
  await supabase.from('tournaments').update({ cover_url: null }).eq('id', tournamentId)
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
  return {}
}

export async function setTournamentCoverTheme(tournamentId: string, themeId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }
  const value = themeId ? `theme:${themeId}` : null
  await supabase.from('tournaments').update({ cover_url: value }).eq('id', tournamentId)
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
}
