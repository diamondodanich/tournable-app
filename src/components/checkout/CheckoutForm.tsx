'use client'

import { useState } from 'react'
import { Check, Copy, Star, MessageCircle, CheckCircle2 } from 'lucide-react'

const PLANS = {
  monthly: { label: 'Месяц', price: 4990, suffix: '/ месяц', save: null },
  annual:  { label: 'Год',   price: 44990, suffix: '/ год',   save: 'Скидка −25%' },
}

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
              Экономия 14 900 ₸ по сравнению с ежемесячной оплатой
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
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Tournable Про — {plan.label}</span>
            <span className="font-black text-gray-900">{plan.price.toLocaleString('ru-RU')} ₸</span>
          </div>
          {period === 'annual' && (
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm text-emerald-600 font-bold">Скидка −25%</span>
              <span className="font-bold text-emerald-600">−14 990 ₸</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-3">
            <span className="font-black text-gray-900">К оплате</span>
            <span className="text-xl font-black text-gray-900">{plan.price.toLocaleString('ru-RU')} ₸</span>
          </div>
        </div>

        {/* How to pay */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-gray-900 mb-5">Как оплатить</h2>

          <ol className="space-y-4">
            {/* Step 1 */}
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black text-white mt-0.5"
                style={{ background: 'linear-gradient(135deg,#047857,#10b981)' }}>1</div>
              <div>
                <p className="text-sm font-bold text-gray-800 mb-1">Скопируйте сообщение</p>
                <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
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
              </div>
            </li>

            {/* Step 2 */}
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black text-white mt-0.5"
                style={{ background: 'linear-gradient(135deg,#047857,#10b981)' }}>2</div>
              <div>
                <p className="text-sm font-bold text-gray-800 mb-1">Напишите нам в WhatsApp</p>
                <p className="text-xs text-gray-400 leading-relaxed">Вставьте скопированное сообщение — мы пришлём реквизиты для оплаты.</p>
              </div>
            </li>

            {/* Step 3 */}
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black text-white mt-0.5"
                style={{ background: 'linear-gradient(135deg,#047857,#10b981)' }}>3</div>
              <div>
                <p className="text-sm font-bold text-gray-800 mb-1">Активация аккаунта</p>
                <p className="text-xs text-gray-400 leading-relaxed">После подтверждения оплаты активируем Про в течение нескольких часов.</p>
              </div>
            </li>
          </ol>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-center gap-2 w-full text-white font-black py-3.5 rounded-xl transition-opacity hover:opacity-90 text-sm shadow-lg"
            style={{ background: 'linear-gradient(135deg,#047857,#10b981)' }}
          >
            <MessageCircle className="w-4 h-4" />
            Написать в WhatsApp
          </a>

          <p className="text-center text-[11px] text-gray-400 mt-3">
            Оплата принимается через Kaspi Pay и банковские карты
          </p>
        </div>

      </div>
    </div>
  )
}
