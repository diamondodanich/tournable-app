'use client'

import { useState, type ReactNode } from 'react'
import { User, CreditCard, Shield } from 'lucide-react'

const ICONS: Record<string, typeof User> = {
  profile: User,
  subscription: CreditCard,
  settings: Shield,
}

export default function AccountTabs({ tabs }: {
  tabs: { id: string; label: string; content: ReactNode }[]
}) {
  const [active, setActive] = useState(tabs[0]?.id ?? '')
  const current = tabs.find(t => t.id === active) ?? tabs[0]

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(t => {
          const Icon = ICONS[t.id] ?? User
          const isActive = t.id === active
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-500 hover:text-emerald-600 border border-gray-100'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-4">
        {current?.content}
      </div>
    </div>
  )
}
