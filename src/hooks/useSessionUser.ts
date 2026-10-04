'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type SessionUser = { id: string; email: string | null }

/**
 * The signed-in user, read in the browser.
 *
 * Public pages (landing, tournaments, teams...) are cached and rendered once for
 * every visitor, so the server cannot tell who is looking. getSession() reads the
 * auth cookie locally — no network round-trip for guests. Use it for UI only;
 * every write is still authorised on the server. `null` until resolved or when
 * signed out.
 */
export function useSessionUser(): SessionUser | null {
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    let alive = true
    createClient().auth.getSession().then(({ data }) => {
      const u = data.session?.user
      if (alive) setUser(u ? { id: u.id, email: u.email ?? null } : null)
    })
    return () => {
      alive = false
    }
  }, [])

  return user
}
