'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelSubscription } from '@/app/actions/billing'

export default function CancelSubscriptionButton() {
  const router = useRouter()
  const [step, setStep]       = useState<'idle' | 'confirm' | 'pending'>('idle')
  const [error, setError]     = useState<string | null>(null)

  async function handleCancel() {
    setStep('pending')
    setError(null)
    const result = await cancelSubscription()
    if (result.error) {
      setError(result.error)
      setStep('confirm')
      return
    }
    router.refresh()
    setStep('idle')
  }

  if (step === 'idle') {
    return (
      <button
        onClick={() => setStep('confirm')}
        className="text-xs text-gray-400 hover:text-red-500 transition-colors underline underline-offset-2"
      >
        Отменить подписку
      </button>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4 space-y-3">
        <p className="text-sm font-semibold text-red-700">Вы уверены?</p>
        <p className="text-xs text-red-500 leading-relaxed">
          Автопродление будет отключено. Доступ к Pro сохранится до конца
          оплаченного периода, дальнейшие списания не производятся.
          Вы сможете снова оформить подписку в любой момент.
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
          >
            Да, отменить
          </button>
          <button
            onClick={() => { setStep('idle'); setError(null) }}
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold transition-colors"
          >
            Назад
          </button>
        </div>
      </div>
    )
  }

  return (
    <p className="text-xs text-gray-400">Отменяем подписку...</p>
  )
}
