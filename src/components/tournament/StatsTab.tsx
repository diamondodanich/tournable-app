'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Team, MatchEvent } from '@/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Handshake, RectangleVertical, Lock, Zap, Shield, AlertTriangle, Flame, Target, Star, XCircle } from 'lucide-react'
import TeamAvatar from './TeamAvatar'
import { tx, type Lang } from '@/lib/i18n'
import { SoccerBall, BasketballBall } from '@/components/icons/sport-icons'
import { getEventDefs, type EventDef, type EventIcon } from '@/lib/sports'

const BASKETBALL_SPORTS = new Set(['basketball', 'streetball', 'ebasketball'])

function GoalIcon({ size, className, sport }: { size: number; className?: string; sport?: string }) {
  const s = sport ?? ''
  const ball = BASKETBALL_SPORTS.has(s)
    ? <BasketballBall className="w-full h-full" />
    : <SoccerBall className="w-full h-full" />
  return (
    <div
      style={{ width: size, height: size, flexShrink: 0 }}
      className={`inline-flex items-center justify-center ${className ?? ''}`}
    >
      {ball}
    </div>
  )
}

// Icon + accent colours per discipline event kind (Stats leaderboards).
function StatMark({ icon, size, className, sport }: { icon: EventIcon; size: number; className?: string; sport?: string }) {
  switch (icon) {
    case 'ball':       return <GoalIcon size={size} className={className} sport={sport} />
    case 'assist':     return <Handshake size={size} className={className} />
    case 'yellow':
    case 'red':        return <RectangleVertical size={size} className={className} />
    case 'warn':
    case 'foul':       return <AlertTriangle size={size} className={className} />
    case 'ace':        return <Zap size={size} className={className} />
    case 'block':      return <Shield size={size} className={className} />
    case 'ko':         return <Flame size={size} className={className} />
    case 'submission': return <Lock size={size} className={className} />
    case 'three':      return <Target size={size} className={className} />
    case 'strike':     return <XCircle size={size} className={className} />
    default:           return <Star size={size} className={className} />
  }
}

// active-button + empty-state accent classes keyed by icon
const STAT_COLORS: Record<EventIcon, { color: string; iconColor: string; brand?: boolean }> = {
  ball:       { color: 'text-white', iconColor: '', brand: true },
  assist:     { color: 'bg-blue-600 text-white',   iconColor: 'bg-blue-100 text-blue-600' },
  yellow:     { color: 'bg-amber-500 text-white',  iconColor: 'bg-amber-100 text-amber-600' },
  red:        { color: 'bg-red-600 text-white',    iconColor: 'bg-red-100 text-red-600' },
  warn:       { color: 'bg-amber-500 text-white',  iconColor: 'bg-amber-100 text-amber-600' },
  foul:       { color: 'bg-amber-500 text-white',  iconColor: 'bg-amber-100 text-amber-600' },
  ace:        { color: 'bg-sky-600 text-white',    iconColor: 'bg-sky-100 text-sky-600' },
  block:      { color: 'bg-indigo-600 text-white', iconColor: 'bg-indigo-100 text-indigo-600' },
  ko:         { color: 'bg-red-600 text-white',    iconColor: 'bg-red-100 text-red-600' },
  submission: { color: 'bg-gray-800 text-white',   iconColor: 'bg-gray-100 text-gray-700' },
  three:      { color: 'bg-orange-600 text-white', iconColor: 'bg-orange-100 text-orange-600' },
  strike:     { color: 'bg-red-600 text-white',    iconColor: 'bg-red-100 text-red-600' },
  touchdown:  { color: 'text-white', iconColor: '', brand: true },
  run:        { color: 'text-white', iconColor: '', brand: true },
  star:       { color: 'text-white', iconColor: '', brand: true },
}

function buildLeaderboard(teams: Team[], events: MatchEvent[], type: string) {
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

export default function StatsTab({
  teams, events, lang = 'ru', sport, hideUpsell = false,
}: {
  teams: Team[]
  events: MatchEvent[]
  lang?: Lang
  sport?: string
  hideUpsell?: boolean
}) {
  const T = tx[lang]
  // Leaderboards are built from the discipline's stat-eligible events.
  const statDefs: EventDef[] = getEventDefs(sport).filter(d => d.stat)
  const FILTERS = statDefs.map(def => {
    const c = STAT_COLORS[def.icon]
    return {
      value: def.type,
      label: def.label[lang],
      short: def.label[lang],
      color: c.color,
      iconColor: c.iconColor,
      brand: !!c.brand,
      icon: def.icon,
    }
  })

  const [filter, setFilter] = useState<string>(statDefs[0]?.type ?? 'goal')
  const active = FILTERS.find(f => f.value === filter) ?? FILTERS[0]
  const list = buildLeaderboard(teams, events, active?.value ?? filter)

  // Disciplines with no per-player events (chess, esports…) show no leaderboards.
  if (FILTERS.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <p className="font-bold text-gray-600">{T.statHint}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => {
          const isActive = filter === f.value
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={isActive && f.brand ? { background: 'var(--sp)' } : undefined}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                isActive ? f.color : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <StatMark icon={f.icon} size={15} className="shrink-0" sport={sport} />
              <span>{f.label}</span>
            </button>
          )
        })}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${active.brand ? 'bg-gray-100' : active.iconColor}`}
            style={active.brand ? { color: 'var(--sp)' } : undefined}>
            <StatMark icon={active.icon} size={26} sport={sport} />
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
                  <TableCell className="text-center font-black text-lg" style={{ color: 'var(--sp)' }}>{p.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Enterprise preview — season player profiles. Hidden for Enterprise users
          and inside championships (no locks where the feature is already unlocked). */}
      {!hideUpsell && (
      <div className="relative rounded-2xl overflow-hidden border border-gray-100 mt-2">
        <div className="select-none pointer-events-none opacity-40 p-4 space-y-2.5" aria-hidden>
          {[['А. Иванов', '18', '12'], ['Б. Петров', '16', '9'], ['В. Сидоров', '14', '7']].map(([name, games, stat]) => (
            <div key={name} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-24 mb-1" />
                <div className="h-2.5 bg-gray-100 rounded w-16" />
              </div>
              <div className="text-right">
                <div className="h-3 bg-gray-200 rounded w-12 mb-1" />
                <div className="h-2.5 bg-gray-100 rounded w-8 ml-auto" />
              </div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[3px]">
          <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center mb-3 shadow-lg">
            <Lock size={18} className="text-white" />
          </div>
          <p className="text-sm font-black text-gray-900 mb-0.5">{T.fullPlayerStatsTitle}</p>
          <p className="text-xs text-gray-400 mb-3">Enterprise</p>
          <Link
            href="/pricing#enterprise"
            className="text-xs font-bold px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            {T.learnMore}
          </Link>
        </div>
      </div>
      )}
    </div>
  )
}
