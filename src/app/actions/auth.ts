'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { sendWelcomeEmail } from '@/lib/email'

// ── Email-confirmation bypass ────────────────────────────────────────────────
// Product decision: users should enter the app right after registration without
// an email round-trip. We auto-confirm the address via the admin API (works even
// if "Confirm email" is still ON in Supabase Auth settings).
function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createAdminClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function adminAutoConfirm(userId: string): Promise<void> {
  const admin = getAdmin()
  if (!admin) return
  try { await admin.auth.admin.updateUserById(userId, { email_confirm: true }) } catch {}
}

// Existing account created before confirmation was bypassed: find it by email and confirm.
async function adminConfirmByEmail(email: string): Promise<boolean> {
  const admin = getAdmin()
  if (!admin) return false
  try {
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    const target = data?.users?.find(u => u.email?.toLowerCase() === email.trim().toLowerCase())
    if (!target) return false
    await admin.auth.admin.updateUserById(target.id, { email_confirm: true })
    return true
  } catch { return false }
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nextRaw = (formData.get('next') as string | null) ?? ''

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }

  // If confirmation is required, signUp returns no session → auto-confirm and sign
  // the user in so they land straight in the app (no "confirm your email" step).
  if (!data.session && data.user) {
    await adminAutoConfirm(data.user.id)
    await supabase.auth.signInWithPassword({ email, password })
  }

  // Fire-and-forget — not blocking redirect on email failure
  sendWelcomeEmail(email).catch(() => {})

  // Straight to "My tournaments" (or a waiting invite/deep link).
  const safePath = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/dashboard'
  redirect(safePath)
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nextRaw = (formData.get('next') as string | null) ?? ''
  // Only allow local relative redirects (prevent open-redirect attacks)
  const safePath = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/dashboard'

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    // Account created before confirmation was bypassed → confirm it and retry once,
    // so nobody is ever blocked by "Email not confirmed".
    const code = (error as { code?: string }).code
    if (code === 'email_not_confirmed' || /not confirmed/i.test(error.message)) {
      if (await adminConfirmByEmail(email)) {
        const retry = await supabase.auth.signInWithPassword({ email, password })
        if (!retry.error) redirect(safePath)
      }
    }
    return { error: error.message }
  }

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
  // Anti-accident guard: the client must echo the confirm word. Accept it in any
  // of the supported languages (ru/kz/en) and case — the UI localises the word.
  const CONFIRM_WORDS = ['УДАЛИТЬ', 'ЖОЮ', 'DELETE']
  if (!CONFIRM_WORDS.includes(confirmation.trim().toLocaleUpperCase())) {
    return { error: 'Подтверждение не совпадает' }
  }

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
