import { Tournament, Team, Fixture } from '@/types'
import TeamAvatar from './TeamAvatar'
import { Check, Clock } from 'lucide-react'

function teamById(teams: Team[], id: string | null) {
  return teams.find(t => t.id === id) ?? null
}

function EventBadge({ type }: { type: string }) {
  if (type === 'goal')
    return <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black">G</span>
  if (type === 'own_goal')
    return <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-100 text-red-600 text-[9px] font-black">OG</span>
  if (type === 'assist')
    return <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-sky-100 text-sky-600 text-[9px] font-black">A</span>
  if (type === 'yellow_card')
    return <span className="inline-block w-3 h-4 rounded-[2px] bg-yellow-400 shrink-0" />
  if (type === 'red_card')
    return <span className="inline-block w-3 h-4 rounded-[2px] bg-red-500 shrink-0" />
  return null
}

export default function PublicFixturesTab({ tournament, teams, fixtures }: {
  tournament: Tournament
  teams: Team[]
  fixtures: Fixture[]
}) {
  if (!tournament.generated || fixtures.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6 text-gray-400" />
        </div>
        <p className="font-bold text-gray-600">Матчи ещё не запланированы</p>
      </div>
    )
  }

  const byMatchday = fixtures.reduce<Record<number, Fixture[]>>((acc, f) => {
    if (!acc[f.matchday]) acc[f.matchday] = []
    acc[f.matchday].push(f)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(byMatchday).sort(([a], [b]) => +a - +b).map(([md, mxs]) => (
        <div key={md}>
          <div className="flex items-center gap-3 mb-3">
            <span className="font-black text-emerald-600 text-sm uppercase tracking-wide">Тур {md}</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mxs.filter(f => !f.is_bye).map(f => {
              const home = teamById(teams, f.home_team_id)
              const away = teamById(teams, f.away_team_id)
              const events = f.match_events ?? []
              const homeEvents = events.filter(e => e.team_id === f.home_team_id && e.type !== 'assist')
              const awayEvents = events.filter(e => e.team_id === f.away_team_id && e.type !== 'assist')

              return (
                <div key={f.id} className={`bg-white border rounded-2xl overflow-hidden ${f.played ? 'border-emerald-200' : 'border-gray-100'}`}>
                  {/* Status bar */}
                  <div className={`px-4 py-1.5 flex items-center gap-1.5 ${f.played ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                    {f.played
                      ? <><Check className="w-3 h-3 text-emerald-600" /><span className="text-xs font-bold text-emerald-700">Сыгран</span></>
                      : <><Clock className="w-3 h-3 text-gray-400" /><span className="text-xs font-bold text-gray-400">Не сыгран</span></>
                    }
                  </div>

                  {/* Teams + score */}
                  <div className="px-4 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamAvatar name={home?.name ?? '—'} logoUrl={home?.logo_url} size={28} />
                      <span className="font-bold text-sm text-gray-900 truncate">{home?.name ?? '—'}</span>
                    </div>
                    <span className={`font-black font-mono text-xl px-3 ${f.played ? 'text-gray-900' : 'text-gray-300'}`}>
                      {f.played ? `${f.home_score} : ${f.away_score}` : '— : —'}
                    </span>
                    <div className="flex items-center gap-2 justify-end min-w-0">
                      <span className="font-bold text-sm text-gray-900 truncate text-right">{away?.name ?? '—'}</span>
                      <TeamAvatar name={away?.name ?? '—'} logoUrl={away?.logo_url} size={28} />
                    </div>
                  </div>

                  {/* Events — only show when played and events exist */}
                  {f.played && (homeEvents.length > 0 || awayEvents.length > 0) && (
                    <div className="border-t border-gray-100 px-4 py-2.5 grid grid-cols-[1fr_auto_1fr] gap-2 text-xs">
                      {/* Home events */}
                      <div className="space-y-0.5">
                        {homeEvents.map((e, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-gray-600">
                            <EventBadge type={e.type} />
                            <span className="truncate">{e.player_name}{e.minute ? ` ${e.minute}'` : ''}</span>
                          </div>
                        ))}
                      </div>
                      <div className="w-px bg-gray-100" />
                      {/* Away events */}
                      <div className="space-y-0.5">
                        {awayEvents.map((e, idx) => (
                          <div key={idx} className="flex items-center justify-end gap-1 text-gray-600">
                            <span className="truncate text-right">{e.player_name}{e.minute ? ` ${e.minute}'` : ''}</span>
                            <EventBadge type={e.type} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
