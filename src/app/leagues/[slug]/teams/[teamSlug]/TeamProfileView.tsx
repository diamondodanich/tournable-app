'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, BarChart3, CalendarDays, Pencil, ChevronLeft } from 'lucide-react'
import SquadEditor from '@/components/championship/SquadEditor'

type Lang = 'ru' | 'kz' | 'en'
type PlayerLite = { id: string; name: string; number: number | null; position: string | null; photo_url: string | null }
type SeasonRecord = { seasonName: string; position: number | null; GP: number; W: number; D: number; L: number; Pts: number }
type MatchLite = { id: string; opponent: string; isHome: boolean; homeScore: number | null; awayScore: number | null; played: boolean; scheduledAt: string | null; seasonName: string }

const T = {
  ru: {
    tabs: { squad: 'Состав', results: 'Результаты', calendar: 'Календарь' },
    noSquad: 'Состав не заполнен', editSquad: 'Редактировать состав',
    history: 'История сезонов', noData: 'Нет данных', games: 'игр', w: 'В', d: 'Н', l: 'П', pts: 'очков',
    noResults: 'Сыгранных матчей ещё нет', noUpcoming: 'Предстоящих матчей нет', tbd: 'дата не назначена',
    pos: { goalkeeper: 'ВРТ', defender: 'ЗАЩ', midfielder: 'ПЗ', forward: 'НАП', other: '—' } as Record<string, string>,
  },
  kz: {
    tabs: { squad: 'Құрам', results: 'Нәтижелер', calendar: 'Күнтізбе' },
    noSquad: 'Құрам толтырылмаған', editSquad: 'Құрамды өңдеу',
    history: 'Маусымдар тарихы', noData: 'Дерек жоқ', games: 'ойын', w: 'Ж', d: 'Т', l: 'Ұ', pts: 'ұпай',
    noResults: 'Ойналған матчтар жоқ', noUpcoming: 'Алдағы матчтар жоқ', tbd: 'күні белгіленбеген',
    pos: { goalkeeper: 'ҚҚ', defender: 'ҚОРҒ', midfielder: 'ЖШ', forward: 'ШАБ', other: '—' } as Record<string, string>,
  },
  en: {
    tabs: { squad: 'Squad', results: 'Results', calendar: 'Calendar' },
    noSquad: 'Squad not filled', editSquad: 'Edit squad',
    history: 'Season history', noData: 'No data', games: 'games', w: 'W', d: 'D', l: 'L', pts: 'pts',
    noResults: 'No matches played yet', noUpcoming: 'No upcoming matches', tbd: 'date not set',
    pos: { goalkeeper: 'GK', defender: 'DEF', midfielder: 'MID', forward: 'FWD', other: '—' } as Record<string, string>,
  },
} as const

function Avatar({ name, photo, brand }: { name: string; photo: string | null; brand: string }) {
  return (
    <span className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-[11px] font-black shrink-0"
      style={{ background: `${brand}33`, color: '#fff' }}>
      {photo
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={photo} alt="" className="w-full h-full object-cover" />
        : name.slice(0, 2).toUpperCase()}
    </span>
  )
}

export default function TeamProfileView({
  slug, leagueId, leagueName, teamId, teamName, city, sport, brand,
  players, history, matches, lang = 'ru', isOwner = false,
}: {
  slug: string
  leagueId: string
  leagueName: string
  teamId: string
  teamName: string
  city: string | null
  sport: string | null
  brand: string
  players: PlayerLite[]
  history: SeasonRecord[]
  matches: MatchLite[]
  lang?: Lang
  isOwner?: boolean
}) {
  const tx = T[lang]
  const [tab, setTab] = useState<'squad' | 'results' | 'calendar'>('squad')
  const [editorOpen, setEditorOpen] = useState(false)

  const played = matches.filter(m => m.played)
  const upcoming = matches.filter(m => !m.played)
  const fmtDate = (iso: string | null) => iso
    ? new Date(iso).toLocaleString(lang === 'kz' ? 'kk-KZ' : lang === 'en' ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : tx.tbd

  const TABS = [
    { id: 'squad' as const, label: tx.tabs.squad, icon: Users },
    { id: 'results' as const, label: tx.tabs.results, icon: BarChart3 },
    { id: 'calendar' as const, label: tx.tabs.calendar, icon: CalendarDays },
  ]

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(1000px 260px at 15% -40%, ${brand}, transparent)` }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Link href={`/leagues/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-1.5 mb-4 transition-colors">
            <ChevronLeft size={15} /> {leagueName}
          </Link>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0 ring-2"
              style={{ background: `${brand}22`, color: brand, boxShadow: `0 0 40px ${brand}33`, ['--tw-ring-color' as string]: `${brand}66` }}>
              {teamName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black">{teamName}</h1>
              {city && <p className="text-sm text-white/40 mt-1">{city}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 sticky top-0 z-10 bg-[#0b0b0d]/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              style={tab === id ? { borderColor: brand, color: brand } : undefined}
              className={`shrink-0 inline-flex items-center gap-1.5 py-3 px-4 text-sm font-bold border-b-2 transition-colors ${tab === id ? '' : 'border-transparent text-white/40 hover:text-white/70'}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {tab === 'squad' && (
          <div>
            {isOwner && (
              <button onClick={() => setEditorOpen(true)}
                className="inline-flex items-center gap-2 text-sm font-bold text-white px-4 py-2 rounded-xl mb-4 transition-opacity hover:opacity-90"
                style={{ background: brand }}>
                <Pencil size={14} /> {tx.editSquad}
              </button>
            )}
            {players.length === 0 ? (
              <p className="text-sm text-white/30">{tx.noSquad}</p>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {players.slice().sort((a, b) => (a.number ?? 99) - (b.number ?? 99)).map((p, i) => (
                  <Link key={p.id} href={`/leagues/${slug}/players/${p.id}`}>
                    <div className={`flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors ${i > 0 ? 'border-t border-white/5' : ''}`}>
                      <Avatar name={p.name} photo={p.photo_url} brand={brand} />
                      {p.number != null && <span className="w-5 text-right text-xs font-black text-white/30 shrink-0">{p.number}</span>}
                      <span className="text-[10px] font-bold text-white/40 bg-white/10 px-1.5 py-0.5 rounded shrink-0">{tx.pos[p.position ?? 'other']}</span>
                      <span className="flex-1 text-sm font-bold text-white/90">{p.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'results' && (
          <div className="space-y-6">
            {played.length > 0 && (
              <div className="space-y-1.5">
                {played.map(m => (
                  <div key={m.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 text-sm">
                    <span className="text-[11px] text-white/30 w-24 shrink-0 truncate">{m.seasonName}</span>
                    <span className="flex-1 text-right font-bold text-white/80 truncate">{m.isHome ? teamName : m.opponent}</span>
                    <span className="shrink-0 text-sm font-black text-white px-3 py-1 bg-white/10 rounded-lg min-w-[56px] text-center">
                      {m.isHome ? m.homeScore : m.awayScore} : {m.isHome ? m.awayScore : m.homeScore}
                    </span>
                    <span className="flex-1 text-left font-bold text-white/80 truncate">{m.isHome ? m.opponent : teamName}</span>
                  </div>
                ))}
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">{tx.history}</p>
              {history.length === 0 ? <p className="text-sm text-white/30">{tx.noData}</p> : (
                <div className="space-y-2">
                  {history.map(r => (
                    <div key={r.seasonName} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-sm text-white">{r.seasonName}</p>
                        {r.position && <span className={`text-xs font-black px-2 py-0.5 rounded-full ${r.position === 1 ? 'bg-yellow-900/60 text-yellow-400' : 'bg-white/10 text-white/50'}`}>#{r.position}</span>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span>{r.GP} {tx.games}</span>
                        <span className="text-emerald-400">{r.W}{tx.w}</span>
                        <span>{r.D}{tx.d}</span>
                        <span className="text-red-400">{r.L}{tx.l}</span>
                        <span className="ml-auto font-black text-white">{r.Pts} {tx.pts}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {played.length === 0 && history.length === 0 && <p className="text-center py-10 text-white/30 text-sm">{tx.noResults}</p>}
          </div>
        )}

        {tab === 'calendar' && (
          upcoming.length === 0
            ? <p className="text-center py-12 text-white/30 text-sm">{tx.noUpcoming}</p>
            : (
              <div className="space-y-1.5">
                {upcoming.map(m => (
                  <div key={m.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 text-sm">
                    <span className="text-[11px] text-white/40 w-28 shrink-0 truncate">{fmtDate(m.scheduledAt)}</span>
                    <span className="flex-1 text-right font-bold text-white/80 truncate">{m.isHome ? teamName : m.opponent}</span>
                    <span className="shrink-0 text-xs font-bold text-white/30 px-2">vs</span>
                    <span className="flex-1 text-left font-bold text-white/80 truncate">{m.isHome ? m.opponent : teamName}</span>
                  </div>
                ))}
              </div>
            )
        )}
      </div>

      {editorOpen && (
        <SquadEditor
          leagueId={leagueId}
          leagueTeamId={teamId}
          teamName={teamName}
          sport={sport}
          brand={brand}
          lang={lang}
          onClose={() => { setEditorOpen(false); window.location.reload() }}
        />
      )}
    </div>
  )
}
