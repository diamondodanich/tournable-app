'use client'

import { useMemo, useState } from 'react'
import type { Team } from '@/types'
import TeamAvatar from './TeamAvatar'
import { Plus, Minus, Loader2 } from 'lucide-react'
import { upsertLeaderboardEntry, setLeaderboardRounds, type LeaderboardEntry } from '@/app/actions/leaderboard'
import { toast } from 'sonner'

type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: { participant: 'Участник', total: 'Итого', round: 'Р', empty: 'Пока нет участников.', addRound: 'Добавить раунд', hint: 'Внесите очки за каждый раунд — рейтинг считается по сумме.' },
  kz: { participant: 'Қатысушы', total: 'Қорытынды', round: 'Р', empty: 'Әзірге қатысушылар жоқ.', addRound: 'Раунд қосу', hint: 'Әр раундқа ұпай енгізіңіз — рейтинг қосынды бойынша.' },
  en: { participant: 'Participant', total: 'Total', round: 'R', empty: 'No participants yet.', addRound: 'Add round', hint: 'Enter points per round — the ranking is by total.' },
} as const

export default function LeaderboardTab({
  tournamentId, teams, entries, isOwner = false, lang = 'ru', brand, initialRounds = 1,
}: {
  tournamentId: string
  teams: Team[]
  entries: LeaderboardEntry[]
  isOwner?: boolean
  lang?: Lang
  brand?: string
  initialRounds?: number
}) {
  const tx = T[lang]
  const accent = brand ?? '#059669'

  const maxRound = entries.reduce((m, e) => Math.max(m, e.round), 0)
  const [rounds, setRounds] = useState(Math.max(1, initialRounds, maxRound))
  const [savingRounds, setSavingRounds] = useState(false)

  // key `${teamId}:${round}` → points
  const [points, setPoints] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {}
    for (const e of entries) m[`${e.team_id}:${e.round}`] = Number(e.points)
    return m
  })

  const totals = useMemo(() => {
    const t: Record<string, number> = {}
    for (const team of teams) {
      let sum = 0
      for (let r = 1; r <= rounds; r++) sum += points[`${team.id}:${r}`] ?? 0
      t[team.id] = sum
    }
    return t
  }, [teams, rounds, points])

  const ranked = useMemo(
    () => [...teams].sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0) || a.name.localeCompare(b.name, 'ru')),
    [teams, totals],
  )

  async function saveCell(teamId: string, round: number, raw: string) {
    const val = raw.trim() === '' ? 0 : Number(raw)
    if (Number.isNaN(val)) return
    setPoints(prev => ({ ...prev, [`${teamId}:${round}`]: val }))
    const res = await upsertLeaderboardEntry(tournamentId, teamId, round, val)
    if (res?.error) toast.error(res.error)
  }

  async function changeRounds(next: number) {
    if (next < 1) return
    setSavingRounds(true)
    setRounds(next)
    const res = await setLeaderboardRounds(tournamentId, next)
    setSavingRounds(false)
    if (res?.error) { toast.error(res.error); return }
    if (next < rounds) {
      // prune pruned-round points from local state
      setPoints(prev => {
        const m: Record<string, number> = {}
        for (const [k, v] of Object.entries(prev)) {
          const r = Number(k.split(':')[1])
          if (r <= next) m[k] = v
        }
        return m
      })
    }
  }

  if (teams.length === 0) {
    return <div className="text-center py-14 text-sm text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">{tx.empty}</div>
  }

  const roundCols = Array.from({ length: rounds }, (_, i) => i + 1)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-400">{tx.hint}</p>
        {isOwner && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => changeRounds(rounds - 1)}
              disabled={savingRounds || rounds <= 1}
              className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <Minus size={13} />
            </button>
            <button
              onClick={() => changeRounds(rounds + 1)}
              disabled={savingRounds}
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-white text-xs font-bold transition-colors disabled:opacity-50"
              style={{ background: accent }}
            >
              {savingRounds ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              {tx.addRound}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="text-left px-3 py-2.5 w-8">#</th>
              <th className="text-left px-3 py-2.5">{tx.participant}</th>
              {roundCols.map(r => (
                <th key={r} className="text-center px-2 py-2.5 w-16 whitespace-nowrap">{tx.round}{r}</th>
              ))}
              <th className="text-center px-3 py-2.5 w-16" style={{ color: accent }}>{tx.total}</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((team, i) => (
              <tr key={team.id} className={i % 2 ? 'bg-gray-50/50' : 'bg-white'}>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${
                    i === 0 ? 'text-white' : 'text-gray-500'
                  }`} style={i === 0 ? { background: accent } : undefined}>{i + 1}</span>
                </td>
                <td className="px-3 py-2 font-bold text-gray-900">
                  <div className="flex items-center gap-2 min-w-0">
                    <TeamAvatar name={team.name} logoUrl={team.logo_url} size={22} />
                    <span className="truncate">{team.name}</span>
                  </div>
                </td>
                {roundCols.map(r => {
                  const key = `${team.id}:${r}`
                  const val = points[key]
                  return (
                    <td key={r} className="px-1 py-1.5 text-center">
                      {isOwner ? (
                        <input
                          type="number"
                          defaultValue={val ?? ''}
                          onBlur={e => saveCell(team.id, r, e.target.value)}
                          className="w-14 h-8 text-center text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 tabular-nums"
                        />
                      ) : (
                        <span className="text-gray-600 tabular-nums">{val ?? '—'}</span>
                      )}
                    </td>
                  )
                })}
                <td className="px-3 py-2 text-center font-black tabular-nums" style={{ color: accent }}>
                  {totals[team.id] ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
