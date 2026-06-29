'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Archive, Zap, X, Trophy, Crown, Loader2 } from 'lucide-react'
import { archiveTournament } from '@/app/actions/tournaments'

interface Props {
  isPro: boolean
  isEnterprise?: boolean
  activeTournament: { id: string; name: string } | null
  label: string
}

export default function NewTournamentButton({ isPro, isEnterprise = false, activeTournament, label }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const router = useRouter()

  function newTournament() {
    if (!isPro && activeTournament) { setShowModal(true); return }
    router.push('/dashboard/new')
  }

  function newChampionship() {
    if (!isEnterprise) { router.push('/checkout/enterprise'); return }
    router.push('/dashboard/new?type=championship')
  }

  async function handleArchive() {
    if (!activeTournament) return
    setArchiving(true)
    const result = await archiveTournament(activeTournament.id)
    if (result.ok) {
      setShowModal(false)
      router.push('/dashboard/new')
    } else {
      setArchiving(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        {/* Tournament — solid primary */}
        <button
          onClick={newTournament}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus size={14} /> {label}
        </button>

        {/* Championship — outline violet, always visible */}
        <button
          onClick={newChampionship}
          className="inline-flex items-center gap-1.5 border-2 border-violet-300 text-violet-700 hover:bg-violet-50 hover:border-violet-400 bg-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
        >
          <Crown size={14} />
          Чемпионат
          {!isEnterprise && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 leading-none ml-0.5">ENT</span>
          )}
        </button>
      </div>

      {showModal && activeTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">У вас активен турнир</p>
              <p className="font-black text-gray-900 text-base leading-snug">
                «{activeTournament.name}»
              </p>
            </div>

            <p className="text-sm text-gray-600 mb-5">
              Выберите действие:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleArchive}
                disabled={archiving}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center shrink-0 transition-colors">
                  {archiving ? <Loader2 size={17} className="animate-spin text-gray-400" /> : <Archive size={17} className="text-gray-600" />}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">
                    {archiving ? 'Архивирование…' : 'Архивировать его'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Турнир будет скрыт, данные сохранятся</p>
                </div>
              </button>

              <a
                href="/pricing"
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Zap size={17} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-emerald-800 text-sm">Запустить оба — Pro</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Безлимитные турниры и все возможности</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
