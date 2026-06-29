'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { TeamPlayer, MatchLineup } from '@/types'

// ── Plan + ownership helpers ──────────────────────────────────────────────────
async function getOwnerPlan(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournamentId: string,
): Promise<'free' | 'pro' | 'enterprise'> {
  const { data: tournament } = await supabase
    .from('tournaments').select('user_id').eq('id', tournamentId).maybeSingle()
  if (!tournament) return 'free'

  const { data } = await supabase
    .from('profiles').select('plan, plan_expires_at').eq('id', tournament.user_id).maybeSingle()
  if (!data) return 'free'
  if (data.plan === 'enterprise') return 'enterprise'
  if (data.plan === 'pro') {
    if (!data.plan_expires_at || new Date(data.plan_expires_at) > new Date()) return 'pro'
  }
  return 'free'
}

async function canEdit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournamentId: string,
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: t } = await supabase
    .from('tournaments').select('user_id').eq('id', tournamentId).single()
  if (!t) return false
  if (t.user_id === user.id) return true

  const { data: member } = await supabase
    .from('tournament_members')
    .select('role')
    .eq('tournament_id', tournamentId)
    .eq('user_id', user.id)
    .eq('status', 'accepted')
    .eq('role', 'editor')
    .maybeSingle()
  return !!member
}

// Verifies: caller can edit AND owner plan is enterprise. Returns error string or null.
async function guardEnterprise(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournamentId: string,
): Promise<string | null> {
  if (!await canEdit(supabase, tournamentId)) return 'Нет доступа'
  const plan = await getOwnerPlan(supabase, tournamentId)
  if (plan !== 'enterprise') return 'Составы доступны только на тарифе Enterprise'
  return null
}

// ── Roster CRUD ───────────────────────────────────────────────────────────────
export async function getRoster(teamId: string): Promise<TeamPlayer[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('team_players')
    .select('*')
    .eq('team_id', teamId)
    .order('number', { ascending: true, nullsFirst: false })
    .order('created_at')
  return (data ?? []) as TeamPlayer[]
}

export async function addTeamPlayer(
  teamId: string,
  tournamentId: string,
  data: { name: string; number?: number | null; position?: string },
): Promise<{ error?: string; player?: TeamPlayer }> {
  const supabase = await createClient()
  const err = await guardEnterprise(supabase, tournamentId)
  if (err) return { error: err }

  const { data: row, error } = await supabase
    .from('team_players')
    .insert({
      team_id: teamId,
      name: data.name.trim(),
      number: data.number ?? null,
      position: data.position ?? 'other',
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
  return { player: row as TeamPlayer }
}

export async function updateTeamPlayer(
  playerId: string,
  tournamentId: string,
  data: { name?: string; number?: number | null; position?: string; photo_url?: string | null },
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const err = await guardEnterprise(supabase, tournamentId)
  if (err) return { error: err }

  const { error } = await supabase.from('team_players').update(data).eq('id', playerId)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
  return {}
}

export async function removeTeamPlayer(
  playerId: string,
  tournamentId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const err = await guardEnterprise(supabase, tournamentId)
  if (err) return { error: err }

  const { error } = await supabase.from('team_players').delete().eq('id', playerId)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
  return {}
}

// ── Lineups ───────────────────────────────────────────────────────────────────
export async function getFixtureLineup(fixtureId: string): Promise<MatchLineup[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('match_lineups')
    .select('*')
    .eq('fixture_id', fixtureId)
    .order('role')
    .order('slot', { ascending: true, nullsFirst: false })
  return (data ?? []) as MatchLineup[]
}

// Replaces the entire lineup for one team in one fixture.
export async function saveLineup(
  fixtureId: string,
  teamId: string,
  tournamentId: string,
  entries: { playerId: string; role: 'starter' | 'sub'; slot?: number | null }[],
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const err = await guardEnterprise(supabase, tournamentId)
  if (err) return { error: err }

  // Wipe this team's existing lineup for this fixture, then insert fresh
  const { error: delErr } = await supabase
    .from('match_lineups')
    .delete()
    .eq('fixture_id', fixtureId)
    .eq('team_id', teamId)
  if (delErr) return { error: delErr.message }

  if (entries.length > 0) {
    const rows = entries.map((e, i) => ({
      fixture_id: fixtureId,
      team_id: teamId,
      player_id: e.playerId,
      role: e.role,
      slot: e.slot ?? i,
    }))
    const { error: insErr } = await supabase.from('match_lineups').insert(rows)
    if (insErr) return { error: insErr.message }
  }

  revalidatePath(`/dashboard/tournament/${tournamentId}`)
  return {}
}

// Copies a team's lineup from its most recent fixture that has one.
export async function copyLastLineup(
  fixtureId: string,
  teamId: string,
  tournamentId: string,
): Promise<{ error?: string; copied?: number }> {
  const supabase = await createClient()
  const err = await guardEnterprise(supabase, tournamentId)
  if (err) return { error: err }

  // Find most recent lineup for this team in a different fixture
  const { data: prev } = await supabase
    .from('match_lineups')
    .select('player_id, role, slot, fixture_id, created_at')
    .eq('team_id', teamId)
    .neq('fixture_id', fixtureId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!prev || prev.length === 0) return { error: 'Нет предыдущих составов для копирования' }

  // Take entries from the single most recent fixture
  const lastFixtureId = prev[0].fixture_id
  const entries = prev
    .filter(r => r.fixture_id === lastFixtureId)
    .map(r => ({ playerId: r.player_id, role: r.role as 'starter' | 'sub', slot: r.slot }))

  const saveResult = await saveLineup(fixtureId, teamId, tournamentId, entries)
  if (saveResult.error) return { error: saveResult.error }
  return { copied: entries.length }
}
