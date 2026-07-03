'use client'

import { useState } from 'react'
import { Check, Copy, Star, MessageCircle, CheckCircle2 } from 'lucide-react'
import { TipTopPayButton } from './TipTopPayButton'

type Lang = 'ru' | 'kz' | 'en'

const MONTHLY_PRICE = 4990
const ANNUAL_PRICE = 44990
const ANNUAL_DISCOUNT = MONTHLY_PRICE * 12 - ANNUAL_PRICE

const T = {
  ru: {
    monthLabel: 'Месяц',
    yearLabel: 'Год',
    monthSuffix: '/ месяц',
    yearSuffix: '/ год',
    save: 'Скидка −25%',
    planName: 'Про',
    savingsText: (n: string) => `Экономия ${n} ₸ по сравнению с ежемесячной оплатой`,
    features: [
      'Неограниченные турниры',
      'До 64 команд в турнире',
      'Live-табло в реальном времени',
      'До 3 соредакторов',
      'Все форматы (круговой, плей-офф, групповой)',
      'Экспорт PDF и PNG',
      'Статистика игроков и команд',
      'Приоритетная поддержка',
    ],
    total: 'Итого',
    lineYear: 'Tournable Про — Год (12 мес.)',
    lineMonth: 'Tournable Про — Месяц',
    discountLine: 'Скидка −25%',
    toPay: 'К оплате',
    cardPayment: 'Оплата картой',
    orWhatsApp: 'или оплатите через WhatsApp',
    copyTitle: 'Скопировать',
    whatsAppBtn: 'Написать в WhatsApp',
    waMessage: (planLabel: string, price: string, email?: string) =>
      [
        `Tournable Про — ${planLabel}.`,
        `Сумма: ${price} ₸.`,
        email ? `Email: ${email}` : '',
      ].filter(Boolean).join(' '),
  },
  kz: {
    monthLabel: 'Ай',
    yearLabel: 'Жыл',
    monthSuffix: '/ ай',
    yearSuffix: '/ жыл',
    save: 'Жеңілдік −25%',
    planName: 'Про',
    savingsText: (n: string) => `Айлық төлеммен салыстырғанда ${n} ₸ үнемдейсіз`,
    features: [
      'Шектеусіз турнирлер',
      'Турнирде 64 командаға дейін',
      'Нақты уақыттағы Live-табло',
      '3 бірлескен редакторға дейін',
      'Барлық форматтар (дөңгелек, плей-офф, топтық)',
      'PDF және PNG экспорты',
      'Ойыншылар мен командалар статистикасы',
      'Басым қолдау көрсету',
    ],
    total: 'Барлығы',
    lineYear: 'Tournable Про — Жыл (12 ай)',
    lineMonth: 'Tournable Про — Ай',
    discountLine: 'Жеңілдік −25%',
    toPay: 'Төлеуге',
    cardPayment: 'Картамен төлеу',
    orWhatsApp: 'немесе WhatsApp арқылы төлеңіз',
    copyTitle: 'Көшіру',
    whatsAppBtn: 'WhatsApp-қа жазу',
    waMessage: (planLabel: string, price: string, email?: string) =>
      [
        `Tournable Про — ${planLabel}.`,
        `Сома: ${price} ₸.`,
        email ? `Email: ${email}` : '',
      ].filter(Boolean).join(' '),
  },
  en: {
    monthLabel: 'Month',
    yearLabel: 'Year',
    monthSuffix: '/ month',
    yearSuffix: '/ year',
    save: '−25% off',
    planName: 'Pro',
    savingsText: (n: string) => `Save ${n} ₸ compared to monthly billing`,
    features: [
      'Unlimited tournaments',
      'Up to 64 teams per tournament',
      'Real-time live scoreboard',
      'Up to 3 co-editors',
      'All formats (round robin, playoff, groups)',
      'PDF and PNG export',
      'Player and team statistics',
      'Priority support',
    ],
    total: 'Total',
    lineYear: 'Tournable Pro — Year (12 mo.)',
    lineMonth: 'Tournable Pro — Month',
    discountLine: '−25% off',
    toPay: 'Amount due',
    cardPayment: 'Card payment',
    orWhatsApp: 'or pay via WhatsApp',
    copyTitle: 'Copy',
    whatsAppBtn: 'Message on WhatsApp',
    waMessage: (planLabel: string, price: string, email?: string) =>
      [
        `Tournable Pro — ${planLabel}.`,
        `Amount: ${price} ₸.`,
        email ? `Email: ${email}` : '',
      ].filter(Boolean).join(' '),
  },
} as const

interface Props {
  userEmail?: string
  lang?: Lang
}

export function CheckoutForm({ userEmail, lang = 'ru' }: Props) {
  const tx = T[lang]
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [copied, setCopied] = useState(false)

  const PLANS = {
    monthly: { label: tx.monthLabel, price: MONTHLY_PRICE, suffix: tx.monthSuffix, save: null as string | null },
    annual: { label: tx.yearLabel, price: ANNUAL_PRICE, suffix: tx.yearSuffix, save: tx.save as string | null },
  }

  const plan = PLANS[period]

  const message = tx.waMessage(plan.label, plan.price.toLocaleString('ru-RU'), userEmail)

  const waUrl = `https://wa.me/message/YHLE2IFII4MSJ1`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {}
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

      {/* Left — plan selector + features */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#047857,#10b981)' }} />

        <div className="p-6">
          {/* Period toggle */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              {(['monthly', 'annual'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={[
                    'px-4 py-2 rounded-lg text-sm font-bold transition-all',
                    period === p
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700',
                  ].join(' ')}
                >
                  {PLANS[p].label}
                  {PLANS[p].save && (
                    <span className="ml-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      −25%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Plan name + price */}
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#047857,#10b981)' }}
            >
              <Star className="w-3.5 h-3.5 text-white" fill="currentColor" />
            </div>
            <span className="font-black text-lg text-gray-900">{tx.planName}</span>
          </div>

          <div className="flex items-end gap-1.5 mb-1">
            <span className="text-4xl font-black text-gray-900">
              {plan.price.toLocaleString('ru-RU')} ₸
            </span>
            <span className="text-gray-400 text-sm mb-1.5">{plan.suffix}</span>
          </div>
          {period === 'annual' && (
            <p className="text-xs text-emerald-600 font-bold mb-5">
              {tx.savingsText(ANNUAL_DISCOUNT.toLocaleString('ru-RU'))}
            </p>
          )}
          {period === 'monthly' && <div className="mb-5" />}

          {/* Features */}
          <ul className="space-y-2.5">
            {tx.features.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right — order summary + payment */}
      <div className="space-y-4">

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-gray-900 mb-4">{tx.total}</h2>
          {period === 'annual' ? (
            <>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">{tx.lineYear}</span>
                <span className="text-sm text-gray-400 line-through">{(MONTHLY_PRICE * 12).toLocaleString('ru-RU')} ₸</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-emerald-600 font-bold">{tx.discountLine}</span>
                <span className="font-bold text-emerald-600">−{ANNUAL_DISCOUNT.toLocaleString('ru-RU')} ₸</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">{tx.lineMonth}</span>
              <span className="font-black text-gray-900">{plan.price.toLocaleString('ru-RU')} ₸</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-3">
            <span className="font-black text-gray-900">{tx.toPay}</span>
            <span className="text-xl font-black text-gray-900">{plan.price.toLocaleString('ru-RU')} ₸</span>
          </div>
        </div>

        {/* Card payment */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-gray-900 mb-4">{tx.cardPayment}</h2>
          <TipTopPayButton period={period} amount={plan.price} userEmail={userEmail} lang={lang} />
        </div>

        {/* WhatsApp fallback */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[11px] text-gray-400 shrink-0">{tx.orWhatsApp}</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2 mb-3">
            <p className="text-xs text-gray-600 flex-1 leading-relaxed break-all">{message}</p>
            <button
              onClick={handleCopy}
              className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-500"
              title={tx.copyTitle}
            >
              {copied
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                : <Copy className="w-4 h-4" />
              }
            </button>
          </div>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full text-gray-700 font-bold py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            {tx.whatsAppBtn}
          </a>
        </div>

      </div>
    </div>
  )
}
