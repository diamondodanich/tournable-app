import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserPlan } from '@/app/actions/billing'
import { EnterpriseCheckoutForm } from '@/components/checkout/EnterpriseCheckoutForm'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Crown } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Подключить Enterprise — Tournable',
  description: 'Enterprise для федераций и лиг. Постоянные лиги, профили игроков, углублённая статистика.',
}

export default async function EnterpriseCheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/checkout/enterprise')
  }

  const plan = await getUserPlan()

  if (plan === 'enterprise') {
    redirect('/account')
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header style={{ background: 'linear-gradient(90deg,#5b21b6,#7c3aed)', boxShadow: '0 2px 20px rgba(91,33,182,.25)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-white.png" alt="Tournable" width={32} height={32} className="w-8 h-8 object-contain" />
            <span className="font-black text-white text-base" style={{ letterSpacing: '-.02em' }}>TOURNABLE</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-violet-200 bg-white/10 px-3 py-1.5 rounded-full">
              <Crown className="w-3 h-3" />
              Enterprise
            </span>
            <Link
              href="/account"
              className="flex items-center gap-1.5 text-sm font-semibold text-violet-200 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Кабинет
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1" style={{ letterSpacing: '-.02em' }}>
            Подключить Enterprise
          </h1>
          <p className="text-gray-400 text-sm">{user.email}</p>
        </div>

        <EnterpriseCheckoutForm userEmail={user.email} />

      </main>

    </div>
  )
}
