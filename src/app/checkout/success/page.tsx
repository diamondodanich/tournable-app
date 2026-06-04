import Link from 'next/link'
import { CheckCircle, Trophy, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Оплата прошла успешно — Tournable',
}

export default function CheckoutSuccessPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #ffffff 100%)' }}
    >
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center space-y-6">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-600" strokeWidth={1.5} />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-gray-900">Оплата прошла!</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Подписка Tournable Pro активирована. Все возможности уже доступны в вашем аккаунте.
          </p>
        </div>

        {/* Features reminder */}
        <div className="bg-emerald-50 rounded-2xl p-4 text-left space-y-2">
          {[
            'Неограниченные турниры',
            'Live-табло в реальном времени',
            'Все форматы — Лига, Группы, Плей-офф',
            'Экспорт PDF и PNG',
          ].map(f => (
            <div key={f} className="flex items-center gap-2 text-sm text-emerald-700">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              {f}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Link
            href="/dashboard/new"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors"
          >
            <Trophy className="w-4 h-4" />
            Создать турнир
          </Link>
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
