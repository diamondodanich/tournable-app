'use client'

import { useState } from 'react'
import { Tournament, Team, PlayoffMatch, MatchEvent } from '@/types'
import { savePlayoffResult, generatePlayoff, startPlayoffMatch } from '@/app/actions/playoff'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trophy, RefreshCw, Check, Plus, X, Radio, Play, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import TeamAvatar from './TeamAvatar'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────

type EventType = 'goal' | 'own_goal' | 'assist' | 'yellow_card' | 'red_card'
type EventEntry = { teamId: string; playerName: string; type: EventType; minute: string }

const EDITABLE_TYPES: { value: EventType; emoji: string; label: string }[] = [
  { value: 'goal',        emoji: '⚽', label: 'Гол' },
  { value: 'own_goal',    emoji: '↩',  label: 'АГ' },
  { value: 'assist',      emoji: '🎯', label: 'Ассист' },
  { value: 'yellow_card', emoji: '🟨', label: 'ЖК' },
  { value: 'red_card',    emoji: '🟥', label: 'КК' },
]

const ROUND_LABELS: Record<number, string> = {
  1: 'Финал',
  2: 'Полуфинал',
  4: 'Четвертьфинал',
  8: '1/8 финала',
  16: '1/16 финала',
}

// ── Helpers ───────────────────────────────────────────────────────────────

function teamById(teams: Team[], id: string | null) {
  return teams.find(t => t.id === id) ?? null
}

function EventBadge({ type }: { type: string }) {
  if (type === 'goal')        return <span className="text-sm">⚽</span>
  if (type === 'own_goal')    return <span className="text-sm text-red-500">↩</span>
  if (type === 'assist')      return <span className="text-sm">🎯</span>
  if (type === 'yellow_card') return <span className="inline-block w-2.5 h-3.5 bg-yellow-400 rounded-[2px] align-middle" />
  if (type === 'red_card')    return <span className="inline-block w-2.5 h-3.5 bg-red-500 rounded-[2px] align-middle" />
  return null
}

function pairAssist<T extends { minute: number | null; id?: string }>(
  goal: T, assists: T[], usedIds: Set<string>
): T | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match = assists.find((a: any) => !usedIds.has(a.id) && a.minute === goal.minute) as T | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (match) usedIds.add((match as any).id ?? '')
  return match ?? null
}

// ── MatchCard ─────────────────────────────────────────────────────────────

function PlayoffMatchCard({
  match, teams, tournamentId, isLive,
}: {
  match: PlayoffMatch
  teams: Team[]
  tournamentId: string
  isLive: boolean
}) {
  const [homeScore, setHomeScore] = useState(match.home_score?.toString() ?? '0')
  const [awayScore, setAwayScore] = useState(match.away_score?.toString() ?? '0')
  const [events, setEvents] = useState<EventEntry[]>(
    match.match_events?.map(e => ({
      teamId: e.team_id,
      playerName: e.player_name,
      type: e.type as EventType,
      minute: e.minute?.toString() ?? '',
    })) ?? []
  )
  const [saving, setSaving]   = useState(false)
  const [starting, setStarting] = useState(false)
  const [status, setStatus]   = useState<'scheduled' | 'live' | 'finished'>(
    match.winner_id ? 'finished' : isLive ? 'live' : 'scheduled'
  )
  const [isEditing, setIsEditing] = useState(status !== 'finished')

  const homeTeam = teamById(teams, match.home_team_id)
  const awayTeam = teamById(teams, match.away_team_id)
  const isDone   = match.winner_id !== null
  const isReady  = !!(match.home_team_id && match.away_team_id)

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
    if (!match.home_team_id || !match.away_team_id) return
    setStarting(true)
    const prevStatus = status
    setStatus('live')

    const result = await startPlayoffMatch(
      match.id, tournamentId,
      match.home_team_id,
      match.away_team_id,
    )
    setStarting(false)

    if (result?.error) {
      setStatus(prevStatus)
      toast.error(`Ошибка: ${result.error}`)
      return
    }

    window.open(
      `/t/${tournamentId}/live?playoff=${match.id}&home=${match.home_team_id}&away=${match.away_team_id}`,
      '_blank',
    )
  }

  async function handleSave() {
    const hs  = parseInt(homeScore)
    const as_ = parseInt(awayScore)
    if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) { toast.error('Введите корректный счёт'); return }
    if (hs === as_) { toast.error('В плей-офф ничьей быть не может'); return }

    const prevStatus = status
    setStatus('finished')
    setSaving(true)
    toast.success('Результат сохранён')

    const result = await savePlayoffResult(
      match.id, tournamentId, hs, as_,
      events.map(e => ({
        teamId: e.teamId, playerName: e.playerName,
        type: e.type, minute: e.minute ? parseInt(e.minute) : undefined,
      })),
    )

    setSaving(false)

    if (result?.error) {
      setStatus(prevStatus)
      toast.error(`Ошибка: ${result.error}`)
    } else {
      setIsEditing(false)
    }
  }

  // ── Finished summary view ─────────────────────────────────────────────

  if (status === 'finished' && !isEditing) {
    const allEvts = match.match_events ?? events.map(e => ({
      id: e.teamId + e.playerName,
      team_id: e.teamId,
      player_name: e.playerName,
      type: e.type,
      minute: e.minute ? parseInt(e.minute) : null,
    } as MatchEvent))
    const homeEvts   = allEvts.filter(e => e.team_id === match.home_team_id)
    const awayEvts   = allEvts.filter(e => e.team_id === match.away_team_id)
    const homeGoals  = homeEvts.filter(e => e.type !== 'assist').sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999))
    const awayGoals  = awayEvts.filter(e => e.type !== 'assist').sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999))
    const homeAssts  = homeEvts.filter(e => e.type === 'assist')
    const awayAssts  = awayEvts.filter(e => e.type === 'assist')
    const homeUsed   = new Set<string>()
    const awayUsed   = new Set<string>()

    return (
      <div className="bg-gradient-to-b from-emerald-50/60 to-white border border-emerald-200 rounded-xl p-3 shadow-sm min-w-[200px]">
        <div className="flex items-center justify-between mb-2">
          <Badge className="bg-emerald-100 text-emerald-700 text-xs">
            <Check size={10} className="mr-1" />Сыгран
          </Badge>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-full transition-colors"
          >
            <Pencil size={10} /> Изменить
          </button>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <TeamAvatar name={homeTeam?.name ?? ''} logoUrl={homeTeam?.logo_url} size={22} />
            <span className={`font-bold text-xs truncate ${match.winner_id === match.home_team_id ? 'text-emerald-700' : 'text-gray-700'}`}>
              {homeTeam?.name ?? 'TBD'}
              {match.winner_id === match.home_team_id && <Trophy size={10} className="inline ml-1 text-amber-500" />}
            </span>
          </div>
          <div className="font-black text-xl text-gray-900 font-mono shrink-0 tabular-nums">
            {match.home_score ?? homeScore} – {match.away_score ?? awayScore}
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
            <span className={`font-bold text-xs truncate text-right ${match.winner_id === match.away_team_id ? 'text-emerald-700' : 'text-gray-700'}`}>
              {match.winner_id === match.away_team_id && <Trophy size={10} className="inline mr-1 text-amber-500" />}
              {awayTeam?.name ?? 'TBD'}
            </span>
            <TeamAvatar name={awayTeam?.name ?? ''} logoUrl={awayTeam?.logo_url} size={22} />
          </div>
        </div>

        {/* Events */}
        {(homeGoals.length > 0 || awayGoals.length > 0) && (
          <div className="border-t border-dashed border-emerald-200 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                {homeGoals.map((e, i) => {
                  const assist = pairAssist(e, homeAssts, homeUsed)
                  return (
                    <div key={i} className={`flex items-center gap-1 text-xs ${e.type === 'own_goal' ? 'text-red-500' : 'text-gray-600'}`}>
                      <EventBadge type={e.type} />
                      <span className="font-medium truncate">
                        {e.player_name}
                        {assist && <span className="text-gray-400 font-normal"> ({assist.player_name})</span>}
                      </span>
                      {e.minute != null && <span className="text-gray-400 shrink-0 ml-auto">{e.minute}&apos;</span>}
                    </div>
                  )
                })}
              </div>
              <div className="space-y-1">
                {awayGoals.map((e, i) => {
                  const assist = pairAssist(e, awayAssts, awayUsed)
                  return (
                    <div key={i} className={`flex items-center gap-1 text-xs justify-end ${e.type === 'own_goal' ? 'text-red-500' : 'text-gray-600'}`}>
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

  // ── Edit / scheduled / live form ──────────────────────────────────────

  const homeEvents = events.map((e, i) => ({ ...e, idx: i })).filter(e => e.teamId === match.home_team_id)
  const awayEvents = events.map((e, i) => ({ ...e, idx: i })).filter(e => e.teamId === match.away_team_id)

  return (
    <div className={`bg-white border rounded-xl p-3 shadow-sm min-w-[220px] ${
      isDone ? 'border-emerald-200' : isReady ? 'border-gray-200' : 'border-gray-100 opacity-60'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
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

        <div className="flex items-center gap-1.5">
          {status === 'live' && (
            <Link
              href={`/t/${tournamentId}/live?playoff=${match.id}&home=${match.home_team_id}&away=${match.away_team_id}`}
              target="_blank"
              className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full transition-colors"
            >
              <Radio size={10} /> Табло
            </Link>
          )}
          {status === 'scheduled' && isReady && (
            <button
              onClick={handleStart}
              disabled={starting}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full transition-colors disabled:opacity-50"
            >
              <Play size={10} /> {starting ? 'Запуск…' : 'Начать матч'}
            </button>
          )}
          {status === 'finished' && isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 px-2 py-0.5 rounded-full transition-colors"
            >
              ← Просмотр
            </button>
          )}
        </div>
      </div>

      {/* Score row */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <TeamAvatar name={homeTeam?.name ?? ''} logoUrl={homeTeam?.logo_url} size={20} />
          <span className="font-bold text-xs text-gray-900 truncate">{homeTeam?.name ?? 'TBD'}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Input type="number" min={0} max={99} value={homeScore} onChange={e => setHomeScore(e.target.value)}
            disabled={!isReady}
            className="w-11 text-center font-mono text-base font-bold p-1 h-8" />
          <span className="font-bold text-gray-400 text-sm">–</span>
          <Input type="number" min={0} max={99} value={awayScore} onChange={e => setAwayScore(e.target.value)}
            disabled={!isReady}
            className="w-11 text-center font-mono text-base font-bold p-1 h-8" />
        </div>
        <div className="flex items-center gap-1.5 justify-end min-w-0">
          <span className="font-bold text-xs text-gray-900 truncate text-right">{awayTeam?.name ?? 'TBD'}</span>
          <TeamAvatar name={awayTeam?.name ?? ''} logoUrl={awayTeam?.logo_url} size={20} />
        </div>
      </div>

      {/* Events editor */}
      {isReady && (
        <div className="border-t border-dashed border-gray-200 pt-2 mb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {([
              { team: homeTeam, teamId: match.home_team_id!, evts: homeEvents },
              { team: awayTeam, teamId: match.away_team_id!, evts: awayEvents },
            ] as const).map(({ team, teamId, evts }) => (
              <div key={teamId}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <TeamAvatar name={team?.name ?? ''} logoUrl={team?.logo_url} size={14} />
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{team?.name}</p>
                </div>

                {evts.map(({ idx, type, playerName, minute }) => (
                  <div key={idx} className="mb-1.5 bg-gray-50 rounded-lg p-2">
                    <div className="flex gap-1 mb-1 flex-wrap">
                      {EDITABLE_TYPES.map(t => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => updateEvent(idx, 'type', t.value)}
                          className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
                            type === t.value
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {t.emoji} {t.label}
                        </button>
                      ))}
                      <button onClick={() => removeEvent(idx)} className="ml-auto text-gray-300 hover:text-red-500 px-1">
                        <X size={12} />
                      </button>
                    </div>
                    <div className="flex gap-1">
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
                        className="h-7 text-xs w-14 shrink-0"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => addEvent(teamId)}
                  className="text-xs text-gray-400 hover:text-emerald-600 flex items-center gap-1 mt-1 transition-colors"
                >
                  <Plus size={10} /> Событие
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isReady && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs px-4">
            <Check size={11} className="mr-1" />
            {saving ? '…' : isDone ? 'Обновить' : 'Сохранить'}
          </Button>
        </div>
      )}
    </div>
  )
}

// ── PlayoffTab ────────────────────────────────────────────────────────────

export default function PlayoffTab({ tournament, teams, matches, livePlayoffMatchId }: {
  tournament: Tournament
  teams: Team[]
  matches: PlayoffMatch[]
  livePlayoffMatchId?: string | null
}) {
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    if (teams.length < 2) { toast.error('Нужно минимум 2 команды'); return }
    setGenerating(true)
    const res = await generatePlayoff(tournament.id)
    if (res?.error) toast.error(res.error)
    else toast.success('Сетка создана!')
    setGenerating(false)
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <p className="text-5xl mb-4">🏆</p>
        <p className="font-bold text-gray-700 text-lg mb-2">Сетка плей-офф</p>
        <p className="text-sm text-gray-400 mb-6">Добавьте команды и сгенерируйте сетку</p>
        <Button onClick={handleGenerate} disabled={generating || teams.length < 2} className="bg-emerald-600 hover:bg-emerald-700">
          {generating ? 'Генерируем…' : 'Создать сетку'}
        </Button>
      </div>
    )
  }

  // Group by round_order, sort descending (largest = first round)
  const rounds = [...new Set(matches.map(m => m.round_order))].sort((a, b) => b - a)

  const played  = matches.filter(m => m.winner_id !== null).length
  const total   = matches.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Сыграно {played} из {total} матчей</p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generating}
          className="gap-2 text-xs"
        >
          <RefreshCw size={12} /> {generating ? '…' : 'Пересоздать'}
        </Button>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max">
          {rounds.map(ro => (
            <div key={ro} className="flex flex-col gap-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 text-center">
                {ROUND_LABELS[ro] ?? `Раунд ${ro}`}
              </p>
              <div className="flex flex-col gap-4 justify-around flex-1">
                {matches
                  .filter(m => m.round_order === ro)
                  .sort((a, b) => a.match_order - b.match_order)
                  .map(m => (
                    <PlayoffMatchCard
                      key={m.id}
                      match={m}
                      teams={teams}
                      tournamentId={tournament.id}
                      isLive={livePlayoffMatchId === m.id}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
