import Link from 'next/link'
import Image from 'next/image'
import { Check, X, Zap, Trophy, Star, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Тарифы — Tournable',
  description: 'Выберите подходящий план: бесплатный Старт или профессиональный Про с Live-табло и неограниченными турнирами.',
}

const FREE_FEATURES = [
  { text: 'До 3 турниров', included: true },
  { text: 'До 16 команд в турнире', included: true },
  { text: 'Круговой и плей-офф форматы', included: true },
  { text: 'Публичная страница для участников', included: true },
  { text: 'Статистика игроков и команд', included: true },
  { text: 'Экспорт PDF и PNG', included: true },
  { text: 'Live-табло в реальном времени', included: false },
  { text: 'Неограниченные турниры', included: false },
  { text: 'До 64 команд в турнире', included: false },
  { text: 'До 3 соредакторов', included: false },
]

const PRO_FEATURES = [
  { text: 'Неограниченные турниры', included: true },
  { text: 'До 64 команд в турнире', included: true },
  { text: 'Все форматы (круговой, плей-офф, групповой)', included: true },
  { text: 'Публичная страница для участников', included: true },
  { text: 'Статистика игроков и команд', included: true },
  { text: 'Экспорт PDF и PNG', included: true },
  { text: 'Live-табло в реальном времени', included: true },
  { text: 'До 3 соредакторов', included: true },
  { text: 'Приоритетная поддержка', included: true },
]

const FAQ = [
  {
    q: 'Можно ли сменить план позже?',
    a: 'Да. Вы начинаете с бесплатного плана Старт, а перейти на Про можно в любой момент через WhatsApp.',
  },
  {
    q: 'Что происходит, когда заканчивается подписка Про?',
    a: 'Ваши турниры и данные остаются целыми. Live-табло и создание новых турниров сверх лимита становятся недоступны до продления.',
  },
  {
    q: 'Как оплатить?',
    a: 'Принимаем оплату через Kaspi Pay и банковские карты. Свяжитесь с нами в WhatsApp — вышлем реквизиты.',
  },
  {
    q: 'Есть ли скидка на год?',
    a: 'Да. Годовая подписка стоит 44 990 ₸ — это на 25% выгоднее ежемесячной оплаты.',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background: 'linear-gradient(90deg,#047857,#059669)', boxShadow: '0 2px 20px rgba(4,120,87,.25)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-white.png" alt="Tournable" width={32} height={32} className="w-8 h-8 object-contain" />
            <span className="font-black text-white text-base" style={{ letterSpacing: '-.02em' }}>TOURNABLE</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-emerald-100 hover:text-white transition-colors"
            >
              Войти
            </Link>
            <Link
              href="/register"
              className="text-sm font-black bg-white text-emerald-700 px-4 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors shadow-sm"
            >
              Начать бесплатно
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20 text-center px-4">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Тарифы</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4" style={{ letterSpacing: '-.03em' }}>
            Простые и честные цены
          </h1>
          <p className="text-gray-500 text-lg max-w-lg mx-auto">
            Начните бесплатно. Переходите на Про, когда готовы к большему.
          </p>
        </section>

        {/* ── Plans ──────────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

            {/* Free */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="font-black text-lg text-gray-900">Старт</span>
                </div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-black text-gray-900">0 ₸</span>
                </div>
                <p className="text-sm text-gray-400">Всегда бесплатно</p>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {FREE_FEATURES.map(f => (
                  <li key={f.text} className="flex items-start gap-2.5 text-sm">
                    {f.included ? (
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                    )}
                    <span className={f.included ? 'text-gray-700' : 'text-gray-400'}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-black py-3 rounded-xl transition-colors text-sm"
              >
                Начать бесплатно
              </Link>
            </div>

            {/* Pro */}
            <div
              className="rounded-2xl p-8 flex flex-col shadow-xl relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg,#047857,#10b981)' }}
            >
              {/* Recommended badge */}
              <div className="absolute top-4 right-4">
                <span className="text-[10px] font-black bg-yellow-400 text-yellow-900 px-2.5 py-1 rounded-full uppercase tracking-wide">
                  Рекомендуем
                </span>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" fill="currentColor" />
                  </div>
                  <span className="font-black text-lg text-white">Про</span>
                </div>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-4xl font-black text-white">4 990 ₸</span>
                  <span className="text-emerald-200 text-sm mb-1.5">/ месяц</span>
                </div>
                <p className="text-emerald-200 text-sm">44 990 ₸/год · скидка −25%</p>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {PRO_FEATURES.map(f => (
                  <li key={f.text} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                    <span className="text-emerald-50">{f.text}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 text-emerald-700 font-black py-3 rounded-xl transition-colors text-sm shadow-md"
              >
                Перейти на Про
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-24">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-10" style={{ letterSpacing: '-.02em' }}>
            Частые вопросы
          </h2>
          <div className="space-y-4">
            {FAQ.map(item => (
              <div key={item.q} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-black text-gray-900 mb-2 text-sm">{item.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────────── */}
        <section className="pb-24 px-4">
          <div
            className="max-w-2xl mx-auto rounded-2xl p-10 text-center text-white"
            style={{ background: 'linear-gradient(135deg,#047857,#10b981)' }}
          >
            <h2 className="text-2xl font-black mb-3" style={{ letterSpacing: '-.02em' }}>
              Готовы провести турнир?
            </h2>
            <p className="text-emerald-200 text-sm mb-8 max-w-sm mx-auto">
              Зарегистрируйтесь бесплатно и создайте первый турнир за 2 минуты.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-emerald-700 font-black px-7 py-3 rounded-xl hover:bg-emerald-50 transition-colors text-sm shadow-md"
              >
                Начать бесплатно
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="https://wa.me/message/YHLE2IFII4MSJ1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/40 text-white font-bold px-7 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
              >
                Связаться с нами
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>© 2026 Tournable. Все права защищены.</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Конфиденциальность</Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Условия</Link>
            <Link href="/dashboard" className="hover:text-gray-600 transition-colors">Кабинет</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
