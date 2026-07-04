'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Users, Trophy, ChevronRight, BarChart3, CalendarDays, Shield, Target } from 'lucide-react'

type Lang = 'ru' | 'kz' | 'en'
type StandingRow = { teamId: string; name: string; GP: number; W: number; D: number; L: number; GF: number; GA: number; GD: number; Pts: number }
type ScorerRow = { name: string; teamName: string; goals: number }
type FixtureLite = { id: string; homeName: string; awayName: string; homeScore: number | null; awayScore: number | null; played: boolean }
type TeamLite = { id: string; name: string; slug: string; city: string | null }
type SeasonLite = { id: string; name: string; status: string }

const T = {
  ru: {
    teams: 'команд', seasons: 'сезонов', season: 'Сезон',
    tabs: { table: 'Таблица', matches: 'Матчи', teamsTab: 'Команды', scorers: 'Бомбардиры' },
    team: 'Команда', colP: 'И', colW: 'В', colD: 'Н', colL: 'П', colGoals: 'Мячи', colGD: '+/-', colPts: 'О',
    noMatchesYet: 'Матчи ещё не сыграны', noSeasonTournament: 'Турнир для этого сезона не привязан',
    upcoming: 'Предстоящие', results: 'Результаты', noMatches: 'Матчей пока нет', allMatches: 'Все матчи турнира',
    noTeams: 'Команды ещё не добавлены', player: 'Игрок', goals: 'Голы', noGoals: 'Голов ещё нет',
    noTournament: 'Турнир не привязан', createLeague: 'Создать свой чемпионат',
  },
  kz: {
    teams: 'команда', seasons: 'маусым', season: 'Маусым',
    tabs: { table: 'Кесте', matches: 'Матчтар', teamsTab: 'Командалар', scorers: 'Голдаушылар' },
    team: 'Команда', colP: 'О', colW: 'Ж', colD: 'Т', colL: 'Ұ', colGoals: 'Голдар', colGD: '+/-', colPts: 'Ұп',
    noMatchesYet: 'Матчтар әлі өткен жоқ', noSeasonTournament: 'Бұл маусымға турнир байланбаған',
    upcoming: 'Алдағы', results: 'Нәтижелер', noMatches: 'Матчтар әлі жоқ', allMatches: 'Барлық матчтар',
    noTeams: 'Командалар әлі қосылмаған', player: 'Ойыншы', goals: 'Голдар', noGoals: 'Голдар әлі жоқ',
    noTournament: 'Турнир байланбаған', createLeague: 'Өз чемпионатыңды құру',
  },
  en: {
    teams: 'teams', seasons: 'seasons', season: 'Season',
    tabs: { table: 'Table', matches: 'Matches', teamsTab: 'Teams', scorers: 'Top scorers' },
    team: 'Team', colP: 'P', colW: 'W', colD: 'D', colL: 'L', colGoals: 'Goals', colGD: '+/-', colPts: 'Pts',
    noMatchesYet: 'No matches played yet', noSeasonTournament: 'No tournament linked to this season',
    upcoming: 'Upcoming', results: 'Results', noMatches: 'No matches yet', allMatches: 'All tournament matches',
    noTeams: 'No teams added yet', player: 'Player', goals: 'Goals', noGoals: 'No goals yet',
    noTournament: 'No tournament linked', createLeague: 'Create your own championship',
  },
} as const

const TABS = [
  { id: 'table', icon: BarChart3 },
  { id: 'matches', icon: CalendarDays },
  { id: 'teams', icon: Shield },
  { id: 'scorers', icon: Target },
] as const

export default function LeaguePublicView({
  league, brand, sportLabel, seasons, selectedSeasonId, tournamentId,
  standings, scorers, recent, upcoming, leagueTeams, lang = 'ru',
}: {
  league: { name: string; logo_url: string | null; sport: string | null; city: string | null; description: string | null; slug: string }
  brand: string
  sportLabel: string | null
  seasons: SeasonLite[]
  selectedSeasonId: string | null
  tournamentId: string | null
  standings: StandingRow[]
  scorers: ScorerRow[]
  recent: FixtureLite[]
  upcoming: FixtureLite[]
  leagueTeams: TeamLite[]
  lang?: Lang
}) {
  const tx = T[lang]
  const [tab, setTab] = useState<'table' | 'matches' | 'teams' | 'scorers'>('table')

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white">
      {/* Header — brand-tinted gradient */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: `radial-gradient(1200px 300px at 20% -40%, ${brand}, transparent)` }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-black shrink-0 ring-2"
              style={{ background: `${brand}22`, color: brand, boxShadow: `0 0 40px ${brand}33`, ['--tw-ring-color' as string]: `${brand}66` }}>
              {league.logo_url
                ? <Image src={league.logo_url} alt={league.name} width={80} height={80} className="w-full h-full object-cover" unoptimized />
                : league.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black leading-tight">{league.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                {sportLabel && <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: `${brand}22`, color: brand, border: `1px solid ${brand}44` }}>{sportLabel}</span>}
                {league.city && <span className="flex items-center gap-1 text-xs text-white/40"><MapPin size={11} /> {league.city}</span>}
                <span className="flex items-center gap-1 text-xs text-white/40"><Users size={11} /> {leagueTeams.length} {tx.teams}</span>
                <span className="flex items-center gap-1 text-xs text-white/40"><Trophy size={11} /> {seasons.length} {tx.seasons}</span>
              </div>
              {league.description && <p className="text-sm text-white/50 mt-2.5 max-w-xl leading-relaxed">{league.description}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Season selector (server nav — needs fresh data) */}
      {seasons.length > 1 && (
        <div className="border-b border-white/10 bg-white/[0.02]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <span className="text-[11px] font-bold text-white/30 shrink-0 mr-1 uppercase tracking-widest">{tx.season}</span>
            {seasons.map(s => (
              <Link key={s.id} href={`/leagues/${league.slug}?season=${s.id}`}
                style={s.id === selectedSeasonId ? { background: brand, color: '#fff' } : undefined}
                className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${s.id === selectedSeasonId ? '' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
                {s.name}
                {s.status === 'active' && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 align-middle" />}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tabs (instant, client-side) */}
      <div className="border-b border-white/10 sticky top-0 z-10 bg-[#0b0b0d]/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(({ id, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              style={tab === id ? { borderColor: brand, color: brand } : undefined}
              className={`shrink-0 inline-flex items-center gap-1.5 py-3 px-4 text-sm font-bold border-b-2 transition-colors ${tab === id ? '' : 'border-transparent text-white/40 hover:text-white/70'}`}>
              <Icon size={14} /> {tx.tabs[id === 'teams' ? 'teamsTab' : id]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {tab === 'table' && (
          standings.length === 0
            ? <p className="text-center py-14 text-white/30">{tournamentId ? tx.noMatchesYet : tx.noSeasonTournament}</p>
            : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
                <table className="w-full text-sm min-w-[520px]">
                  <thead><tr className="text-white/30 text-[11px] uppercase tracking-wider">
                    <th className="text-left py-3 pl-4 w-8">#</th>
                    <th className="text-left py-3">{tx.team}</th>
                    <th className="text-center py-3 px-2">{tx.colP}</th>
                    <th className="text-center py-3 px-2">{tx.colW}</th>
                    <th className="text-center py-3 px-2">{tx.colD}</th>
                    <th className="text-center py-3 px-2">{tx.colL}</th>
                    <th className="text-center py-3 px-2">{tx.colGoals}</th>
                    <th className="text-center py-3 px-2">{tx.colGD}</th>
                    <th className="text-center py-3 px-3" style={{ color: brand }}>{tx.colPts}</th>
                  </tr></thead>
                  <tbody>
                    {standings.map((row, i) => (
                      <tr key={row.teamId} className="border-t border-white/5 hover:bg-white/[0.04] transition-colors">
                        <td className="py-3 pl-4">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-black"
                            style={i < 3 ? { background: `${brand}22`, color: brand } : { color: 'rgba(255,255,255,0.3)' }}>{i + 1}</span>
                        </td>
                        <td className="py-3 font-bold text-white/90">{row.name}</td>
                        <td className="py-3 px-2 text-center text-white/50">{row.GP}</td>
                        <td className="py-3 px-2 text-center text-emerald-400 font-bold">{row.W}</td>
                        <td className="py-3 px-2 text-center text-white/50">{row.D}</td>
                        <td className="py-3 px-2 text-center text-red-400">{row.L}</td>
                        <td className="py-3 px-2 text-center text-white/50">{row.GF}:{row.GA}</td>
                        <td className={`py-3 px-2 text-center text-sm font-bold ${row.GD > 0 ? 'text-emerald-400' : row.GD < 0 ? 'text-red-400' : 'text-white/40'}`}>{row.GD > 0 ? `+${row.GD}` : row.GD}</td>
                        <td className="py-3 px-3 text-center font-black text-white">{row.Pts}</td>
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
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">{tx.upcoming}</p>
                <div className="space-y-1.5">{upcoming.map(f => <FixtureRow key={f.id} f={f} />)}</div>
              </div>
            )}
            {recent.length > 0 && (
              <div>
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">{tx.results}</p>
                <div className="space-y-1.5">{recent.map(f => <FixtureRow key={f.id} f={f} played />)}</div>
              </div>
            )}
            {upcoming.length === 0 && recent.length === 0 && (
              <p className="text-center py-14 text-white/30">{tx.noMatches}</p>
            )}
            {tournamentId && (
              <div className="text-center pt-2">
                <Link href={`/t/${tournamentId}`} target="_blank" className="text-sm font-medium hover:opacity-80" style={{ color: brand }}>{tx.allMatches} →</Link>
              </div>
            )}
          </div>
        )}

        {tab === 'teams' && (
          leagueTeams.length === 0
            ? <p className="text-center py-14 text-white/30">{tx.noTeams}</p>
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {leagueTeams.map(t => (
                  <Link key={t.id} href={`/leagues/${league.slug}/teams/${t.slug}`}>
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 hover:border-white/25 rounded-xl px-4 py-3 transition-colors">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black shrink-0" style={{ background: `${brand}22`, color: brand }}>
                        {t.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white truncate">{t.name}</p>
                        {t.city && <p className="text-xs text-white/40 mt-0.5">{t.city}</p>}
                      </div>
                      <ChevronRight size={14} className="text-white/20" />
                    </div>
                  </Link>
                ))}
              </div>
            )
        )}

        {tab === 'scorers' && (
          scorers.length === 0
            ? <p className="text-center py-14 text-white/30">{tournamentId ? tx.noGoals : tx.noTournament}</p>
            : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
                <table className="w-full text-sm min-w-[420px]">
                  <thead><tr className="text-white/30 text-[11px] uppercase tracking-wider">
                    <th className="text-left py-3 pl-4 w-8">#</th>
                    <th className="text-left py-3">{tx.player}</th>
                    <th className="text-left py-3 text-white/40">{tx.team}</th>
                    <th className="text-center py-3 px-4 font-black" style={{ color: brand }}>{tx.goals}</th>
                  </tr></thead>
                  <tbody>
                    {scorers.map((s, i) => (
                      <tr key={`${s.name}-${i}`} className="border-t border-white/5 hover:bg-white/[0.04] transition-colors">
                        <td className="py-3 pl-4 text-white/30 text-xs">{i + 1}</td>
                        <td className="py-3 font-bold text-white/90">{s.name}</td>
                        <td className="py-3 text-white/40 text-xs">{s.teamName}</td>
                        <td className="py-3 px-4 text-center font-black text-white">{s.goals}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 mt-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <Link href="/" className="text-xs text-white/20 hover:text-white/40 font-black tracking-wider">TOURNABLE</Link>
          <Link href="/register" className="text-xs font-medium hover:opacity-80" style={{ color: brand }}>{tx.createLeague} →</Link>
        </div>
      </div>
    </div>
  )
}

function FixtureRow({ f, played = false }: { f: FixtureLite; played?: boolean }) {
  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 text-sm">
      <span className="flex-1 text-right font-bold text-white/80 truncate">{f.homeName}</span>
      {played
        ? <span className="shrink-0 text-sm font-black text-white px-3 py-1 bg-white/10 rounded-lg min-w-[64px] text-center">{f.homeScore} : {f.awayScore}</span>
        : <span className="shrink-0 text-xs font-bold text-white/30 px-2">vs</span>}
      <span className="flex-1 text-left font-bold text-white/80 truncate">{f.awayName}</span>
    </div>
  )
}
