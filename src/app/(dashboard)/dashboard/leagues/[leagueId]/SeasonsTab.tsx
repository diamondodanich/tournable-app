'use client'

import { useState, useTransition } from 'react'
import { addSeason, removeSeason, updateSeason } from '@/app/actions/leagues'
import { Plus, Trash2, ExternalLink, Check, X } from 'lucide-react'
import type { Season } from '@/types'

type TournamentOption = { id: string; name: string }

export default function SeasonsTab({
  leagueId,
  seasons,
  tournaments,
}: {
  leagueId: string
  seasons: Season[]
  tournaments: TournamentOption[]
}) {
  const [isPending, startTransition] = useTransition()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [tournamentId, setTournamentId] = useState('')
  const [error, setError] = useState('')

  function handleAdd() {
    if (!name.trim()) { setError('Введите название'); return }
    setError('')
    startTransition(() => {
      void (async () => {
        const result = await addSeason(leagueId, name.trim(), tournamentId || null)
        if (result?.error) { setError(result.error); return }
        setAdding(false)
        setName('')
        setTournamentId('')
      })()
    })
  }

  function handleRemove(seasonId: string) {
    if (!confirm('Удалить сезон?')) return
    startTransition(() => { void removeSeason(seasonId, leagueId) })
  }

  function handleStatusToggle(season: Season) {
    const next: 'active' | 'finished' = season.status === 'active' ? 'finished' : 'active'
    startTransition(() => { void updateSeason(season.id, leagueId, { status: next }) })
  }

  return (
    <div className="space-y-3">
      {seasons.length === 0 && !adding && (
        <p className="text-sm text-gray-400 py-4 text-center">Нет сезонов. Добавьте первый.</p>
      )}

      {seasons.map(s => (
        <div key={s.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gray-900">{s.name}</p>
            {s.tournament_id && (
              <a
                href={`/dashboard/tournament/${s.tournament_id}`}
                target="_blank"
                className="flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700 mt-0.5"
              >
                <ExternalLink size={10} /> Открыть турнир
              </a>
            )}
          </div>
          <button
            onClick={() => handleStatusToggle(s)}
            disabled={isPending}
            className={`text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
              s.status === 'active'
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {s.status === 'active' ? 'Активный' : 'Завершён'}
          </button>
          <button
            onClick={() => handleRemove(s.id)}
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
            placeholder="Название сезона (напр. Сезон 2025)"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-400 outline-none text-sm"
          />
          <select
            value={tournamentId}
            onChange={e => setTournamentId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-400 outline-none text-sm bg-white"
          >
            <option value="">Турнир не выбран</option>
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
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
          <Plus size={14} /> Добавить сезон
        </button>
      )}
    </div>
  )
}
