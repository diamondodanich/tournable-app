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
    <div className="min-h-screen bg-gray-50/80">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-black tracking-tight text-emerald-600 hover:text-emerald-700 transition-colors">
            Tournable
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-gray-400">{user.email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 transition-colors"
                title="Выйти"
              >
                {initials}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
