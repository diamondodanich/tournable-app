import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, LogOut, Zap, CreditCard, MessageCircle } from 'lucide-react'

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

  const cookieStore = await cookies()
  const langRaw = cookieStore.get('lang')?.value ?? 'ru'
  const lang: Lang = (['ru', 'kz', 'en'] as Lang[]).includes(langRaw as Lang) ? (langRaw as Lang) : 'ru'
  const tx = T[lang]

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
            <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-2 text-sm text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-all font-medium">
              <LayoutDashboard className="w-4 h-4" /> {tx.myTournaments}
            </Link>
            <Link href="/#features" className="flex items-center gap-1.5 px-3 py-2 text-sm text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-all font-medium">
              <Zap className="w-4 h-4" /> {tx.features}
            </Link>
            <Link href="/#pricing" className="flex items-center gap-1.5 px-3 py-2 text-sm text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-all font-medium">
              <CreditCard className="w-4 h-4" /> {tx.pricing}
            </Link>
            <Link href="/#contact" className="flex items-center gap-1.5 px-3 py-2 text-sm text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-all font-medium">
              <MessageCircle className="w-4 h-4" /> {tx.contact}
            </Link>
          </nav>

          {/* Right: profile + sign out */}
          <div className="flex items-center gap-2">
            <Link
              href="/account"
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-xl transition-colors"
              title={tx.account}
            >
              <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center text-[11px] font-black text-white shrink-0">
                {initials}
              </div>
              <span className="hidden sm:block text-xs text-emerald-100 font-medium max-w-[130px] truncate">
                {emailShort}
              </span>
            </Link>

            <form action={signOut}>
              <button
                type="submit"
                title={tx.signOut}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <LogOut className="w-4 h-4 text-emerald-100" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
