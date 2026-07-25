'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Clock, XCircle, MessageCircle, ArrowRight } from 'lucide-react'
import { getPaymentOrderStatus } from '@/app/actions/payments'

// Оплата прошла на стороне FreedomPay, но план выдаёт webhook — а он приходит
// отдельным запросом и может отстать на несколько секунд. Держим пользователя
// на экране ожидания, пока заказ не станет 'paid', и не врём «готово» заранее.

const POLL_INTERVAL_MS = 2000
const TIMEOUT_MS       = 90_000
const WA_URL           = 'https://wa.me/message/YHLE2IFII4MSJ1'

type View = 'waiting' | 'failed' | 'timeout'

export function PaymentPending({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [view, setView] = useState<View>('waiting')

  useEffect(() => {
    let stopped = false
    const startedAt = Date.now()

    async function poll() {
      if (stopped) return

      const { status } = await getPaymentOrderStatus(orderId)
      if (stopped) return

      if (status === 'paid') {
        // Сервер отрисует страницу заново — уже с подтверждённым планом.
        router.refresh()
        return
      }

      if (status === 'failed') {
        setView('failed')
        return
      }

      if (Date.now() - startedAt > TIMEOUT_MS) {
        setView('timeout')
        return
      }

      timer = setTimeout(poll, POLL_INTERVAL_MS)
    }

    let timer = setTimeout(poll, POLL_INTERVAL_MS)
    return () => { stopped = true; clearTimeout(timer) }
  }, [orderId, router])

  const card = 'bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center space-y-6'

  if (view === 'failed') {
    return (
      <div className={card}>
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-500" strokeWidth={1.5} />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-gray-900">Платёж не прошёл</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Банк не подтвердил оплату, деньги не списаны. Попробуйте ещё раз или другой картой.
          </p>
        </div>
        <Link
          href="/checkout"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors"
        >
          Вернуться к оплате
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  if (view === 'timeout') {
    return (
      <div className={card}>
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
            <Clock className="w-10 h-10 text-amber-500" strokeWidth={1.5} />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-gray-900">Оплата обрабатывается</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Подтверждение от банка идёт дольше обычного. Если план не появится в течение
            15 минут — напишите нам, номер заказа уже у нас.
          </p>
        </div>
        <div className="bg-gray-50 rounded-2xl px-4 py-3">
          <p className="text-[11px] text-gray-400 font-bold mb-0.5">Номер заказа</p>
          <p className="text-xs text-gray-700 font-mono break-all">{orderId}</p>
        </div>
        <div className="space-y-3">
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Написать в поддержку
          </a>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors"
          >
            Перейти к турнирам
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={card}>
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" strokeWidth={1.5} />
        </div>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-gray-900">Подтверждаем оплату</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Обычно занимает несколько секунд. Не закрывайте страницу — план откроется сам.
        </p>
      </div>
    </div>
  )
}
