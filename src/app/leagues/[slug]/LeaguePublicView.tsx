'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  MapPin, Users, Trophy, ChevronRight, BarChart3, CalendarDays, Table2, ChevronDown, Check,
  ChevronUp, User, Shield, Clock,
} from 'lucide-react'
import TeamAvatar from '@/components/tournament/TeamAvatar'
import type { ChampPlayerStat, ChampTeamStat } from '@/app/actions/leagues'
import { getEventDefs } from '@/lib/sports'

type Lang = 'ru' | 'kz' | 'en'
type StandingRow = { teamId: string; name: string; logoUrl: string | null; href: string | null; GP: number; W: number; D: number; L: number; GF: number; GA: number; GD: number; Pts: number }
type FixtureLite = { id: string; homeName: string; awayName: string; homeLogo: string | null; awayLogo: string | null; homeScore: number | null; awayScore: number | null; played: boolean; scheduledAt: string | null }
type SeasonLite = { id: string; name: string; status: string }

const T = {
  ru: {
    teams: 'команд', seasons: 'сезонов', season: 'Сезон', active: 'Активный',
    tabs: { table: 'Таблица', matches: 'Матчи', stats: 'Статистика' },
    team: 'Команда', colP: 'И', colW: 'В', colD: 'Н', colL: 'П', colGF: 'ЗМ', colGA: 'ПМ', colGD: '±', colPts: 'О',
    noTable: 'Матчи ещё не сыграны', noSeason: 'Сезон не привязан', upcoming: 'Предстоящие', results: 'Результаты', noMatches: 'Матчей пока нет',
    players: 'Игроки', teamsTab: 'Команды', player: 'Игрок', mp: 'И', goals: 'Г', assists: 'А', yellow: 'ЖК', red: 'КК', ssn: 'Сез.',
    noStats: 'Статистики пока нет', createOwn: 'Создать свой чемпионат', tbd: 'дата не назначена',
  },
  kz: {
    teams: 'команда', seasons: 'маусым', season: 'Маусым', active: 'Белсенді',
    tabs: { table: 'Кесте', matches: 'Матчтар', stats: 'Статистика' },
    team: 'Команда', colP: 'О', colW: 'Ж', colD: 'Т', colL: 'Ұ', colGF: 'ЗМ', colGA: 'ӨМ', colGD: '±', colPts: 'Ұп',
    noTable: 'Матчтар әлі өткен жоқ', noSeason: 'Маусым байланбаған', upcoming: 'Алдағы', results: 'Нәтижелер', noMatches: 'Матчтар әлі жоқ',
    players: 'Ойыншылар', teamsTab: 'Командалар', player: 'Ойыншы', mp: 'О', goals: 'Г', assists: 'А', yellow: 'СК', red: 'ҚК', ssn: 'Мау.',
    noStats: 'Статистика әлі жоқ', createOwn: 'Өз чемпионатыңды құру', tbd: 'күні белгіленбеген',
  },
  en: {
    teams: 'teams', seasons: 'seasons', season: 'Season', active: 'Active',
    tabs: { table: 'Table', matches: 'Matches', stats: 'Stats' },
    team: 'Team', colP: 'P', colW: 'W', colD: 'D', colL: 'L', colGF: 'GF', colGA: 'GA', colGD: '±', colPts: 'Pts',
    noTable: 'No matches played yet', noSeason: 'No tournament linked', upcoming: 'Upcoming', results: 'Results', noMatches: 'No matches yet',
    players: 'Players', teamsTab: 'Teams', player: 'Player', mp: 'MP', goals: 'G', assists: 'A', yellow: 'YC', red: 'RC', ssn: 'Ssn',
    noStats: 'No stats yet', createOwn: 'Create your own championship', tbd: 'date not set',
  },
} as const

function useSort<Row>(rows: Row[], initial: keyof Row) {
  const [key, setKey] = useState<keyof Row>(initial)
  const [dir, setDir] = useState<1 | -1>(-1)
  const sorted = [...rows].sort((a, b) => {
    const av = a[key], bv = b[key]
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av).localeCompare(String(bv)) * dir
  })
  return { sorted, key, dir, toggle: (k: keyof Row) => (k === key ? setDir(d => (d === 1 ? -1 : 1)) : (setKey(k), setDir(-1))) }
}

export default function LeaguePublicView({
  league, brand, seasons, selectedSeasonId, tournamentId,
  standings, recent, upcoming, teamsCount, playerStats, teamStats, lang = 'ru',
}: {
  league: { name: string; logo_url: string | null; sport: string | null; city: string | null; description: string | null; slug: string }
  brand: string
  seasons: SeasonLite[]
  selectedSeasonId: string | null
  tournamentId: string | null
  standings: StandingRow[]
  recent: FixtureLite[]
  upcoming: FixtureLite[]
  teamsCount: number
  playerStats: ChampPlayerStat[]
  teamStats: ChampTeamStat[]
  lang?: Lang
}) {
  const tx = T[lang]
  const router = useRouter()
  const [tab, setTab] = useState<'table' | 'matches' | 'stats'>('table')
  const [seasonMenu, setSeasonMenu] = useState(false)
  const [statView, setStatView] = useState<'players' | 'teams'>('players')
  const selected = seasons.find(s => s.id === selectedSeasonId)

  // Player stat columns driven by the championship's discipline.
  const statCols = getEventDefs(league.sport).filter(d => d.stat)
  const primaryStat = statCols[0]
  const [pKey, setPKey] = useState<string>(primaryStat?.type ?? 'matchesPlayed')
  const [pDir, setPDir] = useState<1 | -1>(-1)
  const pVal = (s: ChampPlayerStat, k: string): number | string =>
    k === 'player' ? s.player : k === 'team' ? s.teamName
    : k === 'matchesPlayed' ? s.matchesPlayed : k === 'seasons' ? s.seasons
    : (s.counts[k] ?? 0)
  const pSortedRows = [...playerStats].sort((a, b) => {
    const av = pVal(a, pKey), bv = pVal(b, pKey)
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * pDir
    return String(av).localeCompare(String(bv)) * pDir
  })
  const pSortObj = { key: pKey, dir: pDir, toggle: (k: string) => (k === pKey ? setPDir(d => (d === 1 ? -1 : 1)) : (setPKey(k), setPDir(-1))) }
  const tSort = useSort<ChampTeamStat>(teamStats, 'Pts')

  const fmtDate = (iso: string | null) => iso
    ? new Date(iso).toLocaleString(lang === 'kz' ? 'kk-KZ' : lang === 'en' ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : tx.tbd

  const TABS = [
    { id: 'table' as const, label: tx.tabs.table, icon: Table2 },
    { id: 'matches' as const, label: tx.tabs.matches, icon: CalendarDays },
    { id: 'stats' as const, label: tx.tabs.stats, icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header — brand-tinted, light */}
      <div className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, ${brand} 0%, ${brand}cc 100%)` }}>
        <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-2 ring-white/40 bg-white/10 shrink-0">
              <TeamAvatar name={league.name} logoUrl={league.logo_url} size={80} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black leading-tight break-words">{league.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {league.city && <span className="flex items-center gap-1 text-xs text-white/80"><MapPin size={11} /> {league.city}</span>}
                <span className="flex items-center gap-1 text-xs text-white/80"><Users size={11} /> {teamsCount} {tx.teams}</span>
                <span className="flex items-center gap-1 text-xs text-white/80"><Trophy size={11} /> {seasons.length} {tx.seasons}</span>
              </div>

              {/* Season dropdown */}
              {selected && (
                <div className="relative mt-3 inline-block">
                  <button onClick={() => setSeasonMenu(v => !v)} disabled={seasons.length < 2}
                    className="inline-flex items-center gap-1.5 text-sm font-bold bg-white/20 hover:bg-white/30 disabled:opacity-70 px-3 py-1.5 rounded-lg transition-colors">
                    <CalendarDays size={13} /> {selected.name}
                    {seasons.length > 1 && <ChevronDown size={13} className={`transition-transform ${seasonMenu ? 'rotate-180' : ''}`} />}
                  </button>
                  {seasonMenu && seasons.length > 1 && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setSeasonMenu(false)} />
                      <div className="absolute z-20 mt-1.5 left-0 min-w-[220px] bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 text-gray-900 max-h-72 overflow-auto">
                        {seasons.map(s => (
                          <Link key={s.id} href={`/leagues/${league.slug}?season=${s.id}`} onClick={() => setSeasonMenu(false)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left">
                            <span className="flex-1 text-sm font-bold break-words">{s.name}</span>
                            {s.status === 'active' && <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{tx.active}</span>}
                            {s.id === selectedSeasonId && <Check size={14} className="shrink-0" style={{ color: brand }} />}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              style={tab === id ? { borderColor: brand, color: brand } : undefined}
              className={`shrink-0 inline-flex items-center gap-1.5 py-3 px-4 text-sm font-bold border-b-2 transition-colors ${tab === id ? '' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {tab === 'table' && (
          standings.length === 0
            ? <p className="text-center py-14 text-gray-400">{tournamentId ? tx.noTable : tx.noSeason}</p>
            : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full text-sm min-w-[560px]">
                  <thead><tr className="text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-100">
                    <th className="text-left py-3 pl-4 w-8">#</th>
                    <th className="text-left py-3">{tx.team}</th>
                    <th className="text-center py-3 px-2">{tx.colP}</th>
                    <th className="text-center py-3 px-2">{tx.colW}</th>
                    <th className="text-center py-3 px-2">{tx.colD}</th>
                    <th className="text-center py-3 px-2">{tx.colL}</th>
                    <th className="text-center py-3 px-2">{tx.colGF}</th>
                    <th className="text-center py-3 px-2">{tx.colGA}</th>
                    <th className="text-center py-3 px-2">{tx.colGD}</th>
                    <th className="text-center py-3 px-3" style={{ color: brand }}>{tx.colPts}</th>
                  </tr></thead>
                  <tbody>
                    {standings.map((row, i) => (
                      <tr key={row.teamId}
                        onClick={() => row.href && router.push(row.href)}
                        className={`border-t border-gray-50 transition-colors ${row.href ? 'cursor-pointer hover:bg-gray-50' : ''}`}>
                        <td className="py-2.5 pl-4">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-black" style={i < 3 ? { background: `${brand}18`, color: brand } : { color: '#9ca3af' }}>{i + 1}</span>
                        </td>
                        <td className="py-2.5 font-bold text-gray-900">
                          <div className="flex items-center gap-2 min-w-0">
                            <TeamAvatar name={row.name} logoUrl={row.logoUrl} size={22} />
                            <span className="break-words">{row.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center text-gray-500">{row.GP}</td>
                        <td className="py-2.5 px-2 text-center text-emerald-600 font-bold">{row.W}</td>
                        <td className="py-2.5 px-2 text-center text-gray-500">{row.D}</td>
                        <td className="py-2.5 px-2 text-center text-red-500">{row.L}</td>
                        <td className="py-2.5 px-2 text-center text-gray-500">{row.GF}</td>
                        <td className="py-2.5 px-2 text-center text-gray-500">{row.GA}</td>
                        <td className={`py-2.5 px-2 text-center font-bold ${row.GD > 0 ? 'text-emerald-600' : row.GD < 0 ? 'text-red-500' : 'text-gray-400'}`}>{row.GD > 0 ? `+${row.GD}` : row.GD}</td>
                        <td className="py-2.5 px-3 text-center font-black text-gray-900">{row.Pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        )}

        {tab === 'matches' && (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{tx.upcoming}</p>
                <div className="space-y-1.5">{upcoming.map(f => <FixtureRow key={f.id} f={f} fmtDate={fmtDate} />)}</div>
              </div>
            )}
            {recent.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{tx.results}</p>
                <div className="space-y-1.5">{recent.map(f => <FixtureRow key={f.id} f={f} played fmtDate={fmtDate} />)}</div>
              </div>
            )}
            {upcoming.length === 0 && recent.length === 0 && <p className="text-center py-14 text-gray-400">{tx.noMatches}</p>}
          </div>
        )}

        {tab === 'stats' && (
          (playerStats.length === 0 && teamStats.length === 0)
            ? <p className="text-center py-14 text-gray-400">{tx.noStats}</p>
            : (
              <div className="space-y-4">
                <div className="flex gap-1.5">
                  {([['players', tx.players, User], ['teams', tx.teamsTab, Shield]] as const).map(([id, label, Icon]) => (
                    <button key={id} onClick={() => setStatView(id)}
                      style={statView === id ? { background: brand } : undefined}
                      className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${statView === id ? 'text-white' : 'bg-white text-gray-500 border border-gray-200 hover:text-gray-700'}`}>
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                </div>

                {statView === 'players' && (
                  <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <table className="w-full text-sm min-w-[560px]">
                      <thead><tr className="text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-100">
                        <th className="text-left py-2.5 pl-4 w-8">#</th>
                        <th className="text-left py-2.5">{tx.player}</th>
                        <th className="text-left py-2.5">{tx.team}</th>
                        <Th label={tx.mp} k="matchesPlayed" s={pSortObj} />
                        {statCols.map(c => <Th key={c.type} label={c.label[lang]} k={c.type} s={pSortObj} />)}
                        <Th label={tx.ssn} k="seasons" s={pSortObj} />
                      </tr></thead>
                      <tbody>
                        {pSortedRows.map((s, i) => (
                          <tr key={`${s.teamName}|${s.player}`} className="border-t border-gray-50">
                            <td className="py-2.5 pl-4 text-gray-400 font-bold">{i + 1}</td>
                            <td className="py-2.5 font-bold text-gray-900">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center text-[9px] font-black text-gray-500">
                                  {s.photo
                                    // eslint-disable-next-line @next/next/no-img-element
                                    ? <img src={s.photo} alt="" className="w-full h-full object-cover" />
                                    : s.player.slice(0, 2).toUpperCase()}
                                </span>
                                <span className="break-words">{s.player}</span>
                              </div>
                            </td>
                            <td className="py-2.5 text-gray-500">
                              <div className="flex items-center gap-1.5 min-w-0"><TeamAvatar name={s.teamName} logoUrl={s.teamLogo} size={18} /><span className="break-words">{s.teamName}</span></div>
                            </td>
                            <td className="py-2.5 px-2 text-center text-gray-500 tabular-nums">{s.matchesPlayed}</td>
                            {statCols.map((c, ci) => (
                              <td key={c.type} className={`py-2.5 px-2 text-center tabular-nums ${ci === 0 ? 'font-black' : 'text-gray-600'}`} style={ci === 0 ? { color: brand } : undefined}>
                                {s.counts[c.type] || <span className="text-gray-300">—</span>}
                              </td>
                            ))}
                            <td className="py-2.5 px-2 text-center text-gray-500 tabular-nums">{s.seasons}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {statView === 'teams' && (
                  <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <table className="w-full text-sm min-w-[560px]">
                      <thead><tr className="text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-100">
                        <th className="text-left py-2.5 pl-4 w-8">#</th>
                        <th className="text-left py-2.5">{tx.team}</th>
                        <Th label={tx.ssn} k="seasons" s={tSort} />
                        <Th label={tx.colP} k="GP" s={tSort} />
                        <Th label={tx.colW} k="W" s={tSort} />
                        <Th label={tx.colD} k="D" s={tSort} />
                        <Th label={tx.colL} k="L" s={tSort} />
                        <Th label={tx.colGD} k="GD" s={tSort} />
                        <Th label={tx.colPts} k="Pts" s={tSort} />
                      </tr></thead>
                      <tbody>
                        {tSort.sorted.map((s, i) => (
                          <tr key={s.teamName} className="border-t border-gray-50">
                            <td className="py-2.5 pl-4 text-gray-400 font-bold">{i + 1}</td>
                            <td className="py-2.5 font-bold text-gray-900">
                              <div className="flex items-center gap-2 min-w-0"><TeamAvatar name={s.teamName} logoUrl={s.logo} size={20} /><span className="break-words">{s.teamName}</span></div>
                            </td>
                            <td className="py-2.5 px-2 text-center text-gray-500 tabular-nums">{s.seasons}</td>
                            <td className="py-2.5 px-2 text-center text-gray-600 tabular-nums">{s.GP}</td>
                            <td className="py-2.5 px-2 text-center text-emerald-600 font-bold tabular-nums">{s.W}</td>
                            <td className="py-2.5 px-2 text-center text-gray-600 tabular-nums">{s.D}</td>
                            <td className="py-2.5 px-2 text-center text-red-500 tabular-nums">{s.L}</td>
                            <td className={`py-2.5 px-2 text-center font-bold tabular-nums ${s.GD > 0 ? 'text-emerald-600' : s.GD < 0 ? 'text-red-500' : 'text-gray-400'}`}>{s.GD > 0 ? `+${s.GD}` : s.GD}</td>
                            <td className="py-2.5 px-2 text-center font-black text-gray-900 tabular-nums">{s.Pts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
        )}
      </div>

      <div className="border-t border-gray-200 mt-10 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 font-black tracking-wider">
            <Image src="/logo-green.png" alt="Tournable" width={20} height={20} className="w-5 h-5 object-contain" />
            TOURNABLE
          </Link>
          <Link href="/register" className="text-xs font-medium hover:opacity-80" style={{ color: brand }}>{tx.createOwn} →</Link>
        </div>
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Th({ label, k, s }: { label: string; k: any; s: any }) {
  const active = s.key === k
  return (
    <th className="text-center px-2 py-2.5 cursor-pointer select-none whitespace-nowrap" onClick={() => s.toggle(k)}>
      <span className={`inline-flex items-center gap-0.5 ${active ? '' : 'text-gray-400'}`} style={active ? { color: '#4b5563' } : undefined}>
        {label}{active && (s.dir === -1 ? <ChevronDown size={11} /> : <ChevronUp size={11} />)}
      </span>
    </th>
  )
}

function FixtureRow({ f, played = false, fmtDate }: { f: FixtureLite; played?: boolean; fmtDate: (iso: string | null) => string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-sm">
      {!played && (
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1.5"><Clock size={11} /> {fmtDate(f.scheduledAt)}</div>
      )}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center gap-2 min-w-0 justify-end">
          <span className="font-bold text-gray-900 break-words text-right">{f.homeName}</span>
          <TeamAvatar name={f.homeName} logoUrl={f.homeLogo} size={24} />
        </div>
        {played
          ? <span className="shrink-0 text-sm font-black text-gray-900 px-3 py-1 bg-gray-100 rounded-lg min-w-[56px] text-center">{f.homeScore} : {f.awayScore}</span>
          : <span className="shrink-0 text-xs font-bold text-gray-300 px-2">vs</span>}
        <div className="flex items-center gap-2 min-w-0">
          <TeamAvatar name={f.awayName} logoUrl={f.awayLogo} size={24} />
          <span className="font-bold text-gray-900 break-words">{f.awayName}</span>
        </div>
      </div>
    </div>
  )
}
