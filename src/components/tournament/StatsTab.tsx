'use client'

import { useState } from 'react'
import { Team, Fixture } from '@/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import TeamAvatar from './TeamAvatar'

type Filter = 'goal' | 'assist' | 'yellow_card' | 'red_card'

const FILTERS: { value: Filter; label: string; color: string }[] = [
  { value: 'goal',        label: '⚽ Голы',     color: 'bg-emerald-600 text-white' },
  { value: 'assist',      label: '🎯 Ассисты',  color: 'bg-blue-600 text-white' },
  { value: 'yellow_card', label: '🟨 ЖК',       color: 'bg-amber-500 text-white' },
  { value: 'red_card',    label: '🟥 КК',       color: 'bg-red-600 text-white' },
]

function buildLeaderboard(teams: Team[], fixtures: Fixture[], type: Filter) {
  const map = new Map<string, { player: string; teamName: string; logoUrl: string | null; count: number }>()

  fixtures.forEach(f => {
    if (!f.played || f.is_bye) return
    f.match_events?.filter(e => e.type === type).forEach(e => {
      const name = e.player_name.trim()
      if (!name) return
      const key = `${e.team_id}|${name.toLowerCase()}`
      const team = teams.find(t => t.id === e.team_id)
      if (!map.has(key)) map.set(key, { player: name, teamName: team?.name ?? '—', logoUrl: team?.logo_url ?? null, count: 0 })
      map.get(key)!.count++
    })
  })

  return [...map.values()].sort((a, b) => b.count - a.count || a.player.localeCompare(b.player, 'ru'))
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function StatsTab({ teams, fixtures }: { teams: Team[]; fixtures: Fixture[] }) {
  const [filter, setFilter] = useState<Filter>('goal')
  const list = buildLeaderboard(teams, fixtures, filter)
  const active = FILTERS.find(f => f.value === filter)!

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
              filter === f.value ? f.color : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-4xl mb-3">{active.label.split(' ')[0]}</p>
          <p className="font-bold text-gray-600">Событий пока нет</p>
          <p className="text-sm text-gray-400 mt-1">Указывайте события при вводе результатов</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12 text-center text-gray-500">#</TableHead>
                <TableHead className="text-gray-700">Игрок</TableHead>
                <TableHead className="text-gray-700">Команда</TableHead>
                <TableHead className="text-center text-gray-700 w-16">{active.label.split(' ')[0]}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p, i) => (
                <TableRow key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <TableCell className="text-center text-lg">{MEDALS[i] ?? i + 1}</TableCell>
                  <TableCell className="font-bold text-gray-900">{p.player}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TeamAvatar name={p.teamName} logoUrl={p.logoUrl} size={20} />
                      <span className="text-gray-500 text-sm">{p.teamName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-black text-lg text-emerald-600">{p.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
