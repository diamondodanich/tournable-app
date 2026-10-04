import { revalidatePath as nextRevalidatePath } from 'next/cache'

// Public tournament, team, player and match pages are cached (ISR) and read
// with the cookie-free client, so nothing about an edit reaches them by itself.
// Every dashboard mutation already revalidates its dashboard path through this
// wrapper; when that path belongs to a tournament or championship, the public
// twins in all three languages are purged too, so spectators see a new result
// right away instead of after the revalidate window.
const PUBLIC_PAGES = [
  '/t/[id]',
  '/leagues/[slug]/teams/[teamSlug]',
  '/leagues/[slug]/players/[playerId]',
  '/leagues/[slug]/matches/[matchId]',
].flatMap(p => [p, `/kz${p}`, `/en${p}`])

const AFFECTS_PUBLIC = /^\/(?:dashboard\/(?:tournament|leagues)\/|t\/)/

export function revalidatePath(path: string, type?: 'page' | 'layout') {
  nextRevalidatePath(path, type)
  if (AFFECTS_PUBLIC.test(path)) {
    for (const p of PUBLIC_PAGES) nextRevalidatePath(p, 'page')
  }
}
