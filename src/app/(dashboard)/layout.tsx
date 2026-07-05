import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserPlan } from '@/app/actions/billing'
import Link from 'next/link'
import Image from 'next/image'
import LangSwitcher from '@/components/dashboard/LangSwitcher'
import AccountMenu from '@/components/dashboard/AccountMenu'
import SupportWidget from '@/components/landing/SupportWidget'
import InstallPrompt from '@/components/InstallPrompt'

type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: {
    myTournaments: 'Все турниры',
    leagues: 'Лиги',
    features: 'Возможности',
    pricing: 'Тарифы',
    contact: 'Контакты',
    account: 'Личный кабинет',
    signOut: 'Выйти из аккаунта',
  },
  kz: {
    myTournaments: 'Барлық турнирлер',
    leagues: 'Лигалар',
    features: 'Мүмкіндіктер',
    pricing: 'Тарифтер',
    contact: 'Байланыс',
    account: 'Жеке кабинет',
    signOut: 'Шығу',
  },
  en: {
    myTournaments: 'All tournaments',
    leagues: 'Leagues',
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
  const displayName = (user.user_metadata as { display_name?: string } | undefined)?.display_name
  const isDark = cookieStore.get('theme')?.value === 'dark'

  return (
    <div className={isDark ? 'dark' : undefined}>
    <div className="min-h-screen bg-gray-50 relative overflow-x-hidden">

      {/* ── Background decoration ──────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden app-bg-decor">
        <div className="app-glow absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full bg-emerald-100/50 blur-3xl" />
        <div className="app-glow absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full bg-emerald-50/70 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, #059669 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      {/* ── Header (fixed — stays on scroll; parent overflow-x-hidden breaks sticky) ── */}
      <header
        className="app-topbar fixed top-0 inset-x-0 z-30"
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

          {/* Right: lang switcher + account menu (multi-account switcher) */}
          <div className="flex items-center gap-2">
            <LangSwitcher current={lang} />
            <AccountMenu
              lang={lang}
              currentId={user.id}
              email={user.email ?? ''}
              name={displayName}
              plan={plan}
            />
          </div>
        </div>
      </header>

      {/* Spacer to offset the fixed header (h-16) */}
      <div className="h-16" />

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-8">
        {children}
      </main>

      {/* ── Support widget ────────────────────────────────────────────── */}
      <SupportWidget lang={lang} />

      {/* ── PWA install prompt (mobile only) ─────────────────────────── */}
      <InstallPrompt />
    </div>
    </div>
  )
}
