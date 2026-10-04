// Plan resolution shared by the billing server actions and cached public pages
// (which read the owner's profile with the cookie-free public client).

export type Plan = 'free' | 'pro' | 'enterprise'

export function resolvePlan(plan: string | null, expiresAt: string | null): Plan {
  if (plan === 'enterprise') return 'enterprise'
  if (plan === 'pro') {
    if (!expiresAt || new Date(expiresAt) > new Date()) return 'pro'
  }
  return 'free'
}
