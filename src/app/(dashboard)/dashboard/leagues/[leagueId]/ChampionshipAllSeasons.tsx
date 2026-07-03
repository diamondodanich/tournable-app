'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Layers, Users, BarChart3, Crown, ArrowRight, Loader2, Trophy } from 'lucide-react'
import ChampionshipSeasonBar from '@/components/championship/ChampionshipSeasonBar'
import ChampStatsTab from './ChampStatsTab'
import { getChampionshipPlayerStats, type ChampPlayerStat } from '@/app/actions/leagues'

type Lang = 'ru' | 'kz' | 'en'
type SeasonLite = { id: string; name: string; status: string; tournament_id: string | null; format: string | null }

const T = {
  ru: {
    tabs: { overview: 'Обзор', stats: 'Статистика' },
    seasons: 'Сезоны', teams: 'Команды', players: 'Игроки',
    active: 'Активный', finished: 'Завершён',
    openSeason: 'Открыть', seasonsList: 'Сезоны чемпионата', noSeasons: 'Пока нет сезонов',
    allTimeStats: 'Статистика за всю историю',
  },
  kz: {
    tabs: { overview: 'Шолу', stats: 'Статистика' },
    seasons: 'Маусымдар', teams: 'Командалар', players: 'Ойыншылар',
    active: 'Белсенді', finished: 'Аяқталды',
    openSeason: 'Ашу', seasonsList: 'Чемпионат маусымдары', noSeasons: 'Әзірге маусымдар жоқ',
    allTimeStats: 'Барлық тарих статистикасы',
  },
  en: {
    tabs: { overview: 'Overview', stats: 'Stats' },
    seasons: 'Seasons', teams: 'Teams', players: 'Players',
    active: 'Active', finished: 'Finished',
    openSeason: 'Open', seasonsList: 'Championship seasons', noSeasons: 'No seasons yet',
    allTimeStats: 'All-time statistics',
  },
} as const

function tableTab(format: string | null): string {
  if (format === 'groups_playoff') return 'group-standings'
  if (format === 'playoff') return 'playoff'
  return 'standings'
}

export default function ChampionshipAllSeasons({ league, seasons, teamsCount, playersCount, lang = 'ru', isOwner = false }: {
  league: { id: string; name: string; slug: string; sport: string | null; logo_url: string | null }
  seasons: SeasonLite[]
  teamsCount: number
  playersCount: number
  lang?: Lang
  isOwner?: boolean
}) {
  const tx = T[lang]
  const [tab, setTab] = useState<'overview' | 'stats'>('overview')
  const [stats, setStats] = useState<ChampPlayerStat[] | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  async function openStats() {
    setTab('stats')
    if (stats === null && !statsLoading) {
      setStatsLoading(true)
      try { setStats(await getChampionshipPlayerStats(league.id)) }
      finally { setStatsLoading(false) }
    }
  }

  const cards = [
    { label: tx.seasons, value: seasons.length, icon: Layers },
    { label: tx.teams, value: teamsCount, icon: Users },
    { label: tx.players, value: playersCount, icon: Crown },
  ]

  return (
    <div className="space-y-5">
      <ChampionshipSeasonBar league={league} seasons={seasons} currentSeasonId={null} lang={lang} isOwner={isOwner} />

      {/* Tabs */}
      <div className="flex gap-1.5">
        {([
          { id: 'overview' as const, label: tx.tabs.overview, icon: Layers },
          { id: 'stats' as const, label: tx.tabs.stats, icon: BarChart3 },
        ]).map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id}
              onClick={() => t.id === 'stats' ? openStats() : setTab('overview')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                active ? 'bg-violet-600 text-white shadow-sm' : 'bg-white text-gray-500 hover:text-violet-600 border border-gray-100'
              }`}>
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {cards.map(c => {
              const Icon = c.icon
              return (
                <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                  <Icon size={16} className="text-violet-400 mx-auto mb-1.5" />
                  <p className="text-2xl font-black text-gray-900">{c.value}</p>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">{c.label}</p>
                </div>
              )
            })}
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">{tx.seasonsList}</p>
            {seasons.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">{tx.noSeasons}</p>
            ) : (
              <div className="space-y-2">
                {seasons.map(s => (
                  <div key={s.id} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                      <Trophy size={16} className="text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{s.name}</p>
                      <span className={`text-[10px] font-bold ${s.status === 'active' ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {s.status === 'active' ? tx.active : tx.finished}
                      </span>
                    </div>
                    {s.tournament_id && (
                      <Link href={`/dashboard/tournament/${s.tournament_id}?tab=${tableTab(s.format)}`}
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-violet-600 hover:text-violet-700 shrink-0">
                        {tx.openSeason} <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">{tx.allTimeStats}</p>
          {statsLoading
            ? <div className="flex items-center justify-center py-16 text-violet-400"><Loader2 className="animate-spin" size={22} /></div>
            : <ChampStatsTab stats={stats ?? []} lang={lang} />}
        </div>
      )}
    </div>
  )
}
