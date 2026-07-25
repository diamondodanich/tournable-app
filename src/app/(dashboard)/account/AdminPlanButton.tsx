'use client'

import { useState } from 'react'
import { adminSetPlan } from '@/app/actions/billing'
import { toast } from 'sonner'

type Plan = 'free' | 'pro' | 'enterprise'

export default function AdminPlanButton({ userId, currentPlan }: { userId: string; currentPlan: Plan }) {
  const [loading, setLoading] = useState(false)

  async function switchTo(target: Plan) {
    setLoading(true)

    // Один экшен на все три плана — и он действительно применяется к userId,
    // а не к текущему пользователю. Раньше переход на free шёл через
    // cancelSubscription, которая работает только со своим аккаунтом.
    const result = await adminSetPlan(userId, target)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`План переключён на ${target}`)
      window.location.reload()
    }
    setLoading(false)
  }

  const plans: Plan[] = ['free', 'pro', 'enterprise']
  const colors: Record<Plan, string> = {
    free: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    pro: 'bg-emerald-600 text-white hover:bg-emerald-700',
    enterprise: 'bg-violet-600 text-white hover:bg-violet-700',
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {plans.map(p => (
        <button
          key={p}
          disabled={loading || currentPlan === p}
          onClick={() => switchTo(p)}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${colors[p]} ${currentPlan === p ? 'ring-2 ring-offset-1 ring-violet-400' : ''}`}
        >
          {currentPlan === p ? `${p} (текущий)` : `→ ${p}`}
        </button>
      ))}
    </div>
  )
}
