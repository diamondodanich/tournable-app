import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserPlan } from '@/app/actions/billing'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: {
    title: 'Оформление тарифа Про',
    account: 'Кабинет',
  },
  kz: {
    title: 'Про тарифін рәсімдеу',
    account: 'Кабинет',
  },
  en: {
    title: 'Upgrade to Pro',
    account: 'Account',
  },
} as const

export const metadata: Metadata = {
  title: 'Оформление Про — Tournable',
  description: 'Перейдите на тариф Про и получите неограниченные турниры, Табло и до 64 команд.',
}

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/checkout')
  }

  const plan = await getUserPlan()

  if (plan === 'pro') {
    redirect('/account')
  }

  const cookieStore = await cookies()
  const langRaw = cookieStore.get('lang')?.value ?? 'ru'
  const lang: Lang = (['ru', 'kz', 'en'] as Lang[]).includes(langRaw as Lang) ? (langRaw as Lang) : 'ru'
  const tx = T[lang]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header style={{ background: 'linear-gradient(90deg,#047857,#059669)', boxShadow: '0 2px 20px rgba(4,120,87,.25)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-white.png" alt="Tournable" width={32} height={32} className="w-8 h-8 object-contain" />
            <span className="font-black text-white text-base" style={{ letterSpacing: '-.02em' }}>TOURNABLE</span>
          </Link>
          <Link
            href="/account"
            className="flex items-center gap-1.5 text-sm font-semibold text-emerald-100 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {tx.account}
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1" style={{ letterSpacing: '-.02em' }}>
            {tx.title}
          </h1>
          <p className="text-gray-400 text-sm">{user.email}</p>
        </div>

        <CheckoutForm userEmail={user.email} lang={lang} />

      </main>

    </div>
  )
}
