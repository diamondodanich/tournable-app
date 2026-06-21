'use client'

import { useState } from 'react'
import { Team, MatchEvent } from '@/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Goal, Handshake, RectangleVertical } from 'lucide-react'
import TeamAvatar from './TeamAvatar'
import { tx, type Lang } from '@/lib/i18n'

type Filter = 'goal' | 'assist' | 'yellow_card' | 'red_card'

function buildLeaderboard(teams: Team[], events: MatchEvent[], type: Filter) {
  const map = new Map<string, { player: string; teamName: string; logoUrl: string | null; count: number }>()

  events.filter(e => e.type === type).forEach(e => {
    const name = e.player_name.trim()
    if (!name) return
    const key = `${e.team_id}|${name.toLowerCase()}`
    const team = teams.find(t => t.id === e.team_id)
    if (!map.has(key)) map.set(key, { player: name, teamName: team?.name ?? '—', logoUrl: team?.logo_url ?? null, count: 0 })
    map.get(key)!.count++
  })

  return [...map.values()].sort((a, b) => b.count - a.count || a.player.localeCompare(b.player, 'ru'))
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 0) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-amber-900 text-[10px] font-black">1</span>
  if (rank === 1) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-300 text-gray-700 text-[10px] font-black">2</span>
  if (rank === 2) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/50 text-amber-100 text-[10px] font-black">3</span>
  return <span className="text-gray-400 text-sm font-bold">{rank + 1}</span>
}

export default function StatsTab({ teams, events, lang = 'ru' }: { teams: Team[]; events: MatchEvent[]; lang?: Lang }) {
  const T = tx[lang]
  const FILTERS: {
    value: Filter
    label: string
    short: string
    color: string
    icon: React.ElementType
    iconColor: string
  }[] = [
    { value: 'goal',        label: T.statTopScorers, short: T.statGoalsCol,   color: 'bg-emerald-600 text-white', icon: Goal,              iconColor: 'bg-emerald-100 text-emerald-600' },
    { value: 'assist',      label: T.statAssists,    short: T.statAssistsCol, color: 'bg-blue-600 text-white',    icon: Handshake,         iconColor: 'bg-blue-100 text-blue-600' },
    { value: 'yellow_card', label: T.statYellowCards, short: T.statYCCol,     color: 'bg-amber-500 text-white',   icon: RectangleVertical, iconColor: 'bg-amber-100 text-amber-600' },
    { value: 'red_card',    label: T.statRedCards,   short: T.statRCCol,      color: 'bg-red-600 text-white',     icon: RectangleVertical, iconColor: 'bg-red-100 text-red-600' },
  ]
  const [filter, setFilter] = useState<Filter>('goal')
  const list = buildLeaderboard(teams, events, filter)
  const active = FILTERS.find(f => f.value === filter)!

  const ActiveIcon = active.icon

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => {
          const Icon = f.icon
          const isActive = filter === f.value
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                isActive ? f.color : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon size={15} className="shrink-0" />
              <span>{f.label}</span>
            </button>
          )
        })}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${active.iconColor}`}>
            <ActiveIcon size={26} />
          </div>
          <p className="font-bold text-gray-600">{T.statEmpty(active.label)}</p>
          <p className="text-sm text-gray-400 mt-1">{T.statHint}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-14 text-center text-gray-500">#</TableHead>
                <TableHead className="text-gray-700">{T.colPlayer}</TableHead>
                <TableHead className="text-gray-700">{T.colTeam}</TableHead>
                <TableHead className="text-center text-gray-700 w-16">{active.short}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p, i) => (
                <TableRow key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <TableCell className="text-center"><RankBadge rank={i} /></TableCell>
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
