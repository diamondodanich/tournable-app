'use client'

import { useSessionUser } from './useSessionUser'

/**
 * Whether the visitor is the owner (`ownerId`) of what a cached public page
 * shows. Only hides or shows UI — every edit is still checked on the server.
 */
export function useIsOwner(ownerId: string | null | undefined): boolean {
  const user = useSessionUser()
  return !!ownerId && user?.id === ownerId
}
