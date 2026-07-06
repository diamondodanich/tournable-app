'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BarChart2, Crown, ChevronUp, ChevronDown, Users, User } from 'lucide-react'
import TeamAvatar from '@/components/tournament/TeamAvatar'
import type { ChampPlayerStat, ChampTeamStat } from '@/app/actions/leagues'

type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: {
    empty: 'Статистика появится после первых сыгранных матчей.',
    hint: 'Сквозная статистика по всем сезонам чемпионата',
    players: 'Игроки', teams: 'Команды',
    player: 'Игрок', team: 'Команда', mp: 'И', goals: 'Г', assists: 'А', yellow: 'ЖК', red: 'КК', seasons: 'Сез.',
    gp: 'И', w: 'В', d: 'Н', l: 'П', gf: 'ЗМ', ga: 'ПМ', gd: '±', pts: 'О', topScorer: 'Лучший бомбардир',
  },
  kz: {
    empty: 'Статистика алғашқы ойналған матчтардан кейін пайда болады.',
    hint: 'Чемпионаттың барлық маусымдары бойынша жиынтық статистика',
    players: 'Ойыншылар', teams: 'Командалар',
    player: 'Ойыншы', team: 'Команда', mp: 'О', goals: 'Г', assists: 'А', yellow: 'СК', red: 'ҚК', seasons: 'Мау.',
    gp: 'О', w: 'Ж', d: 'Т', l: 'Ұ', gf: 'ЗМ', ga: 'ӨМ', gd: '±', pts: 'Ұп', topScorer: 'Үздік бомбардир',
  },
  en: {
    empty: 'Stats appear after the first matches are played.',
    hint: 'Cumulative statistics across all championship seasons',
    players: 'Players', teams: 'Teams',
    player: 'Player', team: 'Team', mp: 'MP', goals: 'G', assists: 'A', yellow: 'YC', red: 'RC', seasons: 'Ssn',
    gp: 'P', w: 'W', d: 'D', l: 'L', gf: 'GF', ga: 'GA', gd: '±', pts: 'Pts', topScorer: 'Top scorer',
  },
} as const

function useSort<T>(rows: T[], initialKey: keyof T) {
  const [key, setKey] = useState<keyof T>(initialKey)
  const [dir, setDir] = useState<1 | -1>(-1)
  const sorted = [...rows].sort((a, b) => {
    const av = a[key], bv = b[key]
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av).localeCompare(String(bv)) * dir
  })
  function toggle(k: keyof T) {
    if (k === key) setDir(d => (d === 1 ? -1 : 1))
    else { setKey(k); setDir(-1) }
  }
  return { sorted, key, dir, toggle }
}

function SortHead<T>({ label, k, sort, align = 'center' }: { label: string; k: keyof T; sort: ReturnType<typeof useSort<T>>; align?: 'left' | 'center' }) {
  const active = sort.key === k
  return (
    <th className={`px-2 py-2 ${align === 'left' ? 'text-left px-3' : 'text-center'} cursor-pointer select-none whitespace-nowrap`} onClick={() => sort.toggle(k)}>
      <span className={`inline-flex items-center gap-0.5 ${active ? 'text-violet-700' : ''}`}>
        {label}
        {active && (sort.dir === -1 ? <ChevronDown size={11} /> : <ChevronUp size={11} />)}
      </span>
    </th>
  )
}

export default function ChampStatsTab({ stats, teamStats = [], lang = 'ru', slug }: {
  stats: ChampPlayerStat[]
  teamStats?: ChampTeamStat[]
  lang?: Lang
  slug?: string
}) {
  const tx = T[lang]
  const [view, setView] = useState<'players' | 'teams'>('players')

  const pSort = useSort<ChampPlayerStat>(stats, 'goals')
  const tSort = useSort<ChampTeamStat>(teamStats, 'Pts')

  if (stats.length === 0 && teamStats.length === 0) {
    return (
      <div className="text-center py-14">
        <BarChart2 className="mx-auto mb-3 text-gray-300" size={36} />
        <p className="text-sm text-gray-400 max-w-sm mx-auto">{tx.empty}</p>
      </div>
    )
  }

  const top = stats[0]

  return (
    <div className="space-y-4">
      {top && top.goals > 0 && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-white" style={{ background: 'linear-gradient(135deg,#5b21b6,#8b5cf6)' }}>
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 overflow-hidden">
            {top.photo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={top.photo} alt="" className="w-full h-full object-cover" />
              : <Crown size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-200">{tx.topScorer}</p>
            <p className="font-black text-sm truncate">{top.player} <span className="text-violet-200 font-medium">· {top.teamName}</span></p>
          </div>
          <span className="text-2xl font-black tabular-nums shrink-0">{top.goals}</span>
        </div>
      )}

      {/* Players / Teams toggle */}
      <div className="flex gap-1.5">
        {([['players', tx.players, User], ['teams', tx.teams, Users]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setView(id)}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${view === id ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400">{tx.hint}</p>

      {view === 'players' && (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-100">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="bg-purple-50 text-purple-700 text-xs">
                <th className="text-left px-3 py-2 w-8">#</th>
                <th className="text-left px-3 py-2">{tx.player}</th>
                <th className="text-left px-3 py-2">{tx.team}</th>
                <SortHead<ChampPlayerStat> label={tx.mp} k="matchesPlayed" sort={pSort} />
                <SortHead<ChampPlayerStat> label={tx.goals} k="goals" sort={pSort} />
                <SortHead<ChampPlayerStat> label={tx.assists} k="assists" sort={pSort} />
                <SortHead<ChampPlayerStat> label={tx.yellow} k="yellow" sort={pSort} />
                <SortHead<ChampPlayerStat> label={tx.red} k="red" sort={pSort} />
                <SortHead<ChampPlayerStat> label={tx.seasons} k="seasons" sort={pSort} />
              </tr>
            </thead>
            <tbody>
              {pSort.sorted.map((s, i) => (
                <tr key={`${s.teamName}|${s.player}`} className={i % 2 ? 'bg-gray-50/60' : 'bg-white'}>
                  <td className="px-3 py-2 text-gray-400 font-bold">{i + 1}</td>
                  <td className="px-3 py-2 font-bold text-gray-900">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center text-[9px] font-black text-gray-500">
                        {s.photo
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={s.photo} alt="" className="w-full h-full object-cover" />
                          : s.player.slice(0, 2).toUpperCase()}
                      </span>
                      {slug && s.playerId
                        ? <Link href={`/leagues/${slug}/players/${s.playerId}`} className="truncate hover:text-violet-700 hover:underline">{s.player}</Link>
                        : <span className="truncate">{s.player}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <TeamAvatar name={s.teamName} logoUrl={s.teamLogo} size={18} />
                      {slug && s.teamSlug
                        ? <Link href={`/leagues/${slug}/teams/${s.teamSlug}`} className="truncate max-w-[120px] hover:text-violet-700 hover:underline">{s.teamName}</Link>
                        : <span className="truncate max-w-[120px]">{s.teamName}</span>}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center text-gray-500 tabular-nums">{s.matchesPlayed}</td>
                  <td className="px-2 py-2 text-center font-black text-purple-700 tabular-nums">{s.goals}</td>
                  <td className="px-2 py-2 text-center text-gray-600 tabular-nums">{s.assists}</td>
                  <td className="px-2 py-2 text-center tabular-nums">{s.yellow || <span className="text-gray-300">—</span>}</td>
                  <td className="px-2 py-2 text-center tabular-nums">{s.red || <span className="text-gray-300">—</span>}</td>
                  <td className="px-2 py-2 text-center text-gray-500 tabular-nums">{s.seasons}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'teams' && (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-100">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="bg-purple-50 text-purple-700 text-xs">
                <th className="text-left px-3 py-2 w-8">#</th>
                <th className="text-left px-3 py-2">{tx.team}</th>
                <SortHead<ChampTeamStat> label={tx.seasons} k="seasons" sort={tSort} />
                <SortHead<ChampTeamStat> label={tx.gp} k="GP" sort={tSort} />
                <SortHead<ChampTeamStat> label={tx.w} k="W" sort={tSort} />
                <SortHead<ChampTeamStat> label={tx.d} k="D" sort={tSort} />
                <SortHead<ChampTeamStat> label={tx.l} k="L" sort={tSort} />
                <SortHead<ChampTeamStat> label={tx.gf} k="GF" sort={tSort} />
                <SortHead<ChampTeamStat> label={tx.ga} k="GA" sort={tSort} />
                <SortHead<ChampTeamStat> label={tx.gd} k="GD" sort={tSort} />
                <SortHead<ChampTeamStat> label={tx.pts} k="Pts" sort={tSort} />
              </tr>
            </thead>
            <tbody>
              {tSort.sorted.map((s, i) => (
                <tr key={s.teamName} className={i % 2 ? 'bg-gray-50/60' : 'bg-white'}>
                  <td className="px-3 py-2 text-gray-400 font-bold">{i + 1}</td>
                  <td className="px-3 py-2 font-bold text-gray-900">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamAvatar name={s.teamName} logoUrl={s.logo} size={20} />
                      {slug && s.teamSlug
                        ? <Link href={`/leagues/${slug}/teams/${s.teamSlug}`} className="truncate hover:text-violet-700 hover:underline">{s.teamName}</Link>
                        : <span className="truncate">{s.teamName}</span>}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center text-gray-500 tabular-nums">{s.seasons}</td>
                  <td className="px-2 py-2 text-center text-gray-600 tabular-nums">{s.GP}</td>
                  <td className="px-2 py-2 text-center text-emerald-600 font-bold tabular-nums">{s.W}</td>
                  <td className="px-2 py-2 text-center text-gray-600 tabular-nums">{s.D}</td>
                  <td className="px-2 py-2 text-center text-red-500 tabular-nums">{s.L}</td>
                  <td className="px-2 py-2 text-center text-gray-600 tabular-nums">{s.GF}</td>
                  <td className="px-2 py-2 text-center text-gray-600 tabular-nums">{s.GA}</td>
                  <td className={`px-2 py-2 text-center font-bold tabular-nums ${s.GD > 0 ? 'text-emerald-600' : s.GD < 0 ? 'text-red-500' : 'text-gray-400'}`}>{s.GD > 0 ? `+${s.GD}` : s.GD}</td>
                  <td className="px-2 py-2 text-center font-black text-purple-700 tabular-nums">{s.Pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
