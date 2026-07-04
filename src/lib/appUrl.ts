// Canonical public base URL (apex, no www). NEXT_PUBLIC_ vars are inlined at build
// time, so this is safe in client components too. Use this for any link that gets
// copied/shared, so it never inherits a www host from window.location.origin.
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://tournable.app').replace(/\/+$/, '')
