import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserPlan } from '@/app/actions/billing'
import Link from 'next/link'
import Image from 'next/image'
import { User } from 'lucide-react'
import LangSwitcher from '@/components/dashboard/LangSwitcher'
import SupportWidget from '@/components/landing/SupportWidget'
import SignOutButton from '@/components/account/SignOutButton'

type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: {
    myTournaments: 'Мои турниры',
    features: 'Возможности',
    pricing: 'Тарифы',
    contact: 'Контакты',
    account: 'Личный кабинет',
    signOut: 'Выйти из аккаунта',
  },
  kz: {
    myTournaments: 'Менің турнирлерім',
    features: 'Мүмкіндіктер',
    pricing: 'Тарифтер',
    contact: 'Байланыс',
    account: 'Жеке кабинет',
    signOut: 'Шығу',
  },
  en: {
    myTournaments: 'My tournaments',
    features: 'Features',
    pricing: 'Pricing',
    contact: 'Contact',
    account: 'Account',
    signOut: 'Sign out',
  },
} as const

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [cookieStore, plan] = await Promise.all([cookies(), getUserPlan()])
  const langRaw = cookieStore.get('lang')?.value ?? 'ru'
  const lang: Lang = (['ru', 'kz', 'en'] as Lang[]).includes(langRaw as Lang) ? (langRaw as Lang) : 'ru'
  const tx = T[lang]
  const isPro = plan === 'pro'

  const initials = user.email?.slice(0, 2).toUpperCase() ?? '??'
  const emailShort = user.email?.split('@')[0] ?? ''

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-x-hidden">

      {/* ── Background decoration ──────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full bg-emerald-100/50 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full bg-emerald-50/70 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, #059669 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header
        className="relative z-20 sticky top-0"
        style={{ background: 'linear-gradient(90deg,#047857 0%,#059669 100%)', boxShadow: '0 2px 20px rgba(4,120,87,.25)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo-white.png" alt="Tournable" width={36} height={36} className="w-8 h-8 object-contain" />
            <span className="font-black text-[17px] tracking-tight text-white hidden sm:block" style={{ letterSpacing: '-.02em' }}>
              TOURNABLE
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            <Link href="/dashboard" className="px-3 py-2 text-sm text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-all font-medium">
              {tx.myTournaments}
            </Link>
            <Link href="/#features" className="px-3 py-2 text-sm text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-all font-medium">
              {tx.features}
            </Link>
            <Link href="/#pricing" className="px-3 py-2 text-sm text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-all font-medium">
              {tx.pricing}
            </Link>
            <Link href="/#contact" className="px-3 py-2 text-sm text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-all font-medium">
              {tx.contact}
            </Link>
          </nav>

          {/* Right: lang switcher + profile + sign out */}
          <div className="flex items-center gap-2">
            <LangSwitcher current={lang} />
            <Link
              href="/account"
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-xl transition-colors"
            >
              {/* Avatar with user icon badge */}
              <div className="relative shrink-0">
                <div className="w-7 h-7 rounded-full bg-white/25 ring-1 ring-white/40 flex items-center justify-center text-[11px] font-black text-white">
                  {initials}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border border-emerald-700 flex items-center justify-center">
                  <User size={7} className="text-emerald-900" />
                </div>
              </div>
              {/* Label + email */}
              <div className="hidden sm:flex flex-col leading-none">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] text-emerald-300 font-semibold">{tx.account}</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none ${
                    isPro
                      ? 'bg-amber-400 text-amber-900'
                      : 'bg-white/20 text-emerald-100'
                  }`}>
                    {isPro ? 'PRO' : 'FREE'}
                  </span>
                </div>
                <span className="text-xs text-white font-bold max-w-[110px] truncate">{emailShort}</span>
              </div>
            </Link>

            <SignOutButton variant="icon" title={tx.signOut} />
          </div>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* ── Support widget ────────────────────────────────────────────── */}
      <SupportWidget lang={lang} />
    </div>
  )
}
