'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { sendWelcomeEmail } from '@/lib/email'

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }

  // Fire-and-forget — not blocking redirect on email failure
  sendWelcomeEmail(email).catch(() => {})

  redirect('/onboarding')
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

  // OAuth-only accounts have no password to change
  const hasPasswordIdentity = user.identities?.some(i => i.provider === 'email')
  if (user.identities && !hasPasswordIdentity) {
    return { error: 'Аккаунт создан через Google. Сменить пароль нельзя.' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  return { success: true }
}
