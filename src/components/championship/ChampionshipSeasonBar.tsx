'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ChevronLeft, ChevronDown, Check, CalendarDays, Settings, Plus, LayoutGrid, Loader2,
} from 'lucide-react'
import TeamAvatar from '@/components/tournament/TeamAvatar'
import { getSportTheme } from '@/lib/sports'
import { addSeasonQuick } from '@/app/actions/leagues'

type Lang = 'ru' | 'kz' | 'en'

type SeasonLite = { id: string; name: string; status: string; tournament_id: string | null; format: string | null }

const T = {
  ru: {
    back: 'Все турниры', allSeasons: 'Все сезоны', addSeason: 'Добавить сезон',
    active: 'Активный', settings: 'Настройки', adding: 'Создаём сезон…', switch: 'Сменить сезон',
  },
  kz: {
    back: 'Барлық турнирлер', allSeasons: 'Барлық маусымдар', addSeason: 'Маусым қосу',
    active: 'Белсенді', settings: 'Баптаулар', adding: 'Маусым жасалуда…', switch: 'Маусымды ауыстыру',
  },
  en: {
    back: 'All tournaments', allSeasons: 'All seasons', addSeason: 'Add season',
    active: 'Active', settings: 'Settings', adding: 'Creating season…', switch: 'Switch season',
  },
} as const

function tableTab(format: string | null): string {
  if (format === 'groups_playoff') return 'group-standings'
  if (format === 'playoff') return 'playoff'
  return 'standings'
}

export default function ChampionshipSeasonBar({ league, seasons, currentSeasonId, lang = 'ru', isOwner = false }: {
  league: { id: string; name: string; slug: string; sport: string | null; logo_url: string | null }
  seasons: SeasonLite[]
  currentSeasonId: string | null
  lang?: Lang
  isOwner?: boolean
}) {
  const tx = T[lang]
  const router = useRouter()
  const theme = getSportTheme(league.sport)
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)

  // currentSeasonId === null → "All seasons" mode (championship overview page).
  const allSeasonsMode = currentSeasonId === null
  const current = seasons.find(s => s.id === currentSeasonId)
  const buttonLabel = allSeasonsMode ? tx.allSeasons : current?.name

  function goToSeason(s: SeasonLite) {
    setOpen(false)
    if (s.id === currentSeasonId || !s.tournament_id) return
    router.push(`/dashboard/tournament/${s.tournament_id}?tab=${tableTab(s.format)}`)
  }

  async function handleAdd() {
    setOpen(false)
    setAdding(true)
    const res = await addSeasonQuick(league.id)
    setAdding(false)
    if (res.error) { toast.error(res.error); return }
    if (res.tournamentId) router.push(`/dashboard/tournament/${res.tournamentId}?tab=standings`)
  }

  return (
    <div className="relative rounded-2xl text-white shadow-sm px-5 py-4"
      style={{ background: `linear-gradient(135deg, ${theme.primaryDark} 0%, ${theme.primary} 100%)` }}>

      <Link href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors mb-3">
        <ChevronLeft size={14} /> {tx.back}
      </Link>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 rounded-xl ring-2 ring-white/30 overflow-hidden bg-white/10">
            <TeamAvatar name={league.name} logoUrl={league.logo_url} size={48} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-black leading-tight truncate">{league.name}</h1>

            {/* Season selector — Flashscore-style, not clipped */}
            <div className="relative mt-1.5 inline-block">
              <button
                onClick={() => setOpen(v => !v)}
                disabled={adding}
                title={tx.switch}
                className="inline-flex items-center gap-1.5 text-sm font-bold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {adding ? <Loader2 size={13} className="animate-spin" /> : <CalendarDays size={13} />}
                <span className="truncate max-w-[180px]">{adding ? tx.adding : buttonLabel}</span>
                {!adding && <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />}
              </button>

              {open && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                  <div className="absolute z-50 mt-1.5 left-0 min-w-[240px] bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 text-gray-900 max-h-80 overflow-auto">
                    {seasons.map(s => (
                      <button key={s.id} onClick={() => goToSeason(s)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left">
                        <span className="flex-1 text-sm font-bold truncate">{s.name}</span>
                        {s.status === 'active' && (
                          <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{tx.active}</span>
                        )}
                        {s.id === currentSeasonId && <Check size={14} className="shrink-0" style={{ color: theme.primary }} />}
                      </button>
                    ))}

                    <div className="border-t border-gray-100 my-1" />

                    <Link href={`/dashboard/leagues/${league.id}?view=all`} onClick={() => setOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                      <LayoutGrid size={15} className="text-gray-400" />
                      <span className="flex-1">{tx.allSeasons}</span>
                      {allSeasonsMode && <Check size={14} className="shrink-0" style={{ color: theme.primary }} />}
                    </Link>

                    {isOwner && (
                      <button onClick={handleAdd}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-sm font-bold"
                        style={{ color: theme.primary }}>
                        <Plus size={15} /> {tx.addSeason}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {isOwner && (
          <Link href={`/dashboard/leagues/${league.id}/settings`}
            title={tx.settings}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-bold bg-white/15 hover:bg-white/25 transition-colors shrink-0">
            <Settings size={15} />
            <span className="hidden sm:inline">{tx.settings}</span>
          </Link>
        )}
      </div>
    </div>
  )
}
