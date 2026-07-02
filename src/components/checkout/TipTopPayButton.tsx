'use client'

import { useState, useEffect } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'
import { getPaymentOrderParams, activateProAfterPayment, activateEnterpriseAfterPayment } from '@/app/actions/payments'
import { PUBLIC_ID, WIDGET_SCRIPT_URL, type PlanPeriod, type PlanType } from '@/lib/tiptoppay'

interface WidgetCompleteResult {
  type: string
  status: string
  data?: { transactionId?: number | string }
  message?: string
}

declare global {
  interface Window {
    tiptop?: {
      Widget: new () => {
        start: (params: Record<string, unknown>) => Promise<unknown>
        oncomplete?: (result: WidgetCompleteResult) => void
        close: () => void
      }
    }
  }
}

interface Props {
  period:     PlanPeriod
  amount:     number
  userEmail?: string
  planType?:  PlanType
}

const GRADIENTS: Record<PlanType, string> = {
  pro:        'linear-gradient(135deg,#047857,#10b981)',
  enterprise: 'linear-gradient(135deg,#7c3aed,#a855f7)',
}

export function TipTopPayButton({ period, amount, userEmail, planType = 'pro' }: Props) {
  const [scriptReady, setScriptReady] = useState(false)
  const [scriptError, setScriptError] = useState(false)
  const [isPending, setIsPending]     = useState(false)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.tiptop) { setScriptReady(true); return }

    const script = document.createElement('script')
    script.src = WIDGET_SCRIPT_URL
    script.onload  = () => setScriptReady(true)
    script.onerror = () => setScriptError(true)
    document.head.appendChild(script)
    return () => { script.remove() }
  }, [])

  async function handlePay() {
    if (!window.tiptop) return

    if (!PUBLIC_ID) {
      setError('Платёжный модуль не настроен: отсутствует идентификатор терминала. Напишите нам — мы быстро поможем.')
      return
    }

    setError(null)
    setIsPending(true)

    try {
      const order = await getPaymentOrderParams(period, planType)
      if ('error' in order) { setError(order.error); setIsPending(false); return }

      const widget = new window.tiptop.Widget()

      widget.oncomplete = async (result: WidgetCompleteResult) => {
        if (result.status === 'success') {
          setIsPending(true)
          const txId = result.data?.transactionId != null ? String(result.data.transactionId) : ''
          const activation = planType === 'enterprise'
            ? await activateEnterpriseAfterPayment(period, txId, 'cloudpayments')
            : await activateProAfterPayment(period, txId, 'cloudpayments')

          setIsPending(false)
          if ('error' in activation) {
            setError(`Оплата прошла, но план не активировался: ${activation.error}`)
            return
          }
          window.location.href = '/checkout/success'
        } else if (result.status === 'fail' || result.status === 'reject') {
          setIsPending(false)
          setError(result.message ?? 'Платёж не прошёл')
        } else {
          // 'cancel' — user closed the widget without paying
          setIsPending(false)
        }
      }

      widget.start({
        publicTerminalId: PUBLIC_ID,
        description:      order.description,
        amount,
        currency:         'KZT',
        externalId:       order.orderId,
        paymentSchema:    'Single',
        // accountId/email must live under userInfo — top-level accountId/email
        // are not part of the widget's CreateIntentCommand shape.
        userInfo: {
          accountId: order.userId,
          email:     userEmail,
        },
        metadata: {
          user_id:     order.userId,
          plan_period: period,
          plan_type:   planType,
        },
      }).catch((err: unknown) => {
        setIsPending(false)
        setError(err instanceof Error ? err.message : 'Не удалось открыть платёжную форму. Попробуйте ещё раз.')
      })

      // The widget overlay is open now — stop the button spinner so the page
      // doesn't look stuck behind it. oncomplete drives the rest.
      setIsPending(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при оплате')
      setIsPending(false)
    }
  }

  if (scriptError) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
        Не удалось загрузить платёжный модуль. Попробуйте обновить страницу.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <p className="text-[11px] text-gray-400 text-center leading-relaxed">
        Нажимая «Оплатить», вы подтверждаете согласие с{' '}
        <a
          href="/terms"
          className={`hover:underline ${planType === 'enterprise' ? 'text-violet-500' : 'text-emerald-500'}`}
        >
          условиями оферты
        </a>
      </p>

      <button
        onClick={handlePay}
        disabled={!scriptReady || isPending}
        className="flex items-center justify-center gap-2.5 w-full text-white font-black py-4 rounded-xl transition-all hover:opacity-90 text-sm shadow-md disabled:opacity-40 disabled:cursor-not-allowed mt-1"
        style={{ background: GRADIENTS[planType] }}
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {isPending ? 'Обработка...' : 'Оплатить'}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
        <ShieldCheck className="w-3 h-3" />
        <span>Защищено · PCI DSS · 3D Secure</span>
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
    </div>
  )
}
