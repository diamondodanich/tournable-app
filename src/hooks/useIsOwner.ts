'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Whether the visitor is the owner (`ownerId`) of what the page shows.
 *
 * Public pages are cached and rendered once for every visitor, so the server
 * cannot know who is looking. Owner-only controls are decided here instead:
 * getSession() reads the auth cookie locally, without a network round-trip for
 * guests. This only hides or shows UI — every edit is still checked on the server.
 */
export function useIsOwner(ownerId: string | null | undefined): boolean {
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (!ownerId) return
    let alive = true
    createClient().auth.getSession().then(({ data }) => {
      if (alive) setIsOwner(data.session?.user.id === ownerId)
    })
    return () => {
      alive = false
    }
  }, [ownerId])

  return isOwner
}
