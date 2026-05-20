import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const initials = user.email?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-x-hidden">

      {/* ── Premium background decoration ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Large blurred gradient orbs */}
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full bg-emerald-100/50 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full bg-emerald-50/70 blur-3xl" />
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-emerald-50/30 blur-3xl" />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(circle, #059669 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="relative z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-black tracking-tight text-emerald-600 hover:text-emerald-700 transition-colors">
            Tournable
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-gray-400">{user.email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-xs font-bold text-gray-500 transition-colors"
                title="Выйти"
              >
                {initials}
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
