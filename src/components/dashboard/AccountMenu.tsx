'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { User, ChevronDown, Plus, LogOut, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAccounts, upsertAccount, removeAccount, type StoredAccount } from '@/lib/multiAccount'

type Lang = 'ru' | 'kz' | 'en'
type Plan = 'free' | 'pro' | 'enterprise'

const T = {
  ru: {
    account: 'Личный кабинет',
    switchTitle: 'Аккаунты',
    addAccount: 'Добавить аккаунт',
    settings: 'Настройки аккаунта',
    signOut: 'Выйти из аккаунта',
    current: 'Текущий',
    sessionExpired: 'Сессия аккаунта истекла — войдите заново',
  },
  kz: {
    account: 'Жеке кабинет',
    switchTitle: 'Аккаунттар',
    addAccount: 'Аккаунт қосу',
    settings: 'Аккаунт баптаулары',
    signOut: 'Шығу',
    current: 'Ағымдағы',
    sessionExpired: 'Аккаунт сессиясы аяқталды — қайта кіріңіз',
  },
  en: {
    account: 'Account',
    switchTitle: 'Accounts',
    addAccount: 'Add account',
    settings: 'Account settings',
    signOut: 'Sign out',
    current: 'Current',
    sessionExpired: 'Account session expired — sign in again',
  },
} as const

function initialsOf(email: string, name?: string) {
  const base = (name?.trim() || email || '?').trim()
  return base.slice(0, 2).toUpperCase()
}

const PLAN_BADGE: Record<Plan, { label: string; cls: string }> = {
  enterprise: { label: 'ENT',  cls: 'bg-purple-400 text-purple-950' },
  pro:        { label: 'PRO',  cls: 'bg-amber-400 text-amber-900' },
  free:       { label: 'FREE', cls: 'bg-white/20 text-emerald-100' },
}

export default function AccountMenu({ lang = 'ru', currentId, email, name, plan }: {
  lang?: Lang
  currentId: string
  email: string
  name?: string
  plan: Plan
}) {
  const tx = T[lang]
  const [open, setOpen] = useState(false)
  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Capture the active session so this account can be switched back to later,
  // and keep its stored tokens fresh as Supabase rotates them in the background.
  useEffect(() => {
    const supabase = createClient()
    const capture = (s: { user?: { id: string; email?: string; user_metadata?: Record<string, unknown> }; access_token: string; refresh_token: string } | null) => {
      if (s?.user) {
        upsertAccount({
          id: s.user.id,
          email: s.user.email ?? email,
          name: (s.user.user_metadata?.display_name as string | undefined) ?? name,
          plan,
          access_token: s.access_token,
          refresh_token: s.refresh_token,
          updatedAt: Date.now(),
        })
      }
      setAccounts(getAccounts())
    }
    supabase.auth.getSession().then(({ data }) => capture(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') capture(session)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [email, name, plan])

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [open])

  const others = accounts.filter(a => a.id !== currentId)

  async function switchTo(acc: StoredAccount) {
    if (acc.id === currentId || busy) return
    setBusy(acc.id)
    const supabase = createClient()
    // Snapshot the live session so we can restore it if the target is stale —
    // a failed setSession must never leave the user logged out of everything.
    const { data: { session: current } } = await supabase.auth.getSession()
    const { error } = await supabase.auth.setSession({
      access_token: acc.access_token,
      refresh_token: acc.refresh_token,
    })
    if (error) {
      removeAccount(acc.id)
      if (current) {
        await supabase.auth.setSession({
          access_token: current.access_token,
          refresh_token: current.refresh_token,
        })
      }
      setAccounts(getAccounts())
      setBusy(null)
      alert(tx.sessionExpired)
      return
    }
    window.location.href = '/dashboard'
  }

  async function addAccount() {
    if (busy) return
    setBusy('add')
    // Store the current account's freshest tokens before leaving, so it can be
    // switched back to after the new one signs in.
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      upsertAccount({
        id: session.user.id,
        email: session.user.email ?? email,
        name: (session.user.user_metadata?.display_name as string | undefined) ?? name,
        plan,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        updatedAt: Date.now(),
      })
    }
    // Do NOT sign out — the proxy allows /login?add=1 while authenticated. Signing
    // in as another account overwrites the active cookie; the current account keeps
    // a valid stored session (never revoked) so it stays switchable afterwards.
    window.location.href = '/login?add=1'
  }

  async function signOutCurrent() {
    if (busy) return
    setBusy('out')
    removeAccount(currentId)
    const supabase = createClient()
    await supabase.auth.signOut({ scope: 'local' })
    const remaining = getAccounts()
    if (remaining.length > 0) {
      const next = remaining[0]
      const { error } = await supabase.auth.setSession({
        access_token: next.access_token,
        refresh_token: next.refresh_token,
      })
      if (!error) { window.location.href = '/dashboard'; return }
      removeAccount(next.id)
    }
    window.location.href = '/login'
  }

  const badge = PLAN_BADGE[plan]

  return (
    <div className="relative" ref={ref} data-tour="account">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-xl transition-colors"
      >
        <div className="relative shrink-0">
          <div className="w-7 h-7 rounded-full bg-white/25 ring-1 ring-white/40 flex items-center justify-center text-[11px] font-black text-white">
            {initialsOf(email, name)}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border border-emerald-700 flex items-center justify-center">
            <User size={7} className="text-emerald-900" />
          </div>
        </div>
        <div className="hidden sm:flex flex-col leading-none">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] text-emerald-300 font-semibold">{tx.account}</span>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none ${badge.cls}`}>{badge.label}</span>
          </div>
          <span className="text-xs text-white font-bold max-w-[110px] truncate">{email.split('@')[0]}</span>
        </div>
        <ChevronDown size={14} className={`text-emerald-100 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden text-gray-900 z-50">
          {/* Current account — click opens the account page (ЛК) */}
          <Link href="/account" onClick={() => setOpen(false)}
            className="p-3 flex items-center gap-3 bg-gray-50 hover:bg-gray-100 border-b border-gray-100 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-sm font-black text-white shrink-0">
              {initialsOf(email, name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-gray-900 truncate">{name?.trim() || email.split('@')[0]}</p>
              <p className="text-xs text-gray-400 truncate">{email}</p>
            </div>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
              plan === 'enterprise' ? 'bg-purple-100 text-purple-700' : plan === 'pro' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
            }`}>{badge.label}</span>
          </Link>

          {/* Other accounts */}
          {others.length > 0 && (
            <div className="py-1.5 border-b border-gray-100">
              <p className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-300">{tx.switchTitle}</p>
              {others.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => switchTo(acc)}
                  disabled={!!busy}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-emerald-50 transition-colors text-left disabled:opacity-60"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-black text-gray-600 shrink-0">
                    {initialsOf(acc.email, acc.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">{acc.name?.trim() || acc.email.split('@')[0]}</p>
                    <p className="text-xs text-gray-400 truncate">{acc.email}</p>
                  </div>
                  {busy === acc.id && <Loader2 size={14} className="animate-spin text-emerald-500 shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="py-1.5">
            <button
              onClick={addAccount}
              disabled={!!busy}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-60"
            >
              <span className="w-8 h-8 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0">
                {busy === 'add' ? <Loader2 size={14} className="animate-spin text-gray-400" /> : <Plus size={15} className="text-gray-400" />}
              </span>
              {tx.addAccount}
            </button>

            <button
              onClick={signOutCurrent}
              disabled={!!busy}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-50 transition-colors text-sm font-medium text-red-500 disabled:opacity-60"
            >
              <span className="w-8 h-8 flex items-center justify-center shrink-0">
                {busy === 'out' ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={16} />}
              </span>
              {tx.signOut}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
