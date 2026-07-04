'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { sendWelcomeEmail } from '@/lib/email'

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nextRaw = (formData.get('next') as string | null) ?? ''

  const { error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }

  // Fire-and-forget — not blocking redirect on email failure
  sendWelcomeEmail(email).catch(() => {})

  // If an invite or other deep link was waiting, go there instead of onboarding
  const safePath = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/onboarding'
  redirect(safePath)
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nextRaw = (formData.get('next') as string | null) ?? ''

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  // Only allow local relative redirects (prevent open-redirect attacks)
  const safePath = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/dashboard'
  redirect(safePath)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function changePassword(formData: FormData) {
  const password = (formData.get('password') as string | null) ?? ''
  const confirm = (formData.get('confirm') as string | null) ?? ''

  if (password.length < 6) return { error: 'Пароль должен быть не менее 6 символов' }
  if (password !== confirm) return { error: 'Пароли не совпадают' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Сессия истекла. Войдите заново.' }

  // Works for any account — including Google sign-ups: updateUser sets (or updates)
  // the password and enables email+password login alongside the OAuth provider.
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  // Whether the account previously had a password (email identity) — lets the UI
  // say "пароль установлен" vs "пароль изменён".
  const hadPassword = user.identities?.some(i => i.provider === 'email') ?? true
  return { success: true, wasSet: !hadPassword }
}

// ── Profile fields (optional, stored in user metadata) ───────────────────────
export async function updateAccountProfile(fields: {
  display_name?: string
  phone?: string
  country?: string
  city?: string
}): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Сессия истекла. Войдите заново.' }

  const clean = (v?: string) => (v ?? '').trim().slice(0, 80)
  const { error } = await supabase.auth.updateUser({
    data: {
      display_name: clean(fields.display_name) || null,
      phone: clean(fields.phone) || null,
      country: clean(fields.country) || null,
      city: clean(fields.city) || null,
    },
  })
  if (error) return { error: error.message }
  return { success: true }
}

// ── Password reset (forgot password flow) ────────────────────────────────────
export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  if (!email) return { error: 'Введите email' }

  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tournable.app'
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
  })
  // Always return success to prevent email enumeration
  if (error) console.error('[auth] resetPasswordForEmail:', error.message)
  return { ok: true }
}

// ── Self-service account deletion ────────────────────────────────────────────
// Hard-deletes the auth user via the admin API; FK cascades remove the profile,
// tournaments, teams, fixtures, memberships and subscriptions. Irreversible.
export async function deleteAccount(confirmation: string) {
  // Anti-accident guard: the client must echo this exact word.
  if (confirmation !== 'УДАЛИТЬ') return { error: 'Подтверждение не совпадает' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Сессия истекла. Войдите заново.' }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    // Service role key not configured — cannot delete the auth user safely.
    return { error: 'NOT_CONFIGURED' }
  }

  const admin = createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return { error: error.message }

  // Clear the now-orphaned session cookies on this device.
  await supabase.auth.signOut()
  return { success: true }
}
