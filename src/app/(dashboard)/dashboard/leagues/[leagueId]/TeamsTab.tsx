'use client'

import { useState, useTransition } from 'react'
import { addLeagueTeam, removeLeagueTeam } from '@/app/actions/leagues'
import { Plus, Trash2, MapPin, Check, X } from 'lucide-react'
import type { LeagueTeam } from '@/types'

export default function TeamsTab({ leagueId, teams }: { leagueId: string; teams: LeagueTeam[] }) {
  const [isPending, startTransition] = useTransition()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState('')

  function handleAdd() {
    if (!name.trim()) { setError('Введите название команды'); return }
    setError('')
    startTransition(() => {
      void (async () => {
        const result = await addLeagueTeam(leagueId, name.trim(), city.trim() || undefined)
        if (result?.error) { setError(result.error); return }
        setAdding(false)
        setName('')
        setCity('')
      })()
    })
  }

  function handleRemove(teamId: string, teamName: string) {
    if (!confirm(`Удалить команду "${teamName}"?`)) return
    startTransition(() => { void removeLeagueTeam(teamId, leagueId) })
  }

  return (
    <div className="space-y-3">
      {teams.length === 0 && !adding && (
        <p className="text-sm text-gray-400 py-4 text-center">Нет команд. Добавьте первую.</p>
      )}

      {teams.map(t => (
        <div key={t.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-xs font-black text-purple-600 shrink-0">
            {t.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gray-900 truncate">{t.name}</p>
            {t.city && (
              <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <MapPin size={10} /> {t.city}
              </p>
            )}
          </div>
          <span className="text-[10px] text-gray-300 font-mono">/teams/{t.slug}</span>
          <button
            onClick={() => handleRemove(t.id, t.name)}
            disabled={isPending}
            className="text-gray-300 hover:text-red-400 transition-colors p-1"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="bg-white rounded-xl border border-purple-200 p-4 space-y-3">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Название команды"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-400 outline-none text-sm"
          />
          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Город (необязательно)"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-400 outline-none text-sm"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={isPending}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              <Check size={14} /> Добавить
            </button>
            <button
              onClick={() => { setAdding(false); setError('') }}
              className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm px-3 py-2 rounded-lg transition-colors"
            >
              <X size={14} /> Отмена
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-purple-600 font-medium transition-colors py-1"
        >
          <Plus size={14} /> Добавить команду
        </button>
      )}
    </div>
  )
}
