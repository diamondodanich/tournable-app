'use client'

import { useState, useTransition } from 'react'
import { Check, Copy, Star, MessageCircle, CheckCircle2, CreditCard, Loader2 } from 'lucide-react'
import { initiatePayment } from '@/app/actions/payments'

const MONTHLY_PRICE = 4990
const PLANS = {
  monthly: { label: 'Месяц', price: MONTHLY_PRICE,            suffix: '/ месяц', save: null },
  annual:  { label: 'Год',   price: 44990,                    suffix: '/ год',   save: 'Скидка −25%' },
}
// Реальная скидка: 4990 × 12 − 44990 = 14890 ₸
const ANNUAL_DISCOUNT = MONTHLY_PRICE * 12 - PLANS.annual.price

const FEATURES = [
  'Неограниченные турниры',
  'До 64 команд в турнире',
  'Live-табло в реальном времени',
  'До 3 соредакторов',
  'Все форматы (круговой, плей-офф, групповой)',
  'Экспорт PDF и PNG',
  'Статистика игроков и команд',
  'Приоритетная поддержка',
]

interface Props {
  userEmail?: string
}

export function CheckoutForm({ userEmail }: Props) {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handlePay() {
    startTransition(() => initiatePayment(period))
  }

  const plan = PLANS[period]

  const message = [
    `Tournable Про — ${plan.label}.`,
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Gradient top */}
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
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#047857,#10b981)' }}>
              <Star className="w-3.5 h-3.5 text-white" fill="currentColor" />
            </div>
            <span className="font-black text-lg text-gray-900">Про</span>
          </div>

          <div className="flex items-end gap-1.5 mb-1">
            <span className="text-4xl font-black text-gray-900">
              {plan.price.toLocaleString('ru-RU')} ₸
            </span>
            <span className="text-gray-400 text-sm mb-1.5">{plan.suffix}</span>
          </div>
          {period === 'annual' && (
            <p className="text-xs text-emerald-600 font-bold mb-5">
              Экономия {ANNUAL_DISCOUNT.toLocaleString('ru-RU')} ₸ по сравнению с ежемесячной оплатой
            </p>
          )}
          {period === 'monthly' && <div className="mb-5" />}

          {/* Features */}
          <ul className="space-y-2.5">
            {FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right — payment instructions */}
      <div className="space-y-4">

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-gray-900 mb-4">Итого</h2>
          {period === 'annual' ? (
            <>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Tournable Про — Год (12 мес.)</span>
                <span className="text-sm text-gray-400 line-through">{(MONTHLY_PRICE * 12).toLocaleString('ru-RU')} ₸</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-emerald-600 font-bold">Скидка −25%</span>
                <span className="font-bold text-emerald-600">−{ANNUAL_DISCOUNT.toLocaleString('ru-RU')} ₸</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Tournable Про — Месяц</span>
              <span className="font-black text-gray-900">{plan.price.toLocaleString('ru-RU')} ₸</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-3">
            <span className="font-black text-gray-900">К оплате</span>
            <span className="text-xl font-black text-gray-900">{plan.price.toLocaleString('ru-RU')} ₸</span>
          </div>
        </div>

        {/* Payment button */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-black text-gray-900">Оплата</h2>

          {/* Primary: card payment */}
          <button
            onClick={handlePay}
            disabled={isPending}
            className="flex items-center justify-center gap-2.5 w-full text-white font-black py-4 rounded-xl transition-opacity hover:opacity-90 text-sm shadow-lg disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#047857,#10b981)' }}
          >
            {isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <CreditCard className="w-4 h-4" />
            }
            {isPending ? 'Перенаправляем…' : 'Оплатить картой'}
          </button>

          <p className="text-center text-[11px] text-gray-400">
            Visa · Mastercard · Kaspi Pay — защищённый платёж FreedomPay
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[11px] text-gray-400 shrink-0">или</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Fallback: WhatsApp */}
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-2">Оплата через WhatsApp</p>
            <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2 mb-3">
              <p className="text-xs text-gray-600 flex-1 leading-relaxed break-all">{message}</p>
              <button
                onClick={handleCopy}
                className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-500"
                title="Скопировать"
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
              Написать в WhatsApp
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
