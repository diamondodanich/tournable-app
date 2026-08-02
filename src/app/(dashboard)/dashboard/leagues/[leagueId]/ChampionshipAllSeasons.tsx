'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Layers, Users, BarChart3, Crown, ArrowRight, Loader2, Trophy, FileDown, Swords, Activity, Target,
} from 'lucide-react'
import ChampionshipSeasonBar from '@/components/championship/ChampionshipSeasonBar'
import ChampStatsTab from './ChampStatsTab'
import TeamsSquadsTab from './TeamsSquadsTab'
import TeamAvatar from '@/components/tournament/TeamAvatar'
import {
  getChampionshipPlayerStats, getChampionshipTeamStats, getChampionshipOverview,
  type ChampPlayerStat, type ChampTeamStat, type ChampOverview,
} from '@/app/actions/leagues'
import { getEventDefs } from '@/lib/sports'
import type { LeagueTeam, Player } from '@/types'

type TeamWithPlayers = LeagueTeam & { players: Player[] }
type Lang = 'ru' | 'kz' | 'en'
type SeasonLite = { id: string; name: string; status: string; tournament_id: string | null; format: string | null }
type TabId = 'overview' | 'teams' | 'stats'

const T = {
  ru: {
    tabs: { overview: 'Обзор', stats: 'Статистика' },
    seasons: 'Сезоны', teams: 'Команды', players: 'Игроки',
    active: 'Активный', finished: 'Завершён',
    openSeason: 'Открыть', seasonsList: 'Сезоны чемпионата', noSeasons: 'Пока нет сезонов',
    allTimeStats: 'Статистика за всю историю', currentSeason: 'Текущий сезон', openSeasonBtn: 'Открыть сезон', report: 'Отчёт по всем сезонам',
    matches: 'Матчей сыграно', perMatch: 'В среднем за матч', progress: 'Прогресс сезона',
    ofTotal: (a: number, b: number) => `${a} из ${b}`,
    hall: 'Зал славы', hallHint: 'Титулы за всю историю чемпионата', noTitles: 'Первый чемпион появится, когда завершится сезон',
    eternal: 'Вечная таблица', pts: 'очков', gp: 'игр',
    topPlayers: 'Лидеры за всю историю',
    champion: 'Чемпион', noChampion: 'Идёт',
  },
  kz: {
    tabs: { overview: 'Шолу', stats: 'Статистика' },
    seasons: 'Маусымдар', teams: 'Командалар', players: 'Ойыншылар',
    active: 'Белсенді', finished: 'Аяқталды',
    openSeason: 'Ашу', seasonsList: 'Чемпионат маусымдары', noSeasons: 'Әзірге маусымдар жоқ',
    allTimeStats: 'Барлық тарих статистикасы', currentSeason: 'Ағымдағы маусым', openSeasonBtn: 'Маусымды ашу', report: 'Барлық маусымдар есебі',
    matches: 'Ойналған матчтар', perMatch: 'Матчқа орташа', progress: 'Маусым барысы',
    ofTotal: (a: number, b: number) => `${b} ішінен ${a}`,
    hall: 'Даңқ залы', hallHint: 'Чемпионат тарихындағы титулдар', noTitles: 'Алғашқы чемпион маусым аяқталғанда шығады',
    eternal: 'Мәңгілік кесте', pts: 'ұпай', gp: 'ойын',
    topPlayers: 'Барлық тарих көшбасшылары',
    champion: 'Чемпион', noChampion: 'Жүріп жатыр',
  },
  en: {
    tabs: { overview: 'Overview', stats: 'Stats' },
    seasons: 'Seasons', teams: 'Teams', players: 'Players',
    active: 'Active', finished: 'Finished',
    openSeason: 'Open', seasonsList: 'Championship seasons', noSeasons: 'No seasons yet',
    allTimeStats: 'All-time statistics', currentSeason: 'Current season', openSeasonBtn: 'Open season', report: 'All-seasons report',
    matches: 'Matches played', perMatch: 'Per match', progress: 'Season progress',
    ofTotal: (a: number, b: number) => `${a} of ${b}`,
    hall: 'Hall of fame', hallHint: 'Titles across the championship’s history', noTitles: 'The first champion appears when a season ends',
    eternal: 'All-time table', pts: 'pts', gp: 'games',
    topPlayers: 'All-time leaders',
    champion: 'Champion', noChampion: 'Ongoing',
  },
} as const

function tableTab(format: string | null): string {
  if (format === 'groups_playoff') return 'group-standings'
  if (format === 'playoff') return 'playoff'
  return 'standings'
}

export default function ChampionshipAllSeasons({ league, seasons, teams, teamsCount, playersCount, lang = 'ru', isOwner = false }: {
  league: { id: string; name: string; slug: string; sport: string | null; logo_url: string | null; cover_url?: string | null }
  seasons: SeasonLite[]
  teams: TeamWithPlayers[]
  teamsCount: number
  playersCount: number
  lang?: Lang
  isOwner?: boolean
}) {
  const tx = T[lang]
  const [tab, setTab] = useState<TabId>('overview')
  const [stats, setStats] = useState<ChampPlayerStat[] | null>(null)
  const [teamStats, setTeamStats] = useState<ChampTeamStat[]>([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [ov, setOv] = useState<ChampOverview | null>(null)

  // The overview's numbers (progress, output per match, titles) all come from one
  // aggregate; the all-time tables are the same data the Stats tab uses, so both
  // are loaded up front and the tab switch stays instant.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [o, p, t] = await Promise.all([
        getChampionshipOverview(league.id),
        getChampionshipPlayerStats(league.id),
        getChampionshipTeamStats(league.id),
      ])
      if (cancelled) return
      setOv(o); setStats(p); setTeamStats(t)
    })()
    return () => { cancelled = true }
  }, [league.id])

  function openStats() {
    setTab('stats')
    if (stats === null && !statsLoading) {
      setStatsLoading(true)
      void (async () => {
        try {
          const [p, t] = await Promise.all([getChampionshipPlayerStats(league.id), getChampionshipTeamStats(league.id)])
          setStats(p); setTeamStats(t)
        } finally { setStatsLoading(false) }
      })()
    }
  }

  // Headline stat is the discipline's own primary event (goals, aces, knockdowns…).
  const primaryStat = getEventDefs(league.sport ?? undefined).filter(d => d.stat)[0]
  const primaryTotal = primaryStat ? (ov?.eventCounts[primaryStat.type] ?? 0) : 0
  const perMatch = ov && ov.matchesPlayed > 0 ? (primaryTotal / ov.matchesPlayed) : 0

  const seasonRow = (id: string) => ov?.seasons.find(s => s.id === id)
  const current = seasons.find(s => s.status === 'active') ?? seasons[0]
  const currentRow = current ? seasonRow(current.id) : undefined

  const kpis = [
    { label: tx.seasons, value: ov?.seasonsCount ?? seasons.length, icon: Layers },
    { label: tx.teams, value: ov?.teamsCount ?? teamsCount, icon: Users },
    { label: tx.players, value: ov?.playersCount ?? playersCount, icon: Crown },
    { label: tx.matches, value: ov?.matchesPlayed ?? 0, icon: Swords },
    ...(primaryStat ? [{ label: primaryStat.label[lang], value: primaryTotal, icon: Target }] : []),
    ...(primaryStat ? [{ label: tx.perMatch, value: perMatch ? perMatch.toFixed(1) : '—', icon: Activity }] : []),
  ]

  const eternal = teamStats.slice(0, 5)
  const topPlayers = primaryStat
    ? [...(stats ?? [])].sort((a, b) => (b.counts[primaryStat.type] ?? 0) - (a.counts[primaryStat.type] ?? 0)).filter(s => (s.counts[primaryStat.type] ?? 0) > 0).slice(0, 5)
    : []

  return (
    <div className="space-y-5">
      <ChampionshipSeasonBar league={league} seasons={seasons} currentSeasonId={null} lang={lang} isOwner={isOwner} />

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {([
          { id: 'overview' as const, label: tx.tabs.overview, icon: Layers },
          { id: 'teams' as const, label: tx.teams, icon: Users },
          { id: 'stats' as const, label: tx.tabs.stats, icon: BarChart3 },
        ]).map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id}
              onClick={() => t.id === 'stats' ? openStats() : setTab(t.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                active ? 'bg-violet-600 text-white shadow-sm' : 'bg-white text-gray-500 hover:text-violet-600 border border-gray-100'
              }`}>
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'teams' && (
        <TeamsSquadsTab leagueId={league.id} teams={teams} lang={lang} sport={league.sport} />
      )}

      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Current season — with how far it actually is, not just its name */}
          {current && (
            <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-sm"
              style={{ background: 'linear-gradient(135deg,#4c1d95 0%,#7c3aed 60%,#a855f7 100%)' }}>
              <div className="absolute -top-10 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="relative flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-violet-200">{tx.currentSeason}</p>
                  <p className="text-2xl font-black truncate">{current.name}</p>
                  <span className="text-[11px] font-bold text-white/70">{current.status === 'active' ? tx.active : tx.finished}</span>
                </div>
                {current.tournament_id && (
                  <Link href={`/dashboard/tournament/${current.tournament_id}?tab=${tableTab(current.format)}`}
                    className="inline-flex items-center gap-2 bg-white text-violet-700 font-bold text-sm px-4 py-2.5 rounded-xl shrink-0 hover:opacity-90 transition-opacity">
                    {tx.openSeasonBtn} <ArrowRight size={15} />
                  </Link>
                )}
              </div>
              {currentRow && currentRow.total > 0 && (
                <div className="relative mt-4">
                  <div className="flex items-center justify-between text-[11px] font-bold text-violet-100 mb-1.5">
                    <span>{tx.progress}</span>
                    <span className="tabular-nums">{tx.ofTotal(currentRow.played, currentRow.total)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                    <div className="h-full rounded-full bg-white transition-all"
                      style={{ width: `${Math.round((currentRow.played / currentRow.total) * 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* KPI grid */}
          <div className="grid grid-cols-3 gap-3">
            {kpis.map(c => {
              const Icon = c.icon
              return (
                <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                  <div className="w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)' }}>
                    <Icon size={16} className="text-violet-600" />
                  </div>
                  <p className="text-2xl font-black text-gray-900 tabular-nums">{c.value}</p>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5 leading-tight">{c.label}</p>
                </div>
              )
            })}
          </div>

          {/* Hall of fame — who actually keeps winning this championship */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={15} className="text-amber-500" />
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">{tx.hall}</p>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">{tx.hallHint}</p>
            {!ov || ov.titles.length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center">{tx.noTitles}</p>
            ) : (
              <div className="space-y-2">
                {ov.titles.map((t, i) => (
                  <div key={`${t.teamSlug ?? t.teamName}`} className="flex items-center gap-3">
                    <span className={`w-5 text-xs font-black tabular-nums ${i === 0 ? 'text-amber-500' : 'text-gray-300'}`}>{i + 1}</span>
                    <TeamAvatar name={t.teamName} logoUrl={t.logo} size={24} />
                    {t.teamSlug
                      ? <Link href={`/leagues/${league.slug}/teams/${t.teamSlug}`} className="flex-1 text-sm font-bold text-gray-900 truncate hover:text-violet-700 hover:underline">{t.teamName}</Link>
                      : <span className="flex-1 text-sm font-bold text-gray-900 truncate">{t.teamName}</span>}
                    <span className="inline-flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
                      <Trophy size={11} /> {t.titles}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All-time table + all-time leaders, side by side on desktop */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">{tx.eternal}</p>
              {eternal.length === 0 ? (
                <p className="text-sm text-gray-400 py-3 text-center">—</p>
              ) : (
                <div className="space-y-2">
                  {eternal.map((t, i) => (
                    <div key={t.teamName} className="flex items-center gap-2.5">
                      <span className="w-4 text-xs font-black text-gray-300 tabular-nums">{i + 1}</span>
                      <TeamAvatar name={t.teamName} logoUrl={t.logo} size={20} />
                      {t.teamSlug
                        ? <Link href={`/leagues/${league.slug}/teams/${t.teamSlug}`} className="flex-1 text-sm font-bold text-gray-900 truncate hover:text-violet-700 hover:underline">{t.teamName}</Link>
                        : <span className="flex-1 text-sm font-bold text-gray-900 truncate">{t.teamName}</span>}
                      <span className="text-[11px] text-gray-400 shrink-0 tabular-nums">{t.GP} {tx.gp}</span>
                      <span className="text-sm font-black text-violet-700 shrink-0 tabular-nums w-10 text-right">{t.Pts}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">{tx.topPlayers}</p>
              {topPlayers.length === 0 ? (
                <p className="text-sm text-gray-400 py-3 text-center">—</p>
              ) : (
                <div className="space-y-2">
                  {topPlayers.map((p, i) => (
                    <div key={`${p.teamName}|${p.player}`} className="flex items-center gap-2.5">
                      <span className="w-4 text-xs font-black text-gray-300 tabular-nums">{i + 1}</span>
                      <span className="w-6 h-6 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-[9px] font-black text-gray-500">
                        {p.photo
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={p.photo} alt="" className="w-full h-full object-cover" />
                          : p.player.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="flex-1 min-w-0">
                        {p.playerId
                          ? <Link href={`/leagues/${league.slug}/players/${p.playerId}`} className="block text-sm font-bold text-gray-900 truncate hover:text-violet-700 hover:underline">{p.player}</Link>
                          : <span className="block text-sm font-bold text-gray-900 truncate">{p.player}</span>}
                        <span className="block text-[11px] text-gray-400 truncate">{p.teamName}</span>
                      </span>
                      <span className="text-sm font-black text-violet-700 shrink-0 tabular-nums">{primaryStat ? (p.counts[primaryStat.type] ?? 0) : 0}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Season list — each row now carries its champion and how much is left */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">{tx.seasonsList}</p>
              <Link href={`/dashboard/leagues/${league.id}/report`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700">
                <FileDown size={13} /> {tx.report}
              </Link>
            </div>
            {seasons.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">{tx.noSeasons}</p>
            ) : (
              <div className="space-y-2">
                {seasons.map(s => {
                  const row = seasonRow(s.id)
                  return (
                    <div key={s.id} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                        <Trophy size={16} className="text-violet-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">{s.name}</p>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-[10px] font-bold shrink-0 ${s.status === 'active' ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {s.status === 'active' ? tx.active : tx.finished}
                          </span>
                          {row && row.total > 0 && (
                            <span className="text-[10px] text-gray-400 shrink-0 tabular-nums">· {tx.ofTotal(row.played, row.total)}</span>
                          )}
                          {row?.championName && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 min-w-0">
                              · <Trophy size={9} className="shrink-0" /> <span className="truncate">{row.championName}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      {s.tournament_id && (
                        <Link href={`/dashboard/tournament/${s.tournament_id}?tab=${tableTab(s.format)}`}
                          className="inline-flex items-center gap-1.5 text-sm font-bold text-violet-600 hover:text-violet-700 shrink-0">
                          {tx.openSeason} <ArrowRight size={14} />
                        </Link>
                      )}
                    </div>
                  )
                })}
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
            : <ChampStatsTab stats={stats ?? []} teamStats={teamStats} lang={lang} slug={league.slug} sport={league.sport} />}
        </div>
      )}
    </div>
  )
}
