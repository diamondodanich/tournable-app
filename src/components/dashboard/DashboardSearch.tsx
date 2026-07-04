'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, Users, User, Trophy, Loader2, X } from 'lucide-react'
import { searchDashboard, type SearchResult } from '@/app/actions/search'

type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: { placeholder: 'Поиск команды или игрока…', empty: 'Ничего не найдено', hint: 'Введите минимум 2 символа' },
  kz: { placeholder: 'Команда не ойыншы іздеу…', empty: 'Ештеңе табылмады', hint: 'Кемінде 2 таңба енгізіңіз' },
  en: { placeholder: 'Search a team or player…', empty: 'Nothing found', hint: 'Type at least 2 characters' },
} as const

const ICON: Record<SearchResult['type'], typeof Users> = {
  team: Trophy, champTeam: Users, player: User,
}

export default function DashboardSearch({ lang = 'ru' }: { lang?: Lang }) {
  const tx = T[lang]
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults([]); setLoading(false); return }
    setLoading(true)
    const handle = setTimeout(async () => {
      try {
        const res = await searchDashboard(q)
        setResults(res)
      } finally {
        setLoading(false)
      }
    }, 280)
    return () => clearTimeout(handle)
  }, [query])

  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const showPanel = open && query.trim().length >= 1

  return (
    <div className="relative w-full sm:max-w-xs" ref={ref}>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={tx.placeholder}
          className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 bg-white/80 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]) }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
            <X size={14} />
          </button>
        )}
      </div>

      {showPanel && (
        <div className="absolute z-40 mt-1.5 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-96 overflow-y-auto">
          {query.trim().length < 2 ? (
            <p className="px-4 py-3 text-xs text-gray-400">{tx.hint}</p>
          ) : loading ? (
            <div className="flex items-center justify-center py-6"><Loader2 size={18} className="animate-spin text-gray-300" /></div>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">{tx.empty}</p>
          ) : (
            results.map((r, i) => {
              const Icon = ICON[r.type]
              return (
                <Link key={i} href={r.href} onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">{r.label}</p>
                    {r.sub && <p className="text-xs text-gray-400 truncate">{r.sub}</p>}
                  </div>
                </Link>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
