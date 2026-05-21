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
type ActionType = 'goal' | 'yellow_card' | 'red_card'

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

function EventIcon({ type }: { type: string }) {
  if (type === 'goal')        return <span className="text-xs">⚽</span>
  if (type === 'own_goal')    return <span className="text-xs text-red-500">↩</span>
  if (type === 'yellow_card') return <span className="inline-block w-2 h-3 bg-yellow-400 rounded-[2px] align-middle shrink-0" />
  if (type === 'red_card')    return <span className="inline-block w-2 h-3 bg-red-500 rounded-[2px] align-middle shrink-0" />
  return null
}

// Pair goals/cards with their assists from flat events array
function buildRows(teamId: string, events: EventEntry[]) {
  const indexed = events.map((e, i) => ({ ...e, i }))
  const mine    = indexed.filter(e => e.teamId === teamId)
  const nonAsst = mine.filter(e => e.type !== 'assist')
  const assists = mine.filter(e => e.type === 'assist')
  const used    = new Set<number>()
  return nonAsst.map(e => {
    let assisterName: string | null = null
    let assistIdx: number | undefined
    if (e.type === 'goal') {
      const a = assists.find(a => !used.has(a.i) && a.minute === e.minute)
      if (a) { used.add(a.i); assisterName = a.playerName; assistIdx = a.i }
    }
    return { ...e, assisterName, assistIdx }
  })
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
  const [events, setEvents] = useState<EventEntry[]>(
    match.match_events?.map(e => ({
      teamId: e.team_id,
      playerName: e.player_name,
      type: e.type as EventType,
      minute: e.minute?.toString() ?? '',
    })) ?? []
  )
  const [saving, setSaving]     = useState(false)
  const [starting, setStarting] = useState(false)
  const [status, setStatus]     = useState<'scheduled' | 'live' | 'finished'>(
    match.winner_id ? 'finished' : isLive ? 'live' : 'scheduled'
  )
  const [isEditing, setIsEditing] = useState(status !== 'finished')

  // Inline add-event form (one per card, tied to a team)
  const [form, setForm] = useState<{
    teamId: string; actionType: ActionType
    player: string; assister: string; minute: string; isOwnGoal: boolean
  } | null>(null)

  const homeTeam = teamById(teams, match.home_team_id)
  const awayTeam = teamById(teams, match.away_team_id)
  const isDone   = match.winner_id !== null
  const isReady  = !!(match.home_team_id && match.away_team_id)

  // Score is computed from goal events; fall back to saved score if no goals tracked
  const hasGoals  = events.some(e => e.type === 'goal' || e.type === 'own_goal')
  const cHome     = events.filter(e =>
    (e.teamId === match.home_team_id && e.type === 'goal') ||
    (e.teamId === match.away_team_id && e.type === 'own_goal')
  ).length
  const cAway     = events.filter(e =>
    (e.teamId === match.away_team_id && e.type === 'goal') ||
    (e.teamId === match.home_team_id && e.type === 'own_goal')
  ).length
  const scoreHome = hasGoals ? cHome : (match.home_score ?? 0)
  const scoreAway = hasGoals ? cAway : (match.away_score ?? 0)

  // Open inline form for a team (close if already open for same team)
  function openForm(teamId: string) {
    if (form?.teamId === teamId) { setForm(null); return }
    setForm({ teamId, actionType: 'goal', player: '', assister: '', minute: '', isOwnGoal: false })
  }

  // Confirm: add event(s) and close form
  function confirmForm() {
    if (!form || !form.player.trim()) return
    const type: EventType = form.actionType === 'goal' && form.isOwnGoal ? 'own_goal' : form.actionType
    const added: EventEntry[] = [
      { teamId: form.teamId, playerName: form.player.trim(), type, minute: form.minute },
    ]
    if (form.actionType === 'goal' && !form.isOwnGoal && form.assister.trim()) {
      added.push({ teamId: form.teamId, playerName: form.assister.trim(), type: 'assist', minute: form.minute })
    }
    setEvents(prev => [...prev, ...added])
    setForm(null)
  }

  // Remove an event row (and its paired assist if it's a goal)
  function removeRow(eventIdx: number, assistIdx?: number) {
    setEvents(prev => prev.filter((_, i) => i !== eventIdx && i !== assistIdx))
  }

  async function handleStart() {
    if (!match.home_team_id || !match.away_team_id) return
    setStarting(true)
    const prevStatus = status
    setStatus('live')
    const result = await startPlayoffMatch(match.id, tournamentId, match.home_team_id, match.away_team_id)
    setStarting(false)
    if (result?.error) { setStatus(prevStatus); toast.error(`Ошибка: ${result.error}`); return }
    window.open(`/t/${tournamentId}/live?playoff=${match.id}&home=${match.home_team_id}&away=${match.away_team_id}`, '_blank')
  }

  async function handleSave() {
    if (scoreHome === scoreAway) { toast.error('В плей-офф ничьей быть не может'); return }
    const prevStatus = status
    setStatus('finished')
    setSaving(true)
    toast.success('Результат сохранён')
    const result = await savePlayoffResult(
      match.id, tournamentId, scoreHome, scoreAway,
      events.map(e => ({ teamId: e.teamId, playerName: e.playerName, type: e.type, minute: e.minute ? parseInt(e.minute) : undefined })),
    )
    setSaving(false)
    if (result?.error) { setStatus(prevStatus); toast.error(`Ошибка: ${result.error}`) }
    else setIsEditing(false)
  }

  // ── Finished summary view ─────────────────────────────────────────────

  if (status === 'finished' && !isEditing) {
    const homeRows = buildRows(match.home_team_id ?? '', events)
    const awayRows = buildRows(match.away_team_id ?? '', events)
    const hasEvts  = homeRows.length > 0 || awayRows.length > 0

    return (
      <div className="bg-gradient-to-b from-emerald-50/60 to-white border border-emerald-200 rounded-xl p-3 shadow-sm min-w-[220px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
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
            {scoreHome} – {scoreAway}
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
            <span className={`font-bold text-xs truncate text-right ${match.winner_id === match.away_team_id ? 'text-emerald-700' : 'text-gray-700'}`}>
              {match.winner_id === match.away_team_id && <Trophy size={10} className="inline mr-1 text-amber-500" />}
              {awayTeam?.name ?? 'TBD'}
            </span>
            <TeamAvatar name={awayTeam?.name ?? ''} logoUrl={awayTeam?.logo_url} size={22} />
          </div>
        </div>

        {/* Event rows */}
        {hasEvts && (
          <div className="border-t border-dashed border-emerald-200 pt-2">
            <div className="grid grid-cols-2 gap-x-2">
              <div className="space-y-1">
                {homeRows.map((r, i) => (
                  <div key={i} className={`flex items-center gap-1 text-xs ${r.type === 'own_goal' ? 'text-red-500' : 'text-gray-600'}`}>
                    <EventIcon type={r.type} />
                    <span className="font-medium truncate">
                      {r.playerName}
                      {r.assisterName && <span className="text-gray-400 font-normal"> ({r.assisterName})</span>}
                    </span>
                    {r.minute && <span className="text-gray-400 shrink-0 ml-auto">{r.minute}&apos;</span>}
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                {awayRows.map((r, i) => (
                  <div key={i} className={`flex items-center gap-1 text-xs justify-end ${r.type === 'own_goal' ? 'text-red-500' : 'text-gray-600'}`}>
                    {r.minute && <span className="text-gray-400 shrink-0">{r.minute}&apos;</span>}
                    <span className="font-medium truncate text-right">
                      {r.assisterName && <span className="text-gray-400 font-normal">({r.assisterName}) </span>}
                      {r.playerName}
                    </span>
                    <EventIcon type={r.type} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Edit / Scheduled / Live card ──────────────────────────────────────

  const homeRows = buildRows(match.home_team_id ?? '', events)
  const awayRows = buildRows(match.away_team_id ?? '', events)

  // Shared inline form renderer used in both columns
  function InlineForm({ side }: { side: 'home' | 'away' }) {
    if (!form || form.teamId !== (side === 'home' ? match.home_team_id : match.away_team_id)) return null
    const isGoal = form.actionType === 'goal'
    const submitLabel = form.isOwnGoal ? '↩ АГ' : isGoal ? '⚽ Гол' : form.actionType === 'yellow_card' ? '🟨 ЖК' : '🟥 КК'
    const submitColor = form.isOwnGoal
      ? 'bg-red-100 text-red-600 hover:bg-red-200'
      : isGoal ? 'bg-emerald-600 text-white hover:bg-emerald-700'
      : form.actionType === 'yellow_card' ? 'bg-yellow-400 text-black hover:bg-yellow-500'
      : 'bg-red-500 text-white hover:bg-red-600'

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 mb-1.5 space-y-1.5">
        {/* Action type pills */}
        <div className="flex gap-1">
          {([
            { v: 'goal' as const,        l: '⚽' },
            { v: 'yellow_card' as const, l: '🟨' },
            { v: 'red_card' as const,    l: '🟥' },
          ]).map(opt => (
            <button key={opt.v}
              onClick={() => setForm(f => f ? { ...f, actionType: opt.v, isOwnGoal: false } : f)}
              className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
                form.actionType === opt.v
                  ? opt.v === 'goal' ? 'bg-emerald-600 text-white'
                  : opt.v === 'yellow_card' ? 'bg-yellow-400 text-black'
                  : 'bg-red-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-500'
              }`}
            >
              {opt.l}
            </button>
          ))}
          {isGoal && (
            <label className="flex items-center gap-1 ml-auto cursor-pointer select-none">
              <input type="checkbox" checked={form.isOwnGoal}
                onChange={e => setForm(f => f ? { ...f, isOwnGoal: e.target.checked } : f)}
                className="accent-red-500 w-3 h-3" />
              <span className="text-xs text-gray-500">↩</span>
            </label>
          )}
        </div>

        {/* Player */}
        <Input
          autoFocus
          value={form.player}
          onChange={e => setForm(f => f ? { ...f, player: e.target.value } : f)}
          onKeyDown={e => e.key === 'Enter' && confirmForm()}
          placeholder={isGoal ? 'Автор гола' : 'Игрок'}
          className="h-7 text-xs bg-white"
        />

        {/* Assister (only for regular goal) */}
        {isGoal && !form.isOwnGoal && (
          <Input
            value={form.assister}
            onChange={e => setForm(f => f ? { ...f, assister: e.target.value } : f)}
            placeholder="Ассистент (опц.)"
            className="h-7 text-xs bg-white"
          />
        )}

        {/* Minute + confirm/cancel */}
        <div className="flex gap-1">
          <Input
            value={form.minute}
            onChange={e => setForm(f => f ? { ...f, minute: e.target.value } : f)}
            placeholder="мин."
            type="number" min={1} max={120}
            className="h-7 text-xs bg-white w-14 shrink-0"
          />
          <button
            onClick={confirmForm}
            disabled={!form.player.trim()}
            className={`flex-1 h-7 rounded-md text-xs font-bold transition-colors disabled:opacity-40 ${submitColor}`}
          >
            {submitLabel}
          </button>
          <button onClick={() => setForm(null)}
            className="h-7 w-7 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0">
            <X size={11} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white border rounded-xl p-3 shadow-sm min-w-[240px] ${
      isDone ? 'border-emerald-200' : isReady ? 'border-gray-200' : 'border-gray-100 opacity-60'
    }`}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-2.5">
        <div>
          {status === 'finished' && <Badge className="bg-emerald-100 text-emerald-700 text-xs"><Check size={10} className="mr-1" />Сыгран</Badge>}
          {status === 'live'     && <Badge className="bg-red-100 text-red-600 text-xs animate-pulse"><Radio size={10} className="mr-1" />LIVE</Badge>}
          {status === 'scheduled'&& <Badge className="bg-gray-100 text-gray-500 text-xs">Не начат</Badge>}
        </div>
        <div className="flex items-center gap-1.5">
          {status === 'live' && (
            <Link href={`/t/${tournamentId}/live?playoff=${match.id}&home=${match.home_team_id}&away=${match.away_team_id}`} target="_blank"
              className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full transition-colors">
              <Radio size={10} /> Табло
            </Link>
          )}
          {status === 'scheduled' && isReady && (
            <button onClick={handleStart} disabled={starting}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full transition-colors disabled:opacity-50">
              <Play size={10} /> {starting ? 'Запуск…' : 'Начать матч'}
            </button>
          )}
          {status === 'finished' && isEditing && (
            <button onClick={() => setIsEditing(false)}
              className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 px-2 py-0.5 rounded-full transition-colors">
              ← Просмотр
            </button>
          )}
        </div>
      </div>

      {/* ── Score row (computed, read-only) ── */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <TeamAvatar name={homeTeam?.name ?? ''} logoUrl={homeTeam?.logo_url} size={22} />
          <span className="font-bold text-sm text-gray-900 truncate">{homeTeam?.name ?? 'TBD'}</span>
        </div>
        <div className={`font-black text-2xl font-mono tabular-nums shrink-0 px-1 ${
          scoreHome === 0 && scoreAway === 0 ? 'text-gray-300' : 'text-gray-900'
        }`}>
          {scoreHome} – {scoreAway}
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="font-bold text-sm text-gray-900 truncate text-right">{awayTeam?.name ?? 'TBD'}</span>
          <TeamAvatar name={awayTeam?.name ?? ''} logoUrl={awayTeam?.logo_url} size={22} />
        </div>
      </div>

      {/* ── Events columns ── */}
      {isReady && (
        <div className="border-t border-dashed border-gray-200 pt-2 mb-2">
          <div className="grid grid-cols-2 gap-x-2">

            {/* Home column */}
            <div>
              {homeRows.map((r, i) => (
                <div key={i} className="flex items-center gap-1 mb-1">
                  <EventIcon type={r.type} />
                  <span className={`text-xs font-medium flex-1 min-w-0 truncate ${r.type === 'own_goal' ? 'text-red-500' : 'text-gray-700'}`}>
                    {r.playerName}
                    {r.assisterName && <span className="text-gray-400 font-normal"> ({r.assisterName})</span>}
                  </span>
                  {r.minute && <span className="text-gray-400 text-[10px] shrink-0">{r.minute}&apos;</span>}
                  <button onClick={() => removeRow(r.i, r.assistIdx)}
                    className="text-gray-400 hover:text-red-500 transition-colors shrink-0 ml-0.5 touch-manipulation">
                    <X size={10} />
                  </button>
                </div>
              ))}
              <InlineForm side="home" />
              {form?.teamId !== match.home_team_id && (
                <button onClick={() => match.home_team_id && openForm(match.home_team_id)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 transition-colors mt-0.5">
                  <Plus size={10} /> Событие
                </button>
              )}
            </div>

            {/* Away column */}
            <div>
              {awayRows.map((r, i) => (
                <div key={i} className="flex items-center gap-1 mb-1 justify-end">
                  <button onClick={() => removeRow(r.i, r.assistIdx)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity shrink-0 mr-0.5">
                    <X size={10} />
                  </button>
                  {r.minute && <span className="text-gray-400 text-[10px] shrink-0">{r.minute}&apos;</span>}
                  <span className={`text-xs font-medium flex-1 min-w-0 truncate text-right ${r.type === 'own_goal' ? 'text-red-500' : 'text-gray-700'}`}>
                    {r.assisterName && <span className="text-gray-400 font-normal">({r.assisterName}) </span>}
                    {r.playerName}
                  </span>
                  <EventIcon type={r.type} />
                </div>
              ))}
              <InlineForm side="away" />
              {form?.teamId !== match.away_team_id && (
                <button onClick={() => match.away_team_id && openForm(match.away_team_id)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 transition-colors mt-0.5 ml-auto">
                  Событие <Plus size={10} />
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Save button ── */}
      {isReady && (
        <div className="flex justify-end pt-1">
          <Button onClick={handleSave} disabled={saving} size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs px-4">
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
