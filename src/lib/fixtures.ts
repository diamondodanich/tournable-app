import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Marks a fixture finished, stamping `played_at` — the only record of when a
 * match was actually played (`scheduled_at` is a plan, `created_at` belongs to
 * the fixture, not the result). It feeds SportsEvent.startDate in the public
 * pages and the `matches_played_7d` metric.
 *
 * The column arrives with migration 046. Deploys are automatic while migrations
 * are applied by hand in the Supabase editor, so between the two the column may
 * not exist yet — PostgREST answers PGRST204 / 42703 and we retry without it
 * rather than break result entry on a live site. The fallback can be dropped
 * once 046 has been applied.
 */
export async function updateFixtureResult(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  fixtureId: string,
  patch: Record<string, unknown>,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('fixtures')
    .update({ ...patch, played_at: new Date().toISOString() })
    .eq('id', fixtureId)

  if (!error) return {}

  const missingColumn = error.code === 'PGRST204' || error.code === '42703'
    || /played_at/.test(error.message ?? '')
  if (!missingColumn) return { error: error.message }

  const { error: retryError } = await supabase.from('fixtures').update(patch).eq('id', fixtureId)
  return retryError ? { error: retryError.message } : {}
}
