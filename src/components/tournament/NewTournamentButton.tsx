'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Archive, Zap, X, Trophy, Crown, ChevronDown } from 'lucide-react'
import { archiveTournament } from '@/app/actions/tournaments'

interface Props {
  isPro: boolean
  isEnterprise?: boolean
  activeTournament: { id: string; name: string } | null
  label: string
}

export default function NewTournamentButton({ isPro, isEnterprise = false, activeTournament, label }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  function newTournament() {
    setMenuOpen(false)
    if (!isPro && activeTournament) { setShowModal(true); return }
    router.push('/dashboard/new')
  }

  function newChampionship() {
    setMenuOpen(false)
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
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus size={15} /> {label}
          <ChevronDown size={14} className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5 z-50">
            <button
              onClick={newTournament}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <Trophy size={17} className="text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm">Турнир</p>
                <p className="text-xs text-gray-400">Одно соревнование с расписанием</p>
              </div>
            </button>

            <button
              onClick={newChampionship}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-violet-50 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <Crown size={17} className="text-violet-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-gray-900 text-sm">Чемпионат</p>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 leading-none">ENT</span>
                </div>
                <p className="text-xs text-gray-400">Постоянный, с сезонами и игроками</p>
              </div>
            </button>
          </div>
        )}
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
                  <Archive size={17} className="text-gray-600" />
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
