'use client'

import { useState } from 'react'
import { Tournament, Team, Fixture } from '@/types'
import { saveFixtureResult } from '@/app/actions/tournaments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Check, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import TeamAvatar from './TeamAvatar'

type EventType = 'goal' | 'assist' | 'yellow_card' | 'red_card'
type EventEntry = { teamId: string; playerName: string; type: EventType; minute: string }

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'goal',        label: '⚽ Гол' },
  { value: 'assist',      label: '🎯 Ассист' },
  { value: 'yellow_card', label: '🟨 ЖК' },
  { value: 'red_card',    label: '🟥 КК' },
]

function teamName(teams: Team[], id: string | null) {
  return teams.find(t => t.id === id)?.name ?? '—'
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

  const homeTeamId = fixture.home_team_id!
  const awayTeamId = fixture.away_team_id!
  const homeTeam = teams.find(t => t.id === homeTeamId)
  const awayTeam = teams.find(t => t.id === awayTeamId)

  function addEvent(teamId: string) {
    setEvents(prev => [...prev, { teamId, playerName: '', type: 'goal', minute: '' }])
  }

  function updateEvent(index: number, field: keyof EventEntry, value: string) {
    setEvents(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e))
  }

  function removeEvent(index: number) {
    setEvents(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    const hs = parseInt(homeScore)
    const as_ = parseInt(awayScore)
    if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) {
      toast.error('Введите корректный счёт')
      return
    }
    setSaving(true)
    await saveFixtureResult(
      fixture.id, tournamentId, hs, as_,
      events.map(e => ({
        teamId: e.teamId,
        playerName: e.playerName,
        type: e.type,
        minute: e.minute ? parseInt(e.minute) : undefined,
      }))
    )
    toast.success('Результат сохранён')
    setSaving(false)
  }

  if (fixture.is_bye) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 opacity-60">
        <Badge variant="secondary" className="mb-2 text-xs">ПРОПУСК</Badge>
        <p className="text-sm text-gray-500">{teamName(teams, fixture.home_team_id ?? fixture.away_team_id)} — отдыхает</p>
      </div>
    )
  }

  return (
    <div className={`bg-white border rounded-xl p-4 shadow-sm transition-all ${fixture.played ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <Badge className={fixture.played ? 'bg-emerald-100 text-emerald-700 text-xs' : 'bg-amber-100 text-amber-700 text-xs'}>
          {fixture.played ? <><Check size={10} className="mr-1" />Сыгран</> : 'Не сыгран'}
        </Badge>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <TeamAvatar name={homeTeam?.name ?? ''} logoUrl={homeTeam?.logo_url} size={24} />
          <span className="font-bold text-sm text-gray-900 truncate">{teamName(teams, homeTeamId)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Input type="number" min={0} max={99} value={homeScore} onChange={e => setHomeScore(e.target.value)}
            className="w-14 text-center font-mono text-xl font-bold p-1 h-10" />
          <span className="font-bold text-gray-400">–</span>
          <Input type="number" min={0} max={99} value={awayScore} onChange={e => setAwayScore(e.target.value)}
            className="w-14 text-center font-mono text-xl font-bold p-1 h-10" />
        </div>
        <div className="flex items-center gap-2 justify-end">
          <span className="font-bold text-sm text-gray-900 truncate text-right">{teamName(teams, awayTeamId)}</span>
          <TeamAvatar name={awayTeam?.name ?? ''} logoUrl={awayTeam?.logo_url} size={24} />
        </div>
      </div>

      {/* Events */}
      <div className="grid grid-cols-2 gap-4 mb-4 pt-3 border-t border-dashed border-gray-200">
        {[homeTeamId, awayTeamId].map(tid => (
          <div key={tid}>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
              {teamName(teams, tid)}
            </p>
            {events
              .map((e, idx) => ({ e, idx }))
              .filter(({ e }) => e.teamId === tid)
              .map(({ e, idx }) => (
                <div key={idx} className="flex items-center gap-1 mb-1.5">
                  <select
                    value={e.type}
                    onChange={ev => updateEvent(idx, 'type', ev.target.value)}
                    className="h-7 text-xs border border-gray-200 rounded px-1 bg-white"
                  >
                    {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <Input
                    value={e.playerName}
                    onChange={ev => updateEvent(idx, 'playerName', ev.target.value)}
                    placeholder="Имя"
                    className="h-7 text-xs flex-1 min-w-0"
                  />
                  <Input
                    value={e.minute}
                    onChange={ev => updateEvent(idx, 'minute', ev.target.value)}
                    placeholder="мин"
                    type="number" min={1} max={120}
                    className="h-7 text-xs w-12"
                  />
                  <button onClick={() => removeEvent(idx)} className="text-gray-300 hover:text-red-500 flex-shrink-0">
                    <X size={13} />
                  </button>
                </div>
              ))}
            <button
              onClick={() => addEvent(tid)}
              className="text-xs text-gray-400 hover:text-emerald-600 flex items-center gap-1 mt-1"
            >
              <Plus size={11} /> Добавить
            </button>
          </div>
        ))}
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
