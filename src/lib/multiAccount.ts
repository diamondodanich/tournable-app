// Client-side multi-account store.
//
// Keeps the Supabase session (access + refresh token) for every account the user
// has signed into on this browser, so they can switch between accounts without
// re-entering credentials — the Instagram-style multi-account pattern.
//
// Security note: refresh tokens live in localStorage here. That is inherent to
// client-side account switching; an XSS on this origin could read them. The trade
// is the same one every "stay signed in / switch account" feature makes.

export type StoredAccount = {
  id: string
  email: string
  name?: string
  plan?: 'free' | 'pro' | 'enterprise'
  access_token: string
  refresh_token: string
  updatedAt: number
}

const KEY = 'tournable_accounts_v1'

export function getAccounts(): StoredAccount[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? (list as StoredAccount[]) : []
  } catch {
    return []
  }
}

function save(list: StoredAccount[]) {
  try { window.localStorage.setItem(KEY, JSON.stringify(list)) } catch {}
}

/** Insert or refresh one account's stored tokens, preserving list order. */
export function upsertAccount(acc: StoredAccount) {
  const list = getAccounts()
  const idx = list.findIndex(a => a.id === acc.id)
  if (idx >= 0) list[idx] = { ...list[idx], ...acc }
  else list.push(acc)
  save(list)
}

export function removeAccount(id: string) {
  save(getAccounts().filter(a => a.id !== id))
}
