'use client'

import { useState } from 'react'
import { Tournament, Team, Fixture } from '@/types'
import { saveFixtureResult, startFixture } from '@/app/actions/tournaments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Check, Plus, X, Radio, Play, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import TeamAvatar from './TeamAvatar'
import Link from 'next/link'

type EventType = 'goal' | 'own_goal' | 'assist' | 'yellow_card' | 'red_card'
type EventEntry = { teamId: string; playerName: string; type: EventType; minute: string }

const EDITABLE_TYPES: { value: EventType; emoji: string; label: string }[] = [
  { value: 'goal',        emoji: '⚽', label: 'Гол' },
  { value: 'own_goal',    emoji: '↩',  label: 'АГ' },
  { value: 'assist',      emoji: '🎯', label: 'Ассист' },
  { value: 'yellow_card', emoji: '🟨', label: 'ЖК' },
  { value: 'red_card',    emoji: '🟥', label: 'КК' },
]

function teamById(teams: Team[], id: string | null) {
  return teams.find(t => t.id === id) ?? null
}

// Inline icon for event type display in finished card
function EventBadge({ type }: { type: string }) {
  if (type === 'goal')        return <span className="text-sm">⚽</span>
  if (type === 'own_goal')    return <span className="text-sm text-red-500">↩</span>
  if (type === 'assist')      return <span className="text-sm">🎯</span>
  if (type === 'yellow_card') return <span className="inline-block w-2.5 h-3.5 bg-yellow-400 rounded-[2px] align-middle" />
  if (type === 'red_card')    return <span className="inline-block w-2.5 h-3.5 bg-red-500 rounded-[2px] align-middle" />
  return null
}

function FixtureCard({ fixture, teams, tournamentId }: { fixture: Fixture; teams: Team[]; tournamentId: string }) {
  const [homeScore, setHomeScore] = useState(fixture.home_score != null ? fixture.home_score.toString() : '0')
  const [awayScore, setAwayScore] = useState(fixture.away_score != null ? fixture.away_score.toString() : '0')
  const [events, setEvents] = useState<EventEntry[]>(
    fixture.match_events?.map(e => ({
      teamId: e.team_id,
      playerName: e.player_name,
      type: e.type as EventType,
      minute: e.minute?.toString() ?? '',
    })) ?? []
  )
  const [saving, setSaving]   = useState(false)
  const [starting, setStarting] = useState(false)
  const [status, setStatus]   = useState<'scheduled' | 'live' | 'finished'>(
    fixture.status ?? (fixture.played ? 'finished' : 'scheduled')
  )
  // When finished, default to summary view; can toggle to edit
  const [isEditing, setIsEditing] = useState(status !== 'finished')

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

  async function handleStart() {
    if (!fixture.home_team_id || !fixture.away_team_id) return
    setStarting(true)
    const prevStatus = status
    setStatus('live')

    const result = await startFixture(
      fixture.id, tournamentId,
      fixture.home_team_id ?? undefined,
      fixture.away_team_id ?? undefined,
    )
    setStarting(false)

    if (result?.error) {
      setStatus(prevStatus)
      toast.error(`Ошибка: ${result.error}`)
      return
    }

    window.open(
      `/t/${tournamentId}/live?home=${fixture.home_team_id}&away=${fixture.away_team_id}&fixture=${fixture.id}`,
      '_blank'
    )
  }

  async function handleSave() {
    const hs  = parseInt(homeScore)
    const as_ = parseInt(awayScore)
    if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) { toast.error('Введите корректный счёт'); return }

    const prevStatus = status
    setStatus('finished')
    setSaving(true)
    toast.success('Результат сохранён')

    const result = await saveFixtureResult(
      fixture.id, tournamentId, hs, as_,
      events.map(e => ({
        teamId: e.teamId, playerName: e.playerName,
        type: e.type, minute: e.minute ? parseInt(e.minute) : undefined,
      }))
    )

    setSaving(false)

    if (result?.error) {
      setStatus(prevStatus)
      toast.error(`Ошибка: ${result.error}`)
    } else {
      setIsEditing(false)
    }
  }

  if (fixture.is_bye) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 opacity-60">
        <Badge variant="secondary" className="mb-2 text-xs">ПРОПУСК</Badge>
        <p className="text-sm text-gray-500">{homeTeam?.name ?? awayTeam?.name} — отдыхает</p>
      </div>
    )
  }

  // ── Finished summary view ─────────────────────────────────────────────────

  if (status === 'finished' && !isEditing) {
    const allEvts = (fixture.match_events ?? events.map(e => ({
      id: e.teamId + e.playerName,
      team_id: e.teamId,
      player_name: e.playerName,
      type: e.type,
      minute: e.minute ? parseInt(e.minute) : null,
    })))
    const homeEvts = allEvts.filter(e => e.team_id === fixture.home_team_id)
    const awayEvts = allEvts.filter(e => e.team_id === fixture.away_team_id)

    const homeGoals   = homeEvts.filter(e => e.type !== 'assist').sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999))
    const homeAssists = homeEvts.filter(e => e.type === 'assist')
    const awayGoals   = awayEvts.filter(e => e.type !== 'assist').sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999))
    const awayAssists = awayEvts.filter(e => e.type === 'assist')

    // Pair goals with assists by minute
    function pairAssist<T extends { minute: number | null; team_id: string }>(
      goal: T, assists: T[], usedIds: Set<string>
    ): T | null {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const match = assists.find((a: any) => !usedIds.has(a.id) && a.minute === goal.minute) as T | undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (match) usedIds.add((match as any).id)
      return match ?? null
    }
    const homeUsed = new Set<string>()
    const awayUsed = new Set<string>()

    return (
      <div className="bg-gradient-to-b from-emerald-50/60 to-white border border-emerald-200 rounded-xl p-4 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <Badge className="bg-emerald-100 text-emerald-700 text-xs">
            <Check size={10} className="mr-1" />Сыгран
          </Badge>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition-colors"
          >
            <Pencil size={11} /> Изменить
          </button>
        </div>

        {/* Score row */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <TeamAvatar name={homeTeam?.name ?? ''} logoUrl={homeTeam?.logo_url} size={28} />
            <span className="font-bold text-sm text-gray-900 truncate">{homeTeam?.name}</span>
          </div>
          <div className="font-black text-2xl text-gray-900 font-mono shrink-0 tabular-nums">
            {fixture.home_score ?? homeScore} – {fixture.away_score ?? awayScore}
          </div>
          <div className="flex items-center gap-2 justify-end min-w-0">
            <span className="font-bold text-sm text-gray-900 truncate text-right">{awayTeam?.name}</span>
            <TeamAvatar name={awayTeam?.name ?? ''} logoUrl={awayTeam?.logo_url} size={28} />
          </div>
        </div>

        {/* Events strip — two columns */}
        {(homeGoals.length > 0 || awayGoals.length > 0) && (
          <div className="border-t border-dashed border-emerald-200 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                {homeGoals.map((e, i) => {
                  const assist = pairAssist(e, homeAssists, homeUsed)
                  return (
                    <div key={i} className={`flex items-center gap-1.5 text-xs ${e.type === 'own_goal' ? 'text-red-500' : 'text-gray-600'}`}>
                      <EventBadge type={e.type} />
                      <span className="font-medium truncate">
                        {e.player_name}
                        {assist && <span className="text-gray-400 font-normal"> ({assist.player_name})</span>}
                      </span>
                      {e.minute != null && <span className="text-gray-400 shrink-0">{e.minute}&apos;</span>}
                    </div>
                  )
                })}
              </div>
              <div className="space-y-1">
                {awayGoals.map((e, i) => {
                  const assist = pairAssist(e, awayAssists, awayUsed)
                  return (
                    <div key={i} className={`flex items-center gap-1.5 text-xs justify-end ${e.type === 'own_goal' ? 'text-red-500' : 'text-gray-600'}`}>
                      {e.minute != null && <span className="text-gray-400 shrink-0">{e.minute}&apos;</span>}
                      <span className="font-medium truncate text-right">
                        {assist && <span className="text-gray-400 font-normal">({assist.player_name}) </span>}
                        {e.player_name}
                      </span>
                      <EventBadge type={e.type} />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Edit / scheduled / live form ──────────────────────────────────────────

  const homeEvents = events.map((e, i) => ({ ...e, idx: i })).filter(e => e.teamId === fixture.home_team_id)
  const awayEvents = events.map((e, i) => ({ ...e, idx: i })).filter(e => e.teamId === fixture.away_team_id)

  return (
    <div className={`bg-white border rounded-xl p-4 shadow-sm ${status === 'finished' ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        {status === 'finished' && (
          <Badge className="bg-emerald-100 text-emerald-700 text-xs">
            <Check size={10} className="mr-1" />Сыгран
          </Badge>
        )}
        {status === 'live' && (
          <Badge className="bg-red-100 text-red-600 text-xs animate-pulse">
            <Radio size={10} className="mr-1" />LIVE
          </Badge>
        )}
        {status === 'scheduled' && (
          <Badge className="bg-gray-100 text-gray-500 text-xs">Не начат</Badge>
        )}

        <div className="flex items-center gap-2">
          {/* For live matches: quick link to board + ability to save directly */}
          {status === 'live' && (
            <Link
              href={`/t/${tournamentId}/live?home=${fixture.home_team_id}&away=${fixture.away_team_id}&fixture=${fixture.id}`}
              target="_blank"
              className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-full transition-colors"
            >
              <Radio size={11} /> Табло
            </Link>
          )}
          {status === 'scheduled' && (
            <button
              onClick={handleStart}
              disabled={starting || !fixture.home_team_id || !fixture.away_team_id}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full transition-colors disabled:opacity-50"
            >
              <Play size={11} /> {starting ? 'Запуск…' : 'Начать матч'}
            </button>
          )}
          {status === 'finished' && isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-full transition-colors"
            >
              ← Просмотр
            </button>
          )}
        </div>
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

      {/* Events: two columns */}
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
                  <div className="flex gap-1 mb-1.5 flex-wrap">
                    {EDITABLE_TYPES.map(t => (
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

      <div className="flex justify-end pt-1">
        <Button onClick={handleSave} disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-700 px-5">
          <Check size={13} className="mr-1.5" />
          {saving ? 'Сохраняем…' : 'Сохранить результат'}
        </Button>
      </div>
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
  const total  = fixtures.filter(f => !f.is_bye).length

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
