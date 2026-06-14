'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Lock, Loader2, ShieldCheck } from 'lucide-react'
import { getPaymentOrderParams } from '@/app/actions/payments'
import type { PlanPeriod } from '@/lib/freedompay'

const WIDGET_TOKEN = process.env.NEXT_PUBLIC_FREEDOMPAY_WIDGET_TOKEN ?? ''
const SDK_URL = 'https://cdn.freedompay.kz/sdk/js-sdk-1.0.0.js'
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwK4PMP3KqzgjLZ+b6V/3
aDxCQ6rqsAEu/4vxjV3abTgT8e/2vQ/+o7Sh9zAd2O7JfeCFAIX6sZuA3rzNLWXJ
beLJC2YCcrYwNF0x9mZVNUmLWAncZh5EY6jkReuHaEa2DLbagwzdir4l/KS50RD3
xoUZEI8eORRgvhOLphuVDNsgoO32CvdkYL0LYMUpKXyV7biefy9SfXaknM/gvtFW
UacHPlG+P0tdfr3d8jmXJky5ur8kuwOe3BdM1tAcelHL9NWWdRXkrkT8jFqB/8XE
rTKy74vrHQvvng2Qxb8a0iwY4hGizlLysl9Fg9Zhjmc9R0qaxTDbaBd3AX1icIMn
xwIDAQAB
-----END PUBLIC KEY-----`

declare global {
  interface Window {
    FreedomPaySDK: {
      setup: (publicKey: string, token: string) => void
      charge: (
        payment: object,
        transaction: object,
      ) => Promise<{ payment_status: string; payment_id?: string }>
      confirmInIframe: (
        result: object,
        containerId: string,
      ) => Promise<{ payment_status: string }>
    }
  }
}

interface Props {
  period:    PlanPeriod
  amount:    number
  userEmail?: string
}

type Step = 'form' | '3ds' | 'success' | 'error'

function formatCardNumber(raw: string) {
  return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 4)
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

export function CardPaymentForm({ period, amount, userEmail }: Props) {
  const [sdkReady, setSdkReady] = useState(false)
  const [sdkError, setSdkError] = useState(false)

  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [expiry, setExpiry]         = useState('')
  const [cvv, setCvv]               = useState('')

  const [isPending, setIsPending] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [rawError, setRawError]   = useState<string | null>(null)
  const [step, setStep]           = useState<Step>('form')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const script = document.createElement('script')
    script.src = SDK_URL
    script.onload = () => {
      try {
        window.FreedomPaySDK.setup(PUBLIC_KEY, WIDGET_TOKEN)
        setSdkReady(true)
      } catch {
        setSdkError(true)
      }
    }
    script.onerror = () => setSdkError(true)
    document.head.appendChild(script)
    return () => { script.remove() }
  }, [])

  const canPay =
    sdkReady &&
    !isPending &&
    cardNumber.replace(/\s/g, '').length === 16 &&
    cardHolder.trim().length >= 2 &&
    expiry.length === 5 &&
    cvv.length === 3

  async function handlePay() {
    setError(null)
    setIsPending(true)

    try {
      const order = await getPaymentOrderParams(period)
      if ('error' in order) { setError(order.error); return }

      const [expMonth, expYear] = expiry.split('/')

      let result = await window.FreedomPaySDK.charge(
        {
          order_id:      order.orderId,
          amount,
          currency:      'KZT',
          description:   order.description,
          auto_clearing: 1,
          options: {
            custom_params: { user_id: order.userId, plan_period: period },
            user: { email: userEmail ?? '' },
          },
        },
        {
          type: 'bank_card',
          options: {
            card_number:      cardNumber.replace(/\s/g, ''),
            card_holder_name: cardHolder.trim(),
            card_exp_month:   expMonth,
            card_exp_year:    expYear,
            card_cvv:         Number(cvv),
          },
        },
      )

      if (result.payment_status === 'need_confirm') {
        setStep('3ds')
        result = await window.FreedomPaySDK.confirmInIframe(result, 'fp-3ds-container')
      }

      if (result.payment_status === 'success') {
        window.location.href = '/checkout/success'
      } else {
        setError('Платёж отклонён. Проверьте данные карты и попробуйте снова.')
        setStep('form')
      }
    } catch (err: unknown) {
      const raw = JSON.stringify(err, Object.getOwnPropertyNames(err as object), 2)
      console.error('[FreedomPay] full error:', raw)
      setRawError(raw)
      const msg =
        (err as { response?: { error_message?: string } })?.response?.error_message ??
        (err instanceof Error ? err.message : 'Ошибка при оплате')
      setError(msg)
      setStep('form')
    } finally {
      setIsPending(false)
    }
  }

  if (sdkError) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
        Не удалось загрузить платёжный модуль. Попробуйте обновить страницу.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {step === 'form' && (
        <>
          {/* Card number */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">
              Номер карты
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
                className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-sm font-mono tracking-wider focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
              />
              <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
            </div>
          </div>

          {/* Card holder */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">
              Имя владельца
            </label>
            <input
              type="text"
              autoComplete="cc-name"
              placeholder="ASKAR DANIIAR"
              value={cardHolder}
              onChange={e => setCardHolder(e.target.value.toUpperCase().replace(/[^A-Z\s]/g, ''))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
            />
          </div>

          {/* Expiry + CVV */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                Срок действия
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="ММ/ГГ"
                value={expiry}
                onChange={e => setExpiry(formatExpiry(e.target.value))}
                maxLength={5}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono tracking-wider focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                CVV / CVC
              </label>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="•••"
                value={cvv}
                onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                maxLength={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {rawError && (
            <details className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <summary className="text-xs font-bold text-gray-500 cursor-pointer">Лог ошибки (для техподдержки)</summary>
              <pre className="text-[10px] text-gray-600 mt-2 whitespace-pre-wrap break-all select-all">{rawError}</pre>
            </details>
          )}

          {/* Pay button */}
          <button
            onClick={handlePay}
            disabled={!canPay}
            className="flex items-center justify-center gap-2.5 w-full text-white font-black py-4 rounded-xl transition-all hover:opacity-90 text-sm shadow-md disabled:opacity-40 disabled:cursor-not-allowed mt-1"
            style={{ background: 'linear-gradient(135deg,#047857,#10b981)' }}
          >
            {isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Lock className="w-4 h-4" />
            }
            {isPending ? 'Обработка...' : `Оплатить ${amount.toLocaleString('ru-RU')} ₸`}
          </button>

          {/* Trust line */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck className="w-3 h-3" />
            <span>Защищено FreedomPay · PCI DSS · 3D Secure</span>
          </div>
        </>
      )}

      {/* 3DS iframe */}
      {step === '3ds' && (
        <div className="rounded-xl overflow-hidden border border-gray-200">
          <div className="bg-gray-50 px-4 py-2 flex items-center gap-2 border-b border-gray-100">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-bold text-gray-600">Подтверждение банком (3D Secure)</span>
          </div>
          <div id="fp-3ds-container" className="w-full min-h-[420px]" />
        </div>
      )}
    </div>
  )
}
