'use client'

import { useState } from 'react'
import { Check, Copy, Crown, MessageCircle, CheckCircle2 } from 'lucide-react'
import { CardPaymentForm } from './CardPaymentForm'

const MONTHLY_PRICE = 39990
const PLANS = {
  monthly: { label: 'Месяц', price: MONTHLY_PRICE, suffix: '/ месяц', save: null },
  annual:  { label: 'Год',   price: 349990,          suffix: '/ год',   save: 'Скидка −25%' },
}
const ANNUAL_DISCOUNT = MONTHLY_PRICE * 12 - PLANS.annual.price

const FEATURES = [
  'Безлимитные турниры и команды',
  'Чемпионаты с сезонами',
  'Профили команд и игроков',
  'Составы к матчам',
  'Углублённая статистика и аналитика',
  'До 10 соредакторов',
  'SEO-присутствие в поисковиках',
  'Приоритетная поддержка 24/7',
  'Все возможности PRO включены',
]

interface Props {
  userEmail?: string
}

export function EnterpriseCheckoutForm({ userEmail }: Props) {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('annual')
  const [copied, setCopied] = useState(false)

  const plan = PLANS[period]

  const message = [
    `Tournable Enterprise — ${plan.label}.`,
    `Сумма: ${plan.price.toLocaleString('ru-RU')} ₸.`,
    userEmail ? `Email: ${userEmail}` : '',
  ].filter(Boolean).join(' ')

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
      <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#7c3aed,#a855f7)' }} />

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
                    <span className="ml-1.5 text-[10px] font-black text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">
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
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}
            >
              <Crown className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-lg text-gray-900">Enterprise</span>
          </div>

          <div className="flex items-end gap-1.5 mb-1">
            <span className="text-4xl font-black text-gray-900">
              {plan.price.toLocaleString('ru-RU')} ₸
            </span>
            <span className="text-gray-400 text-sm mb-1.5">{plan.suffix}</span>
          </div>
          {period === 'annual' && (
            <p className="text-xs text-violet-600 font-bold mb-5">
              Экономия {ANNUAL_DISCOUNT.toLocaleString('ru-RU')} ₸ по сравнению с ежемесячной оплатой
            </p>
          )}
          {period === 'monthly' && <div className="mb-5" />}

          {/* Features */}
          <ul className="space-y-2.5">
            {FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                <Check className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
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
          <h2 className="font-black text-gray-900 mb-4">Итого</h2>
          {period === 'annual' ? (
            <>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Tournable Enterprise — Год (12 мес.)</span>
                <span className="text-sm text-gray-400 line-through">{(MONTHLY_PRICE * 12).toLocaleString('ru-RU')} ₸</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-violet-600 font-bold">Скидка −25%</span>
                <span className="font-bold text-violet-600">−{ANNUAL_DISCOUNT.toLocaleString('ru-RU')} ₸</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Tournable Enterprise — Месяц</span>
              <span className="font-black text-gray-900">{plan.price.toLocaleString('ru-RU')} ₸</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-3">
            <span className="font-black text-gray-900">К оплате</span>
            <span className="text-xl font-black text-gray-900">{plan.price.toLocaleString('ru-RU')} ₸</span>
          </div>
        </div>

        {/* Card payment */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-gray-900 mb-4">Оплата картой</h2>
          <CardPaymentForm period={period} amount={plan.price} userEmail={userEmail} planType="enterprise" />
        </div>

        {/* WhatsApp fallback */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[11px] text-gray-400 shrink-0">или оплатите через WhatsApp</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2 mb-3">
            <p className="text-xs text-gray-600 flex-1 leading-relaxed break-all">{message}</p>
            <button
              onClick={handleCopy}
              className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-500"
              title="Скопировать"
            >
              {copied
                ? <CheckCircle2 className="w-4 h-4 text-violet-500" />
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
            Написать в WhatsApp
          </a>
        </div>

      </div>
    </div>
  )
}
