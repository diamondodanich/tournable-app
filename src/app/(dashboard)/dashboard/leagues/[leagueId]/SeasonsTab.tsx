'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { removeSeason, updateSeason } from '@/app/actions/leagues'
import { Plus, Trash2, ExternalLink } from 'lucide-react'
import type { Season } from '@/types'

export default function SeasonsTab({
  leagueId,
  seasons,
}: {
  leagueId: string
  seasons: Season[]
}) {
  const [isPending, startTransition] = useTransition()

  function handleRemove(seasonId: string) {
    if (!confirm('Удалить сезон? Турнир этого сезона тоже будет удалён.')) return
    startTransition(() => { void removeSeason(seasonId, leagueId) })
  }

  function handleStatusToggle(season: Season) {
    const next: 'active' | 'finished' = season.status === 'active' ? 'finished' : 'active'
    startTransition(() => { void updateSeason(season.id, leagueId, { status: next }) })
  }

  return (
    <div className="space-y-3">
      {seasons.length === 0 && (
        <p className="text-sm text-gray-400 py-4 text-center">Пока нет сезонов. Создайте первый.</p>
      )}

      {seasons.map(s => (
        <div key={s.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gray-900">{s.name}</p>
            {s.tournament_id && (
              <Link
                href={`/dashboard/tournament/${s.tournament_id}`}
                className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-700 mt-0.5"
              >
                <ExternalLink size={10} /> Открыть сезон
              </Link>
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

      <Link
        href={`/dashboard/new?type=championship&league=${leagueId}`}
        className="flex items-center justify-center gap-1.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 transition-colors py-2.5 rounded-xl mt-2"
      >
        <Plus size={15} /> Добавить сезон
      </Link>
      <p className="text-xs text-gray-400 text-center">
        Новый сезон создаётся как турнир с командами чемпионата — формат и расписание выбираются в мастере.
      </p>
    </div>
  )
}
