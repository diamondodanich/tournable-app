import { BarChart2, Crown } from 'lucide-react'
import type { ChampPlayerStat } from '@/app/actions/leagues'

type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: {
    empty: 'Статистика появится после первых сыгранных матчей с событиями (голы, ассисты, карточки).',
    hint: 'Сквозная статистика по всем сезонам чемпионата',
    player: 'Игрок',
    team: 'Команда',
    goals: 'Г',
    assists: 'А',
    yellow: 'ЖК',
    red: 'КК',
    seasons: 'Сезоны',
    topScorer: 'Лучший бомбардир',
  },
  kz: {
    empty: 'Статистика оқиғалары бар алғашқы матчтардан кейін пайда болады (голдар, ассисттер, карточкалар).',
    hint: 'Чемпионаттың барлық маусымдары бойынша жиынтық статистика',
    player: 'Ойыншы',
    team: 'Команда',
    goals: 'Г',
    assists: 'А',
    yellow: 'СК',
    red: 'ҚК',
    seasons: 'Маусымдар',
    topScorer: 'Үздік бомбардир',
  },
  en: {
    empty: 'Statistics appear after the first matches with events (goals, assists, cards).',
    hint: 'Cumulative statistics across all championship seasons',
    player: 'Player',
    team: 'Team',
    goals: 'G',
    assists: 'A',
    yellow: 'YC',
    red: 'RC',
    seasons: 'Seasons',
    topScorer: 'Top scorer',
  },
} as const

export default function ChampStatsTab({ stats, lang = 'ru' }: { stats: ChampPlayerStat[]; lang?: Lang }) {
  const tx = T[lang]

  if (stats.length === 0) {
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
      {/* Top scorer highlight */}
      {top.goals > 0 && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-white"
          style={{ background: 'linear-gradient(135deg,#5b21b6,#8b5cf6)' }}>
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Crown size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-200">{tx.topScorer}</p>
            <p className="font-black text-sm truncate">{top.player} <span className="text-violet-200 font-medium">· {top.teamName}</span></p>
          </div>
          <span className="text-2xl font-black tabular-nums shrink-0">{top.goals}</span>
        </div>
      )}

      <p className="text-xs text-gray-400">{tx.hint}</p>

      <div className="overflow-x-auto bg-white rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-purple-50 text-purple-700 text-xs">
              <th className="text-left px-3 py-2 w-8">#</th>
              <th className="text-left px-3 py-2">{tx.player}</th>
              <th className="text-left px-3 py-2">{tx.team}</th>
              <th className="text-center px-2 py-2 w-10 font-black">{tx.goals}</th>
              <th className="text-center px-2 py-2 w-10">{tx.assists}</th>
              <th className="text-center px-2 py-2 w-10">{tx.yellow}</th>
              <th className="text-center px-2 py-2 w-10">{tx.red}</th>
              <th className="text-center px-2 py-2 w-16">{tx.seasons}</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s, i) => (
              <tr key={`${s.teamName}|${s.player}`} className={i % 2 ? 'bg-gray-50/60' : 'bg-white'}>
                <td className="px-3 py-2 text-gray-400 font-bold">{i + 1}</td>
                <td className="px-3 py-2 font-bold text-gray-900">{s.player}</td>
                <td className="px-3 py-2 text-gray-500 truncate max-w-[140px]">{s.teamName}</td>
                <td className="px-2 py-2 text-center font-black text-purple-700 tabular-nums">{s.goals}</td>
                <td className="px-2 py-2 text-center text-gray-600 tabular-nums">{s.assists}</td>
                <td className="px-2 py-2 text-center tabular-nums">
                  {s.yellow > 0 ? <span className="inline-flex items-center gap-1"><span className="w-2 h-3 bg-yellow-400 rounded-[2px] inline-block" />{s.yellow}</span> : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-2 py-2 text-center tabular-nums">
                  {s.red > 0 ? <span className="inline-flex items-center gap-1"><span className="w-2 h-3 bg-red-500 rounded-[2px] inline-block" />{s.red}</span> : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-2 py-2 text-center text-gray-500 tabular-nums">{s.seasons}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
