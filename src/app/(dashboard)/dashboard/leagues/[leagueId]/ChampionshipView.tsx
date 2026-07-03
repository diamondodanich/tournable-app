'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ExternalLink, Globe, ChevronDown, Check, Crown,
  Layers, Users, BarChart3, Settings as SettingsIcon, CalendarDays, Loader2, ArrowRight,
} from 'lucide-react'
import TeamAvatar from '@/components/tournament/TeamAvatar'
import SeasonsTab from './SeasonsTab'
import TeamsSquadsTab from './TeamsSquadsTab'
import ChampStatsTab from './ChampStatsTab'
import SettingsTab from './SettingsTab'
import { getChampionshipPlayerStats, type ChampPlayerStat } from '@/app/actions/leagues'
import type { League, Season, LeagueTeam, Player } from '@/types'

type TeamWithPlayers = LeagueTeam & { players: Player[] }
type Lang = 'ru' | 'kz' | 'en'
type TabId = 'overview' | 'seasons' | 'teams' | 'stats' | 'settings'

const SPORT_LABELS: Record<Lang, Record<string, string>> = {
  ru: {
    football: 'Футбол', futsal: 'Футзал', efootball: 'Киберфутбол',
    basketball: 'Баскетбол', streetball: 'Стритбол', ebasketball: 'Кибербаскетбол',
    volleyball: 'Волейбол', beach_volleyball: 'Пляжный волейбол', hockey: 'Хоккей', other: 'Другое',
  },
  kz: {
    football: 'Футбол', futsal: 'Футзал', efootball: 'Кибер футбол',
    basketball: 'Баскетбол', streetball: 'Стритбол', ebasketball: 'Кибер баскетбол',
    volleyball: 'Волейбол', beach_volleyball: 'Пляжды волейбол', hockey: 'Хоккей', other: 'Басқа',
  },
  en: {
    football: 'Football', futsal: 'Futsal', efootball: 'eFootball',
    basketball: 'Basketball', streetball: 'Streetball', ebasketball: 'eBasketball',
    volleyball: 'Volleyball', beach_volleyball: 'Beach volleyball', hockey: 'Hockey', other: 'Other',
  },
}

const T = {
  ru: {
    allTournaments: 'Все турниры',
    publicPage: 'Публичная страница',
    championship: 'Чемпионат',
    tabs: { overview: 'Обзор', seasons: 'Сезоны', teams: 'Команды', stats: 'Статистика', settings: 'Настройки' },
    currentSeason: 'Текущий сезон',
    noSeasonYet: 'Сезонов пока нет',
    active: 'Активный', finished: 'Завершён',
    openSeason: 'Открыть сезон',
    seasonsCount: 'Сезоны', teamsCount: 'Команды', playersCount: 'Игроки',
    selectSeason: 'Выбрать сезон',
    statsEmpty: 'Статистика появится после первых сыгранных матчей.',
    seasonPickerHint: 'Переключить сезон',
  },
  kz: {
    allTournaments: 'Барлық турнирлер',
    publicPage: 'Ашық бет',
    championship: 'Чемпионат',
    tabs: { overview: 'Шолу', seasons: 'Маусымдар', teams: 'Командалар', stats: 'Статистика', settings: 'Баптаулар' },
    currentSeason: 'Ағымдағы маусым',
    noSeasonYet: 'Әзірге маусымдар жоқ',
    active: 'Белсенді', finished: 'Аяқталды',
    openSeason: 'Маусымды ашу',
    seasonsCount: 'Маусымдар', teamsCount: 'Командалар', playersCount: 'Ойыншылар',
    selectSeason: 'Маусымды таңдау',
    statsEmpty: 'Статистика алғашқы ойналған матчтардан кейін пайда болады.',
    seasonPickerHint: 'Маусымды ауыстыру',
  },
  en: {
    allTournaments: 'All tournaments',
    publicPage: 'Public page',
    championship: 'Championship',
    tabs: { overview: 'Overview', seasons: 'Seasons', teams: 'Teams', stats: 'Stats', settings: 'Settings' },
    currentSeason: 'Current season',
    noSeasonYet: 'No seasons yet',
    active: 'Active', finished: 'Finished',
    openSeason: 'Open season',
    seasonsCount: 'Seasons', teamsCount: 'Teams', playersCount: 'Players',
    selectSeason: 'Select season',
    statsEmpty: 'Stats will appear after the first matches are played.',
    seasonPickerHint: 'Switch season',
  },
} as const

export default function ChampionshipView({ league, seasons, teams, lang = 'ru', publicPath }: {
  league: League
  seasons: Season[]
  teams: TeamWithPlayers[]
  lang?: Lang
  publicPath: string | null
}) {
  const tx = T[lang]
  const [tab, setTab] = useState<TabId>('overview')
  const [seasonMenu, setSeasonMenu] = useState(false)

  const activeSeason = seasons.find(s => s.status === 'active') ?? seasons[0] ?? null
  const [selectedId, setSelectedId] = useState<string | null>(activeSeason?.id ?? null)
  const selectedSeason = seasons.find(s => s.id === selectedId) ?? activeSeason

  // Stats are heavy (events across all seasons) — load lazily on first open.
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

  const playersTotal = teams.reduce((s, t) => s + t.players.length, 0)

  const TABS: { id: TabId; label: string; icon: typeof Layers; count?: number }[] = [
    { id: 'overview', label: tx.tabs.overview, icon: Crown },
    { id: 'seasons',  label: tx.tabs.seasons,  icon: Layers, count: seasons.length },
    { id: 'teams',    label: tx.tabs.teams,    icon: Users, count: teams.length },
    { id: 'stats',    label: tx.tabs.stats,    icon: BarChart3 },
    { id: 'settings', label: tx.tabs.settings, icon: SettingsIcon },
  ]

  return (
    <div>
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4">
        <ChevronLeft size={14} /> {tx.allTournaments}
      </Link>

      {/* ── Premium header banner ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 mb-6 text-white"
        style={{ background: 'linear-gradient(135deg,#4c1d95 0%,#7c3aed 55%,#a855f7 100%)' }}>
        <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-fuchsia-400/20 blur-2xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="shrink-0 rounded-2xl ring-2 ring-white/30 overflow-hidden bg-white/10 backdrop-blur">
              <TeamAvatar name={league.name} logoUrl={league.logo_url} size={56} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                  <Crown size={11} /> {tx.championship}
                </span>
                {league.sport && (
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full">
                    {SPORT_LABELS[lang][league.sport] ?? league.sport}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight truncate">{league.name}</h1>

              {/* Flashscore-style season selector */}
              <div className="relative mt-2 inline-block">
                <button
                  onClick={() => setSeasonMenu(v => !v)}
                  disabled={seasons.length === 0}
                  className="inline-flex items-center gap-1.5 text-sm font-bold bg-white/15 hover:bg-white/25 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
                  title={tx.seasonPickerHint}
                >
                  <CalendarDays size={13} />
                  {selectedSeason ? selectedSeason.name : tx.noSeasonYet}
                  {seasons.length > 0 && <ChevronDown size={13} className={`transition-transform ${seasonMenu ? 'rotate-180' : ''}`} />}
                </button>
                {seasonMenu && seasons.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSeasonMenu(false)} />
                    <div className="absolute z-20 mt-1.5 left-0 min-w-[220px] bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 text-gray-900 max-h-72 overflow-auto">
                      {seasons.map(s => (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedId(s.id); setSeasonMenu(false); setTab('overview') }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-violet-50 transition-colors text-left"
                        >
                          <span className="flex-1 text-sm font-bold truncate">{s.name}</span>
                          {s.status === 'active' && (
                            <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{tx.active}</span>
                          )}
                          {s.id === selectedId && <Check size={13} className="text-violet-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {publicPath && (
            <a href={publicPath} target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors shrink-0">
              <Globe size={13} /> {tx.publicPage} <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>

      {/* ── Tabs (horizontal scroll on mobile) ─────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5 -mx-1 px-1"
        style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => {
          const Icon = t.icon
          const isActive = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => t.id === 'stats' ? openStats() : setTab(t.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                  : 'bg-white text-gray-500 hover:text-violet-600 border border-gray-100'
              }`}
            >
              <Icon size={14} />
              {t.label}
              {t.count != null && t.count > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/25 text-white' : 'bg-violet-100 text-violet-600'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Selected / current season spotlight */}
          {selectedSeason ? (
            <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-500">
                  {selectedSeason.status === 'active' ? tx.currentSeason : tx.tabs.seasons}
                </p>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  selectedSeason.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {selectedSeason.status === 'active' ? tx.active : tx.finished}
                </span>
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-4">{selectedSeason.name}</h2>
              {selectedSeason.tournament_id && (
                <Link
                  href={`/dashboard/tournament/${selectedSeason.tournament_id}`}
                  className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
                >
                  {tx.openSeason} <ArrowRight size={15} />
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <p className="text-sm text-gray-400">{tx.noSeasonYet}</p>
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: tx.seasonsCount, value: seasons.length, icon: Layers },
              { label: tx.teamsCount,   value: teams.length,   icon: Users },
              { label: tx.playersCount, value: playersTotal,   icon: BarChart3 },
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                  <Icon size={16} className="text-violet-400 mx-auto mb-1.5" />
                  <p className="text-2xl font-black text-gray-900">{s.value}</p>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">{s.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'seasons' && (
        <SeasonsTab leagueId={league.id} seasons={seasons} lang={lang} />
      )}

      {tab === 'teams' && (
        <TeamsSquadsTab leagueId={league.id} teams={teams} lang={lang} />
      )}

      {tab === 'stats' && (
        statsLoading
          ? <div className="flex items-center justify-center py-16 text-violet-400"><Loader2 className="animate-spin" size={22} /></div>
          : <ChampStatsTab stats={stats ?? []} lang={lang} />
      )}

      {tab === 'settings' && (
        <SettingsTab league={league} lang={lang} />
      )}
    </div>
  )
}
