'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, ChevronDown, Loader2 } from 'lucide-react'
import { adminGrantPlan, type Plan } from '@/app/actions/billing'
import { confirmDialog } from '@/components/ui/confirm'

// Выдача плана вручную — для продаж через менеджера: человек платит в WhatsApp,
// здесь ему открывают доступ. Сумма уходит в subscriptions, иначе эта выручка
// не попадёт в метрики (MRR считается по subscriptions, не по profiles.plan).

const PLAN_BADGE: Record<string, string> = {
  free:       'bg-gray-100 text-gray-500',
  pro:        'bg-emerald-100 text-emerald-700',
  enterprise: 'bg-violet-100 text-violet-700',
}

type Option = {
  key:    string
  label:  string
  plan:   Plan
  months: number | null
  amount: number | null
}

// Суммы — прайс из lib/freedompay. Держим списком здесь, а не импортом: тот
// модуль тянет node:crypto и в клиентский бандл не годится.
const OPTIONS: Option[] = [
  { key: 'pro_m',  label: 'Pro · месяц',        plan: 'pro',        months: 1,  amount: 4990   },
  { key: 'pro_y',  label: 'Pro · год',          plan: 'pro',        months: 12, amount: 44990  },
  { key: 'ent_m',  label: 'Enterprise · месяц', plan: 'enterprise', months: 1,  amount: 39990  },
  { key: 'ent_y',  label: 'Enterprise · год',   plan: 'enterprise', months: 12, amount: 349990 },
  { key: 'free',   label: 'Снять до Free',      plan: 'free',       months: null, amount: null },
]

const KZT = new Intl.NumberFormat('ru-RU')

export default function UserPlanCell({
  userId, email, plan,
}: { userId: string; email: string; plan: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function apply(o: Option) {
    setOpen(false)

    const ok = await confirmDialog({
      title: o.plan === 'free' ? 'Снять план?' : `Выдать ${o.label}?`,
      description: o.plan === 'free'
        ? `${email} потеряет платный доступ сразу.`
        : `${email} получит доступ на ${o.months === 12 ? 'год' : 'месяц'}. ` +
          `В историю платежей запишется ${KZT.format(o.amount!)} ₸ как оплата через менеджера.`,
      tone: o.plan === 'free' ? 'danger' : 'default',
      confirmLabel: o.plan === 'free' ? 'Снять' : 'Выдать',
    })
    if (!ok) return

    setPending(true)
    const res = await adminGrantPlan(userId, o.plan, o.months, o.amount)
    setPending(false)

    if (res.error) { toast.error(res.error); return }

    toast.success(
      res.expiresAt
        ? `${o.label} до ${new Date(res.expiresAt).toLocaleDateString('ru-RU')}`
        : 'План снят',
    )
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-md hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold uppercase ${PLAN_BADGE[plan] ?? PLAN_BADGE.free}`}>
          {plan}
        </span>
        {pending
          ? <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
          : <ChevronDown className="w-3 h-3 text-gray-400" />}
      </button>

      {open && (
        <>
          {/* Клик мимо — закрыть */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            {OPTIONS.map(o => (
              <button
                key={o.key}
                onClick={() => apply(o)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
              >
                <span className={o.plan === 'free' ? 'text-gray-500' : 'font-semibold text-gray-900'}>
                  {o.label}
                </span>
                {o.amount
                  ? <span className="text-[11px] text-gray-400 tabular-nums shrink-0">{KZT.format(o.amount)} ₸</span>
                  : <Check className="w-3 h-3 text-gray-300 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
