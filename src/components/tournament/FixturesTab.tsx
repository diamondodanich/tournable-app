'use client'

import { useState } from 'react'
import { Tournament, Team, Fixture } from '@/types'
import { saveFixtureResult } from '@/app/actions/tournaments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Check, Plus, X, Radio } from 'lucide-react'
import { toast } from 'sonner'
import TeamAvatar from './TeamAvatar'
import Link from 'next/link'

type EventType = 'goal' | 'assist' | 'yellow_card' | 'red_card'
type EventEntry = { teamId: string; playerName: string; type: EventType; minute: string }

const EVENT_TYPES: { value: EventType; emoji: string; label: string }[] = [
  { value: 'goal',        emoji: '⚽', label: 'Гол' },
  { value: 'assist',      emoji: '🎯', label: 'Ассист' },
  { value: 'yellow_card', emoji: '🟨', label: 'ЖК' },
  { value: 'red_card',    emoji: '🟥', label: 'КК' },
]

function teamById(teams: Team[], id: string | null) {
  return teams.find(t => t.id === id) ?? null
}

function FixtureCard({ fixture, teams, tournamentId }: { fixture: Fixture; teams: Team[]; tournamentId: string }) {
  const [homeScore, setHomeScore] = useState(fixture.home_score?.toString() ?? '')
  const [awayScore, setAwayScore] = useState(fixture.away_score?.toString() ?? '')
  const [events, setEvents] = useState<EventEntry[]>(
    fixture.match_events?.map(e => ({
      teamId: e.team_id,
      playerName: e.player_name,
      type: e.type as EventType,
      minute: e.minute?.toString() ?? '',
    })) ?? []
  )
  const [saving, setSaving] = useState(false)

  const homeTeam = teamById(teams, fixture.home_team_id)
  const awayTeam = teamById(teams, fixture.away_team_id)

  function addEvent(teamId: string) {
    setEvents(prev => [...prev, { teamId, playerName: '', type: 'goal', minute: '' }])
  }

  function updateEvent(idx: number, field: keyof EventEntry, value: string) {
    setEvents(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))
  }

  function removeEvent(idx: number) {
    setEvents(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    const hs = parseInt(homeScore)
    const as_ = parseInt(awayScore)
    if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) { toast.error('Введите корректный счёт'); return }
    setSaving(true)
    await saveFixtureResult(fixture.id, tournamentId, hs, as_,
      events.map(e => ({ teamId: e.teamId, playerName: e.playerName, type: e.type, minute: e.minute ? parseInt(e.minute) : undefined }))
    )
    toast.success('Результат сохранён')
    setSaving(false)
  }

  if (fixture.is_bye) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 opacity-60">
        <Badge variant="secondary" className="mb-2 text-xs">ПРОПУСК</Badge>
        <p className="text-sm text-gray-500">{homeTeam?.name ?? awayTeam?.name} — отдыхает</p>
      </div>
    )
  }

  // Separate events by team
  const homeEvents = events.map((e, i) => ({ ...e, idx: i })).filter(e => e.teamId === fixture.home_team_id)
  const awayEvents = events.map((e, i) => ({ ...e, idx: i })).filter(e => e.teamId === fixture.away_team_id)

  return (
    <div className={`bg-white border rounded-xl p-4 shadow-sm ${fixture.played ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-200'}`}>
      {/* Header: status + Live button */}
      <div className="flex items-center justify-between mb-3">
        <Badge className={fixture.played ? 'bg-emerald-100 text-emerald-700 text-xs' : 'bg-amber-100 text-amber-700 text-xs'}>
          {fixture.played ? <><Check size={10} className="mr-1" />Сыгран</> : 'Не сыгран'}
        </Badge>
        <Link
          href={`/t/${tournamentId}/live?home=${fixture.home_team_id}&away=${fixture.away_team_id}`}
          target="_blank"
          className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full transition-colors"
        >
          <Radio size={11} /> Live
        </Link>
      </div>

      {/* Score row */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <TeamAvatar name={homeTeam?.name ?? ''} logoUrl={homeTeam?.logo_url} size={22} />
          <span className="font-bold text-sm text-gray-900 truncate">{homeTeam?.name}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Input type="number" min={0} max={99} value={homeScore} onChange={e => setHomeScore(e.target.value)}
            className="w-12 text-center font-mono text-lg font-bold p-1 h-9" />
          <span className="font-bold text-gray-400 text-sm">–</span>
          <Input type="number" min={0} max={99} value={awayScore} onChange={e => setAwayScore(e.target.value)}
            className="w-12 text-center font-mono text-lg font-bold p-1 h-9" />
        </div>
        <div className="flex items-center gap-2 justify-end min-w-0">
          <span className="font-bold text-sm text-gray-900 truncate text-right">{awayTeam?.name}</span>
          <TeamAvatar name={awayTeam?.name ?? ''} logoUrl={awayTeam?.logo_url} size={22} />
        </div>
      </div>

      {/* Events: two columns side-by-side on md+, stacked on mobile */}
      <div className="border-t border-dashed border-gray-200 pt-3 mb-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {([
            { team: homeTeam, teamId: fixture.home_team_id!, evts: homeEvents },
            { team: awayTeam, teamId: fixture.away_team_id!, evts: awayEvents },
          ] as const).map(({ team, teamId, evts }) => (
            <div key={teamId}>
              <div className="flex items-center gap-1.5 mb-2">
                <TeamAvatar name={team?.name ?? ''} logoUrl={team?.logo_url} size={16} />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{team?.name}</p>
              </div>

              {evts.map(({ idx, type, playerName, minute }) => (
                <div key={idx} className="mb-2 bg-gray-50 rounded-lg p-2">
                  {/* Type selector row */}
                  <div className="flex gap-1 mb-1.5 flex-wrap">
                    {EVENT_TYPES.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => updateEvent(idx, 'type', t.value)}
                        className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
                          type === t.value ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {t.emoji} {t.label}
                      </button>
                    ))}
                    <button onClick={() => removeEvent(idx)} className="ml-auto text-gray-300 hover:text-red-500 px-1">
                      <X size={13} />
                    </button>
                  </div>
                  {/* Player + minute row */}
                  <div className="flex gap-1.5">
                    <Input
                      value={playerName}
                      onChange={e => updateEvent(idx, 'playerName', e.target.value)}
                      placeholder="Имя игрока"
                      className="h-7 text-xs flex-1 min-w-0"
                    />
                    <Input
                      value={minute}
                      onChange={e => updateEvent(idx, 'minute', e.target.value)}
                      placeholder="мин."
                      type="number" min={1} max={120}
                      className="h-7 text-xs w-16 shrink-0"
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={() => addEvent(teamId)}
                className="text-xs text-gray-400 hover:text-emerald-600 flex items-center gap-1 mt-1 transition-colors"
              >
                <Plus size={11} /> Добавить событие
              </button>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
        {saving ? 'Сохраняем…' : 'Сохранить результат'}
      </Button>
    </div>
  )
}

export default function FixturesTab({ tournament, teams, fixtures }: {
  tournament: Tournament
  teams: Team[]
  fixtures: Fixture[]
}) {
  if (!tournament.generated || fixtures.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <p className="text-4xl mb-3">⚽</p>
        <p className="font-bold text-gray-600 mb-1">Матчей пока нет</p>
        <p className="text-sm text-gray-400">Добавьте команды и сгенерируйте расписание</p>
      </div>
    )
  }

  const byMatchday = fixtures.reduce<Record<number, Fixture[]>>((acc, f) => {
    if (!acc[f.matchday]) acc[f.matchday] = []
    acc[f.matchday].push(f)
    return acc
  }, {})

  const played = fixtures.filter(f => !f.is_bye && f.played).length
  const total = fixtures.filter(f => !f.is_bye).length

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">Сыграно {played} из {total} матчей</p>
      {Object.entries(byMatchday).sort(([a], [b]) => +a - +b).map(([md, mxs]) => (
        <div key={md}>
          <div className="flex items-center gap-3 mb-3">
            <span className="font-black text-emerald-600 text-lg">Тур {md}</span>
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">Круг {mxs[0].round} из {tournament.num_rounds}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mxs.map(f => <FixtureCard key={f.id} fixture={f} teams={teams} tournamentId={tournament.id} />)}
          </div>
        </div>
      ))}
    </div>
  )
}
