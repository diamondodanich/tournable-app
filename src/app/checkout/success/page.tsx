import Link from 'next/link'
import { CheckCircle, Trophy, ArrowRight, Crown } from 'lucide-react'
import type { Metadata } from 'next'
import { getUserPlan } from '@/app/actions/billing'

export const metadata: Metadata = {
  title: 'Оплата прошла успешно — Tournable',
}

export default async function CheckoutSuccessPage() {
  const plan = await getUserPlan()
  const isEnterprise = plan === 'enterprise'

  const accent = isEnterprise
    ? { from: '#5b21b6', to: '#7c3aed', bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500', icon: 'text-violet-600', btn: 'bg-violet-600 hover:bg-violet-700' }
    : { from: '#047857', to: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', icon: 'text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700' }

  const features = isEnterprise
    ? ['Чемпионаты с сезонами', 'Профили команд и игроков', 'Составы к матчам', 'Углублённая статистика и аналитика', 'Все возможности PRO включены']
    : ['Неограниченные турниры', 'Live-табло в реальном времени', 'Все форматы — Лига, Группы, Плей-офф', 'Экспорт PDF и PNG']

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: isEnterprise ? 'linear-gradient(135deg,#f5f3ff 0%,#faf5ff 50%,#ffffff 100%)' : 'linear-gradient(135deg,#ecfdf5 0%,#f0fdf4 50%,#ffffff 100%)' }}
    >
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center space-y-6">

        {/* Icon */}
        <div className="flex justify-center">
          <div className={`w-20 h-20 rounded-full ${accent.bg} flex items-center justify-center`}>
            {isEnterprise
              ? <Crown className={`w-10 h-10 ${accent.icon}`} strokeWidth={1.5} />
              : <CheckCircle className={`w-10 h-10 ${accent.icon}`} strokeWidth={1.5} />
            }
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-gray-900">Оплата прошла!</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            {isEnterprise
              ? 'Tournable Enterprise активирован. Все возможности — лиги, профили игроков, аналитика — уже доступны.'
              : 'Подписка Tournable Pro активирована. Все возможности уже доступны в вашем аккаунте.'
            }
          </p>
        </div>

        {/* Features reminder */}
        <div className={`${accent.bg} rounded-2xl p-4 text-left space-y-2`}>
          {features.map(f => (
            <div key={f} className={`flex items-center gap-2 text-sm ${accent.text}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${accent.dot} shrink-0`} />
              {f}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          {isEnterprise ? (
            <Link
              href="/dashboard/new?type=championship"
              className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl ${accent.btn} text-white font-bold text-sm transition-colors`}
            >
              <Crown className="w-4 h-4" />
              Создать чемпионат
            </Link>
          ) : (
            <Link
              href="/dashboard/new"
              className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl ${accent.btn} text-white font-bold text-sm transition-colors`}
            >
              <Trophy className="w-4 h-4" />
              Создать турнир
            </Link>
          )}
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors"
          >
            Перейти к турнирам
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  )
}
