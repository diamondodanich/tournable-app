'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Lock, Loader2, ShieldCheck } from 'lucide-react'
import { getPaymentOrderParams, activateProAfterPayment, activateEnterpriseAfterPayment } from '@/app/actions/payments'
import type { PlanPeriod, PlanType } from '@/lib/freedompay'

// Widget token is merchant/environment-specific (test vs production) — env-driven
// so switching to the production terminal is an env var change, not a code change.
const WIDGET_TOKEN = process.env.NEXT_PUBLIC_FREEDOMPAY_WIDGET_TOKEN ?? 'OEusiPqD0YsZeBZbCcxqkB4QlLBIxbVP'
const SDK_URL = 'https://cdn.freedompay.kz/sdk/js-sdk-1.0.0.js'
// SDK-wide transport key, same for every merchant/environment — not env-specific.
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAj04TlTFEhwJDaXO6NoNr
/7h72RAeGChRkBPvgTTOSxGmHTpEC9MwtiyE/Qk7lBhyj9DwT2JsmiP1Se4m+8lG
dxdqUNwrEo/6wbLdps1C44LZafkjrMXfqz4m8k3ShNbBWGuaEqB36XNYijPyEUzX
dVzEt99gTRnp27wrpxmGJY/rRY/H+u2rQxph0qLxByCtDTG2LjyVG9Inmmmp1E0K
+79m2JyPoSLLax2ebga/jUioR9ARnWIhq7hJz4WkxADtnd4Fgsl8oABzYtDT9+cd
/5I4oNPamRdiQawL8+hte7pcuKhm8xRd2NvNMV57W8XkGd+CHj5XyQYm7AiNg8Um
vwIDAQAB
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

type Lang = 'ru' | 'kz' | 'en'

interface Props {
  period:     PlanPeriod
  amount:     number
  userEmail?: string
  planType?:  PlanType
  lang?:      Lang
}

type Step = 'form' | '3ds'

const T = {
  ru: {
    cardNumber: 'Номер карты', cardHolder: 'Имя владельца', expiry: 'Срок действия', cvv: 'CVV / CVC',
    consentPre: 'Нажимая «Оплатить», вы подтверждаете согласие с', offerLink: 'условиями оферты',
    processing: 'Обработка...', pay: (a: string) => `Оплатить ${a} ₸`,
    secured: 'Защищено · PCI DSS · 3D Secure', confirm3ds: 'Подтверждение банком (3D Secure)',
    scriptFailed: 'Не удалось загрузить платёжный модуль. Попробуйте обновить страницу.',
    activatedNoPlan: (e: string) => `Оплата прошла, но план не активировался: ${e}`,
    paymentFailed: (s: string) => `Платёж не прошёл. Статус: ${s}`, payError: 'Ошибка при оплате',
    comingSoon: 'Скоро', cardSoon: 'Оплата картой скоро будет доступна — пока оформляем через менеджера.',
  },
  kz: {
    cardNumber: 'Карта нөмірі', cardHolder: 'Иесінің аты', expiry: 'Қолданылу мерзімі', cvv: 'CVV / CVC',
    consentPre: '«Төлеу» батырмасын басу арқылы сіз', offerLink: 'оферта шарттарымен келісесіз',
    processing: 'Өңделуде...', pay: (a: string) => `Төлеу ${a} ₸`,
    secured: 'Қорғалған · PCI DSS · 3D Secure', confirm3ds: 'Банк растауы (3D Secure)',
    scriptFailed: 'Төлем модулін жүктеу мүмкін болмады. Бетті жаңартып көріңіз.',
    activatedNoPlan: (e: string) => `Төлем өтті, бірақ жоспар белсендірілмеді: ${e}`,
    paymentFailed: (s: string) => `Төлем өтпеді. Мәртебесі: ${s}`, payError: 'Төлем кезінде қате',
    comingSoon: 'Жақында', cardSoon: 'Картамен төлеу жақында қолжетімді болады — әзірге менеджер арқылы рәсімдейміз.',
  },
  en: {
    cardNumber: 'Card number', cardHolder: 'Cardholder name', expiry: 'Expiry', cvv: 'CVV / CVC',
    consentPre: 'By clicking “Pay” you agree to the', offerLink: 'terms of the offer',
    processing: 'Processing...', pay: (a: string) => `Pay ${a} ₸`,
    secured: 'Secured · PCI DSS · 3D Secure', confirm3ds: 'Bank confirmation (3D Secure)',
    scriptFailed: 'Could not load the payment module. Please refresh the page.',
    activatedNoPlan: (e: string) => `Payment went through, but the plan wasn’t activated: ${e}`,
    paymentFailed: (s: string) => `Payment failed. Status: ${s}`, payError: 'Payment error',
    comingSoon: 'Coming soon', cardSoon: 'Card payment is coming soon — for now we set it up via a manager.',
  },
} as const

// Gateway is not live yet (FreedomPay production terminal pending, ~7 business
// days as of 2026-07-03) → show the button as "coming soon" and route users to
// the manager (WhatsApp). Flip to true once the production token is in .env/Vercel.
const CARD_PAYMENTS_ENABLED = false

const GRADIENTS: Record<PlanType, string> = {
  pro:        'linear-gradient(135deg,#047857,#10b981)',
  enterprise: 'linear-gradient(135deg,#7c3aed,#a855f7)',
}

function formatCardNumber(raw: string) {
  return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 4)
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

export function CardPaymentForm({ period, amount, userEmail, planType = 'pro', lang = 'ru' }: Props) {
  const tx = T[lang]
  const [sdkReady, setSdkReady] = useState(false)
  const [sdkError, setSdkError] = useState(false)

  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [expiry, setExpiry]         = useState('')
  const [cvv, setCvv]               = useState('')

  const [isPending, setIsPending] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [step, setStep]           = useState<Step>('form')

  useEffect(() => {
    if (!CARD_PAYMENTS_ENABLED) return           // gateway off — don't load the SDK
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
      const order = await getPaymentOrderParams(period, planType)
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
            custom_params: { user_id: order.userId, plan_period: period, plan_type: planType },
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
        const activation = planType === 'enterprise'
          ? await activateEnterpriseAfterPayment(period, result.payment_id ?? '')
          : await activateProAfterPayment(period, result.payment_id ?? '')
        if ('error' in activation) {
          setError(tx.activatedNoPlan(activation.error))
          setStep('form')
          return
        }
        window.location.href = '/checkout/success'
      } else {
        setError(tx.paymentFailed(result.payment_status))
        setStep('form')
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { error_message?: string } })?.response?.error_message ??
        (err instanceof Error ? err.message : tx.payError)
      setError(msg)
      setStep('form')
    } finally {
      setIsPending(false)
    }
  }

  if (sdkError) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
        {tx.scriptFailed}
      </div>
    )
  }

  if (!CARD_PAYMENTS_ENABLED) {
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-gray-400 text-center leading-relaxed">
          {tx.cardSoon}
        </p>
        <button
          disabled
          className="flex items-center justify-center gap-2.5 w-full text-white font-black py-4 rounded-xl text-sm shadow-md opacity-40 cursor-not-allowed mt-1"
          style={{ background: GRADIENTS[planType] }}
        >
          {tx.pay('')} · {tx.comingSoon}
        </button>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <ShieldCheck className="w-3 h-3" />
          <span>{tx.secured}</span>
        </div>
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
              {tx.cardNumber}
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
              {tx.cardHolder}
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
                {tx.expiry}
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
                {tx.cvv}
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

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <p className="text-[11px] text-gray-400 text-center leading-relaxed">
            {tx.consentPre}{' '}
            <a
              href="/terms"
              className={`hover:underline ${planType === 'enterprise' ? 'text-violet-500' : 'text-emerald-500'}`}
            >
              {tx.offerLink}
            </a>
          </p>

          <button
            onClick={handlePay}
            disabled={!canPay}
            className="flex items-center justify-center gap-2.5 w-full text-white font-black py-4 rounded-xl transition-all hover:opacity-90 text-sm shadow-md disabled:opacity-40 disabled:cursor-not-allowed mt-1"
            style={{ background: GRADIENTS[planType] }}
          >
            {isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Lock className="w-4 h-4" />
            }
            {isPending ? tx.processing : tx.pay(amount.toLocaleString('ru-RU'))}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck className="w-3 h-3" />
            <span>{tx.secured}</span>
          </div>

          {/* Payment system logos */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <svg width="44" height="14" viewBox="0 0 44 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Visa">
              <rect width="44" height="14" rx="2" fill="#1A1F71"/>
              <text x="22" y="10.5" fill="white" fontFamily="Arial, sans-serif" fontSize="9" fontStyle="italic" fontWeight="bold" textAnchor="middle">VISA</text>
            </svg>
            <svg width="34" height="22" viewBox="0 0 34 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard">
              <circle cx="12" cy="11" r="10" fill="#EB001B"/>
              <circle cx="22" cy="11" r="10" fill="#F79E1B"/>
              <path d="M17 3.27a10 10 0 0 1 0 15.46A10 10 0 0 1 17 3.27z" fill="#FF5F00"/>
            </svg>
          </div>
        </>
      )}

      {step === '3ds' && (
        <div className="rounded-xl overflow-hidden border border-gray-200">
          <div className="bg-gray-50 px-4 py-2 flex items-center gap-2 border-b border-gray-100">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-bold text-gray-600">{tx.confirm3ds}</span>
          </div>
          <div id="fp-3ds-container" className="w-full min-h-[420px]" />
        </div>
      )}
    </div>
  )
}
