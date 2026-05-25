'use client'

import { useState } from 'react'
import { Trophy, X } from 'lucide-react'
import TeamAvatar from './TeamAvatar'
import type { Team } from '@/types'

export default function ChampionBanner({
  champion,
  runnerUp,
  label = 'Чемпион турнира',
}: {
  champion: Team
  runnerUp?: Team | null
  label?: string
}) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 shadow-lg p-5">

      {/* Decorative corner stars */}
      <span className="absolute top-3 left-5 text-amber-300/70 text-xl select-none">★</span>
      <span className="absolute top-2 right-12 text-amber-200/70 text-sm select-none">★</span>
      <span className="absolute bottom-3 left-10 text-amber-200/60 text-sm select-none">★</span>
      <span className="absolute bottom-2 right-6 text-amber-300/70 text-xl select-none">★</span>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-amber-400 hover:text-amber-700 transition-colors"
        aria-label="Закрыть"
      >
        <X size={15} />
      </button>

      {/* Content */}
      <div className="flex flex-col items-center text-center gap-3">

        {/* Trophy */}
        <Trophy size={48} className="text-amber-500 animate-bounce" style={{ animationDuration: '2s' }} />

        {/* Label */}
        <p className="text-xs font-black uppercase tracking-widest text-amber-600">
          {label}
        </p>

        {/* Champion */}
        <div className="flex items-center gap-2.5 bg-white/70 rounded-2xl px-5 py-2.5 shadow-sm">
          <TeamAvatar name={champion.name} logoUrl={champion.logo_url} size={40} />
          <p className="text-xl font-black text-amber-900 leading-tight">
            {champion.name}
          </p>
        </div>

        {/* Runner-up */}
        {runnerUp && (
          <div className="flex items-center gap-2 text-amber-700 text-sm font-semibold">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-300 text-gray-600 text-[10px] font-black shrink-0">2</span>
            <TeamAvatar name={runnerUp.name} logoUrl={runnerUp.logo_url} size={20} />
            <span>{runnerUp.name}</span>
          </div>
        )}
      </div>
    </div>
  )
}
