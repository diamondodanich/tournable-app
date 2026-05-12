import { Tournament, Team, Fixture } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import TeamAvatar from './TeamAvatar'

function teamById(teams: Team[], id: string | null) {
  return teams.find(t => t.id === id) ?? null
}

export default function PublicFixturesTab({ tournament, teams, fixtures }: {
  tournament: Tournament
  teams: Team[]
  fixtures: Fixture[]
}) {
  if (!tournament.generated || fixtures.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <p className="text-4xl mb-3">⚽</p>
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
            <span className="font-black text-emerald-600 text-lg">Тур {md}</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mxs.filter(f => !f.is_bye).map(f => {
              const home = teamById(teams, f.home_team_id)
              const away = teamById(teams, f.away_team_id)
              const goals = f.match_events?.filter(e => e.type === 'goal') ?? []
              return (
                <div key={f.id} className={`bg-white border rounded-xl p-4 ${f.played ? 'border-emerald-200' : 'border-gray-200'}`}>
                  <div className="mb-2">
                    <Badge className={f.played ? 'bg-emerald-100 text-emerald-700 text-xs' : 'bg-gray-100 text-gray-500 text-xs'}>
                      {f.played ? <><Check size={10} className="mr-1" />Сыгран</> : 'Не сыгран'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="flex items-center gap-2">
                      <TeamAvatar name={home?.name ?? '—'} logoUrl={home?.logo_url} size={24} />
                      <span className="font-bold text-sm">{home?.name ?? '—'}</span>
                    </div>
                    <span className="font-black font-mono text-lg text-gray-700">
                      {f.played ? `${f.home_score} – ${f.away_score}` : '— : —'}
                    </span>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="font-bold text-sm text-right">{away?.name ?? '—'}</span>
                      <TeamAvatar name={away?.name ?? '—'} logoUrl={away?.logo_url} size={24} />
                    </div>
                  </div>
                  {f.played && goals.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-100 text-xs text-gray-400">
                      ⚽ {goals.map(e => e.player_name).join(', ')}
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
