'use client'

import { useState, useRef, useEffect } from 'react'
import { Tournament, Team, PlayoffMatch, MatchEvent } from '@/types'
import { savePlayoffResult, generatePlayoff, startPlayoffMatch } from '@/app/actions/playoff'
import { seededBracketPositions } from '@/lib/tournament/playoff'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trophy, RefreshCw, Check, Plus, X, Radio, Play, Pencil, Loader2, Clock, ChevronRight, Zap, Shield, AlertTriangle, Lock, Star, Flame } from 'lucide-react'
import { toast } from 'sonner'
import TeamAvatar from './TeamAvatar'
import Link from 'next/link'
import { SoccerBall, BasketballBall } from '@/components/icons/sport-icons'
import { tx, type Lang, type TournamentTx } from '@/lib/i18n'
import { getEventDefs, getScoreMode, type EventDef } from '@/lib/sports'
import { confirmDialog } from '@/components/ui/confirm'

// ── Types ─────────────────────────────────────────────────────────────────

type EventEntry = { teamId: string; playerName: string; type: string; minute: string }
type PlayoffFormState = {
  teamId: string; actionType: string
  player: string; assister: string; minute: string; isOwnGoal: boolean
}

function getRoundLabel(ro: number, T: TournamentTx): string {
  const map: Record<number, string> = {
    1: T.roundFinal,
    2: T.roundSemi,
    4: T.roundQuarter,
    8: T.roundR16,
    16: T.roundR32,
  }
  return map[ro] ?? T.roundN(ro)
}

// ── Helpers ───────────────────────────────────────────────────────────────

function teamById(teams: Team[], id: string | null) {
  return teams.find(t => t.id === id) ?? null
}

const BASKETBALL_SPORTS_PT = new Set(['basketball', 'streetball', 'ebasketball'])

function EventIcon({ type, sport, defs }: { type: string; sport?: string; defs: EventDef[] }) {
  const icon = type === 'own_goal' ? 'ball' : defs.find(d => d.type === type)?.icon
  switch (icon) {
    case 'ball': {
      const Ball = BASKETBALL_SPORTS_PT.has(sport ?? '') ? BasketballBall : SoccerBall
      return (
        <div style={{ width: 12, height: 12, color: type === 'own_goal' ? '#ef4444' : 'var(--sp)' }}
          className="inline-flex items-center justify-center shrink-0 align-middle">
          <Ball className="w-full h-full" />
        </div>
      )
    }
    case 'yellow': return <span className="inline-block w-2 h-3 bg-yellow-400 rounded-[2px] align-middle shrink-0" />
    case 'red':    return <span className="inline-block w-2 h-3 bg-red-500 rounded-[2px] align-middle shrink-0" />
    case 'warn':
    case 'foul':   return <AlertTriangle size={11} className="text-amber-500 shrink-0 align-middle" />
    case 'ko':     return <Flame size={11} className="text-red-500 shrink-0 align-middle" />
    case 'submission': return <Lock size={11} className="text-gray-600 shrink-0 align-middle" />
    case 'ace':    return <Zap size={11} className="text-sky-500 shrink-0 align-middle" />
    case 'block':  return <Shield size={11} className="text-indigo-500 shrink-0 align-middle" />
    case 'three':  return <span className="text-[9px] font-black text-orange-500 shrink-0 align-middle leading-none">3PT</span>
    case 'strike': return <X size={11} className="text-red-500 shrink-0 align-middle" />
    case 'touchdown':
    case 'run':
    case 'star':   return <Star size={11} className="shrink-0 align-middle" style={{ color: 'var(--sp)' }} />
    default:       return null
  }
}

// Pair goal-like events with their assists from flat events array
function buildRows(teamId: string, events: EventEntry[], defs: EventDef[]) {
  const assistCapable = new Set(defs.filter(d => d.hasAssist).map(d => d.type))
  const indexed = events.map((e, i) => ({ ...e, i }))
  const mine    = indexed.filter(e => e.teamId === teamId)
  const nonAsst = mine.filter(e => e.type !== 'assist')
  const assists = mine.filter(e => e.type === 'assist')
  const used    = new Set<number>()
  return nonAsst.map(e => {
    let assisterName: string | null = null
    let assistIdx: number | undefined
    if (assistCapable.has(e.type)) {
      const a = assists.find(a => !used.has(a.i) && a.minute === e.minute)
      if (a) { used.add(a.i); assisterName = a.playerName; assistIdx = a.i }
    }
    return { ...e, assisterName, assistIdx }
  })
}

// ── Module-level inline form (avoids remount / autoFocus retrigger) ───────

interface PlayoffInlineFormProps {
  teamId: string | null
  form: PlayoffFormState | null
  setForm: React.Dispatch<React.SetStateAction<PlayoffFormState | null>>
  onConfirm: () => void
  T: TournamentTx
  lang: Lang
  pills: EventDef[]
  ownGoalDef?: EventDef
}

function PlayoffInlineForm({ teamId, form, setForm, onConfirm, T, lang, pills, ownGoalDef }: PlayoffInlineFormProps) {
  if (!form || form.teamId !== teamId) return null
  const selected    = pills.find(p => p.type === form.actionType)
  const isGoalLike  = !!selected?.hasAssist
  const submitLabel = form.isOwnGoal ? (ownGoalDef?.label[lang] ?? '') : selected?.label[lang] ?? ''
  const submitColor = form.isOwnGoal
    ? 'bg-red-100 text-red-600 hover:bg-red-200'
    : selected?.type === 'yellow_card' ? 'bg-yellow-400 text-black hover:bg-yellow-500'
    : selected?.type === 'red_card' ? 'bg-red-500 text-white hover:bg-red-600'
    : 'text-white'
  const brandSubmit = !form.isOwnGoal && selected?.type !== 'yellow_card' && selected?.type !== 'red_card'

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 mb-1.5 space-y-1.5">
      {/* Action type pills */}
      <div className="flex gap-1 flex-wrap">
        {pills.map(opt => {
          const active = form.actionType === opt.type
          return (
            <button key={opt.type}
              onClick={() => setForm(f => f ? { ...f, actionType: opt.type, isOwnGoal: false } : f)}
              style={active && opt.type !== 'yellow_card' && opt.type !== 'red_card' ? { background: 'var(--sp)' } : undefined}
              className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
                active
                  ? opt.type === 'yellow_card' ? 'bg-yellow-400 text-black'
                  : opt.type === 'red_card' ? 'bg-red-500 text-white'
                  : 'text-white'
                  : 'bg-white border border-gray-200 text-gray-500'
              }`}
            >
              {opt.label[lang]}
            </button>
          )
        })}
        {isGoalLike && ownGoalDef && (
          <button
            type="button"
            onClick={() => setForm(f => f ? { ...f, isOwnGoal: !f.isOwnGoal } : f)}
            className={`ml-auto px-2 py-0.5 rounded text-xs font-bold transition-all border ${
              form.isOwnGoal
                ? 'bg-red-100 text-red-600 border-red-300'
                : 'bg-white text-gray-400 border-gray-200 hover:border-red-200 hover:text-red-400'
            }`}
          >
            {ownGoalDef.label[lang]}
          </button>
        )}
      </div>

      {/* Player */}
      <Input
        autoFocus
        value={form.player}
        onChange={e => setForm(f => f ? { ...f, player: e.target.value } : f)}
        onKeyDown={e => e.key === 'Enter' && onConfirm()}
        placeholder={isGoalLike ? T.scorerPlaceholder : T.playerPlaceholder}
        className="h-7 text-xs bg-white w-full"
      />

      {/* Assister (only for regular goal-like events) */}
      {isGoalLike && !form.isOwnGoal && (
        <Input
          value={form.assister}
          onChange={e => setForm(f => f ? { ...f, assister: e.target.value } : f)}
          onKeyDown={e => e.key === 'Enter' && onConfirm()}
          placeholder={T.assisterPlaceholder}
          className="h-7 text-xs bg-white w-full"
        />
      )}

      {/* Minute + confirm/cancel */}
      <div className="flex gap-1">
        <Input
          value={form.minute}
          onChange={e => setForm(f => f ? { ...f, minute: e.target.value } : f)}
          placeholder={T.minutePlaceholder}
          type="number" min={1} max={120}
          className="h-7 text-xs bg-white w-14 shrink-0"
        />
        <button
          onClick={onConfirm}
          disabled={!form.player.trim()}
          style={brandSubmit ? { background: 'var(--sp)' } : undefined}
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

// ── MatchCard ─────────────────────────────────────────────────────────────

function PlayoffMatchCard({
  match, teams, tournamentId, sport, isLive, homeLabel, awayLabel, isPro, T, lang,
}: {
  match: PlayoffMatch
  teams: Team[]
  tournamentId: string
  sport?: string
  isLive: boolean
  homeLabel?: string   // shown when home_team_id is null (e.g. "A1", "1-е м.")
  awayLabel?: string   // shown when away_team_id is null
  isPro?: boolean
  T: TournamentTx
  lang: Lang
}) {
  const [events, setEvents] = useState<EventEntry[]>(
    match.match_events?.map(e => ({
      teamId: e.team_id,
      playerName: e.player_name,
      type: e.type,
      minute: e.minute?.toString() ?? '',
    })) ?? []
  )
  const [saving, setSaving]     = useState(false)
  const [starting, setStarting] = useState(false)
  const [status, setStatus]     = useState<'scheduled' | 'live' | 'finished'>(
    match.winner_id ? 'finished' : isLive ? 'live' : 'scheduled'
  )
  const [isEditing, setIsEditing] = useState(status !== 'finished')
  // Manual score inputs (combat/basketball/… have no goal events to count)
  const [homeScore, setHomeScore] = useState((match.home_score ?? 0).toString())
  const [awayScore, setAwayScore] = useState((match.away_score ?? 0).toString())

  // Inline add-event form (one per card, tied to a team)
  const [form, setForm] = useState<PlayoffFormState | null>(null)

  const homeTeam = teamById(teams, match.home_team_id)
  const awayTeam = teamById(teams, match.away_team_id)
  const isDone   = match.winner_id !== null
  const isReady  = !!(match.home_team_id && match.away_team_id)

  // ── Discipline-aware events ─────────────────────────────────────────────────
  const eventDefs   = getEventDefs(sport)
  const scoreMode   = getScoreMode(sport)
  const manualScore = scoreMode === 'manual'
  const defByType   = new Map(eventDefs.map(d => [d.type, d]))
  const pills       = eventDefs.filter(d => d.type !== 'assist' && !d.countsForOpponent)
  const ownGoalDef  = eventDefs.find(d => d.countsForOpponent)
  const defaultAction = (pills.find(p => p.hasAssist) ?? pills[0])?.type ?? 'goal'
  const scoresForTeam     = (t: string) => (defByType.get(t)?.countsForTeam ?? false)
  const scoresForOpponent = (t: string) => (defByType.get(t)?.countsForOpponent ?? false)

  // Score: derived from goal events for 'count' disciplines, else from inputs / saved.
  const hasGoals  = scoreMode === 'count'
    && events.some(e => scoresForTeam(e.type) || scoresForOpponent(e.type))
  const cHome     = events.filter(e =>
    (e.teamId === match.home_team_id && scoresForTeam(e.type)) ||
    (e.teamId === match.away_team_id && scoresForOpponent(e.type))
  ).length
  const cAway     = events.filter(e =>
    (e.teamId === match.away_team_id && scoresForTeam(e.type)) ||
    (e.teamId === match.home_team_id && scoresForOpponent(e.type))
  ).length
  const scoreHome = hasGoals ? cHome : manualScore ? (parseInt(homeScore) || 0) : (match.home_score ?? 0)
  const scoreAway = hasGoals ? cAway : manualScore ? (parseInt(awayScore) || 0) : (match.away_score ?? 0)

  // Open inline form for a team (close if already open for same team)
  function openForm(teamId: string) {
    if (form?.teamId === teamId) { setForm(null); return }
    setForm({ teamId, actionType: defaultAction, player: '', assister: '', minute: '', isOwnGoal: false })
  }

  // Confirm: add event(s) and close form
  function confirmForm() {
    if (!form || !form.player.trim()) return
    const selected = defByType.get(form.actionType)
    const type = form.isOwnGoal && ownGoalDef ? ownGoalDef.type : form.actionType
    const added: EventEntry[] = [
      { teamId: form.teamId, playerName: form.player.trim(), type, minute: form.minute },
    ]
    if (selected?.hasAssist && !form.isOwnGoal && form.assister.trim()) {
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
    // Live scoreboard is available on all plans (gate removed 2026-07 by product decision)
    setStarting(true)
    const prevStatus = status
    setStatus('live')
    const result = await startPlayoffMatch(match.id, tournamentId, match.home_team_id, match.away_team_id)
    setStarting(false)
    if (result?.error) { setStatus(prevStatus); toast.error(T.errorPrefix(result.error)); return }
    window.open(`/t/${tournamentId}/live?playoff=${match.id}&home=${match.home_team_id}&away=${match.away_team_id}`, '_blank')
  }

  // Best-of-N series: home_score/away_score are GAMES WON; winner needs winTarget wins
  const bestOf = match.best_of ?? 1
  const winTarget = Math.ceil(bestOf / 2)
  const isSeries = bestOf > 1
  // Two-legged tie: home_score/away_score are the AGGREGATE across both legs.
  const twoLegged = match.two_legged ?? false

  async function handleSave() {
    if (scoreHome === scoreAway) { toast.error(T.playoffNoDraw); return }
    if (isSeries && Math.max(scoreHome, scoreAway) !== winTarget) {
      toast.error(T.seriesNeedsClinch(winTarget))
      return
    }
    const prevStatus = status
    setStatus('finished')
    setSaving(true)
    const result = await savePlayoffResult(
      match.id, tournamentId, scoreHome, scoreAway,
      events.map(e => ({ teamId: e.teamId, playerName: e.playerName, type: e.type, minute: e.minute ? parseInt(e.minute) : undefined })),
    )
    setSaving(false)
    if (result?.error) { setStatus(prevStatus); toast.error(T.errorPrefix(result.error)) }
    else { toast.success(T.resultSaved); setIsEditing(false) }
  }

  // ── Finished summary view ─────────────────────────────────────────────

  if (status === 'finished' && !isEditing) {
    const homeRows = buildRows(match.home_team_id ?? '', events, eventDefs)
    const awayRows = buildRows(match.away_team_id ?? '', events, eventDefs)
    const hasEvts  = homeRows.length > 0 || awayRows.length > 0

    return (
      <div className="bg-gradient-to-b from-emerald-50/60 to-white border border-emerald-200 rounded-xl p-3 shadow-sm w-[300px] max-w-[85vw]">
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <Badge className="bg-emerald-100 text-emerald-700 text-xs">
            <Check size={10} className="mr-1" />{T.statusPlayed}
          </Badge>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-full transition-colors"
          >
            <Pencil size={10} /> {T.btnEdit}
          </button>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {homeTeam && <TeamAvatar name={homeTeam.name} logoUrl={homeTeam.logo_url} size={22} />}
            <span className={`font-bold text-xs ${homeTeam ? (match.winner_id === match.home_team_id ? 'text-emerald-700' : 'text-gray-700') : 'text-gray-400 italic'}`}>
              {homeTeam?.name ?? homeLabel ?? 'TBD'}
              {match.winner_id === match.home_team_id && <Trophy size={10} className="inline ml-1 text-amber-500" />}
            </span>
          </div>
          <div className="font-black text-xl text-gray-900 font-mono shrink-0 tabular-nums">
            {scoreHome} – {scoreAway}
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
            <span className={`font-bold text-xs text-right ${awayTeam ? (match.winner_id === match.away_team_id ? 'text-emerald-700' : 'text-gray-700') : 'text-gray-400 italic'}`}>
              {match.winner_id === match.away_team_id && <Trophy size={10} className="inline mr-1 text-amber-500" />}
              {awayTeam?.name ?? awayLabel ?? 'TBD'}
            </span>
            {awayTeam && <TeamAvatar name={awayTeam.name} logoUrl={awayTeam.logo_url} size={22} />}
          </div>
        </div>

        {/* Event rows */}
        {hasEvts && (
          <div className="border-t border-dashed border-emerald-200 pt-2">
            <div className="grid grid-cols-2 gap-x-2">
              <div className="space-y-1">
                {homeRows.map((r, i) => (
                  <div key={i} className={`flex items-center gap-1 text-xs ${r.type === 'own_goal' ? 'text-red-500' : 'text-gray-600'}`}>
                    <EventIcon type={r.type} sport={sport} defs={eventDefs} />
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
                    <EventIcon type={r.type} sport={sport} defs={eventDefs} />
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

  const homeRows = buildRows(match.home_team_id ?? '', events, eventDefs)
  const awayRows = buildRows(match.away_team_id ?? '', events, eventDefs)

  return (
    <div className={`bg-white border rounded-xl p-3 shadow-sm w-[300px] max-w-[85vw] ${
      isDone ? 'border-emerald-200' : isReady ? 'border-gray-200' : 'border-dashed border-gray-200 bg-gray-50/40'
    }`}>
      {/* ── Header (only shown when match has teams or is in progress) ── */}
      {(isReady || status === 'finished' || status === 'live') && (
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            {status === 'finished' && <Badge className="bg-emerald-100 text-emerald-700 text-xs"><Check size={10} className="mr-1" />{T.statusPlayed}</Badge>}
            {status === 'live'     && <Badge className="bg-red-100 text-red-600 text-xs animate-pulse"><Radio size={10} className="mr-1" />{T.statusLive}</Badge>}
            {status === 'scheduled' && isReady && <Badge className="bg-gray-100 text-gray-500 text-xs">{T.statusScheduled}</Badge>}
            {isSeries && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 leading-none">Bo{bestOf}</span>}
            {twoLegged && <span title={T.twoLeggedTie} className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 leading-none">×2</span>}
          </div>
          <div className="flex items-center gap-1.5">
            {status === 'live' && (
              <Link href={`/t/${tournamentId}/live?playoff=${match.id}&home=${match.home_team_id}&away=${match.away_team_id}`} target="_blank"
                className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full transition-colors">
                <Radio size={10} /> {T.btnLiveBoard}
              </Link>
            )}
            {status === 'scheduled' && isReady && (
              <button onClick={handleStart} disabled={starting}
                className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full transition-colors disabled:opacity-50 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100">
                <Play size={10} />
                {starting ? T.btnStarting : T.btnStartMatch}
              </button>
            )}
            {status === 'finished' && isEditing && (
              <button onClick={() => setIsEditing(false)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 px-2 py-0.5 rounded-full transition-colors">
                {T.btnViewResult}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Score row ── */}
      {!homeTeam && !awayTeam ? (
        // Placeholder state: show seed labels as pills
        <div className="flex items-center justify-between gap-2 py-2">
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full leading-none shrink-0">
            {homeLabel ?? 'TBD'}
          </span>
          <span className="text-[10px] text-gray-300 font-black tracking-widest">VS</span>
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full leading-none shrink-0">
            {awayLabel ?? 'TBD'}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {homeTeam && <TeamAvatar name={homeTeam.name} logoUrl={homeTeam.logo_url} size={22} />}
            <span className={`font-bold text-sm leading-tight break-words line-clamp-2 ${homeTeam ? 'text-gray-900' : 'text-gray-400 italic'}`}>
              {homeTeam?.name ?? homeLabel ?? 'TBD'}
            </span>
          </div>
          {manualScore && isEditing ? (
            <div className="flex items-center gap-1 shrink-0 px-1">
              <Input type="number" min={0} max={999} value={homeScore} onChange={e => setHomeScore(e.target.value)}
                className="w-10 text-center font-mono text-base font-bold p-1 h-8" />
              <span className="font-bold text-gray-400 text-sm">–</span>
              <Input type="number" min={0} max={999} value={awayScore} onChange={e => setAwayScore(e.target.value)}
                className="w-10 text-center font-mono text-base font-bold p-1 h-8" />
            </div>
          ) : (
            <div className={`font-black text-2xl font-mono tabular-nums shrink-0 px-2 ${
              scoreHome === 0 && scoreAway === 0 ? 'text-gray-300' : 'text-gray-900'
            }`}>
              {scoreHome} – {scoreAway}
            </div>
          )}
          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
            <span className={`font-bold text-sm text-right leading-tight break-words line-clamp-2 ${awayTeam ? 'text-gray-900' : 'text-gray-400 italic'}`}>
              {awayTeam?.name ?? awayLabel ?? 'TBD'}
            </span>
            {awayTeam && <TeamAvatar name={awayTeam.name} logoUrl={awayTeam.logo_url} size={22} />}
          </div>
        </div>
      )}

      {/* ── Events columns — only for disciplines with in-match events ── */}
      {isReady && eventDefs.length > 0 && (
        <div className="border-t border-dashed border-gray-200 pt-2 mb-2">
          <div className="grid grid-cols-2 gap-x-2">

            {/* Home column */}
            <div className="min-w-0 overflow-hidden">
              {homeRows.map((r, i) => (
                <div key={i} className="flex items-center gap-1 mb-1">
                  <EventIcon type={r.type} sport={sport} defs={eventDefs} />
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
              <button onClick={() => match.home_team_id && openForm(match.home_team_id)}
                style={form?.teamId === match.home_team_id ? { color: 'var(--sp)' } : undefined}
                className={`flex items-center gap-1 text-xs transition-colors mt-0.5 ${
                  form?.teamId === match.home_team_id ? 'font-bold' : 'text-gray-400 hover:text-gray-600'
                }`}>
                <Plus size={10} /> {T.addEvent}
              </button>
            </div>

            {/* Away column */}
            <div className="min-w-0 overflow-hidden">
              {awayRows.map((r, i) => (
                <div key={i} className="flex items-center gap-1 mb-1 justify-end">
                  <button onClick={() => removeRow(r.i, r.assistIdx)}
                    className="text-gray-400 hover:text-red-500 transition-colors shrink-0 mr-0.5 touch-manipulation">
                    <X size={10} />
                  </button>
                  {r.minute && <span className="text-gray-400 text-[10px] shrink-0">{r.minute}&apos;</span>}
                  <span className={`text-xs font-medium flex-1 min-w-0 truncate text-right ${r.type === 'own_goal' ? 'text-red-500' : 'text-gray-700'}`}>
                    {r.assisterName && <span className="text-gray-400 font-normal">({r.assisterName}) </span>}
                    {r.playerName}
                  </span>
                  <EventIcon type={r.type} sport={sport} defs={eventDefs} />
                </div>
              ))}
              <button onClick={() => match.away_team_id && openForm(match.away_team_id)}
                style={form?.teamId === match.away_team_id ? { color: 'var(--sp)' } : undefined}
                className={`flex items-center gap-1 text-xs transition-colors mt-0.5 ml-auto ${
                  form?.teamId === match.away_team_id ? 'font-bold' : 'text-gray-400 hover:text-gray-600'
                }`}>
                {T.addEvent} <Plus size={10} />
              </button>
            </div>

          </div>

          {/* Full-width add-event form — spans whole card so inputs never widen it */}
          {form && (form.teamId === match.home_team_id || form.teamId === match.away_team_id) && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{T.eventFor}</span>
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full max-w-[70%] truncate">
                  {form.teamId === match.home_team_id ? homeTeam?.name : awayTeam?.name}
                </span>
              </div>
              <PlayoffInlineForm teamId={form.teamId} form={form} setForm={setForm} onConfirm={confirmForm} T={T} lang={lang} pills={pills} ownGoalDef={ownGoalDef} />
            </div>
          )}
        </div>
      )}

      {/* ── Save button ── */}
      {isReady && (
        <div className="flex justify-end pt-1">
          <Button onClick={handleSave} disabled={saving} size="sm"
            className="bg-[var(--sp)] hover:bg-[var(--spd)] h-7 text-xs px-4">
            {saving
              ? <Loader2 size={11} className="mr-1 animate-spin" />
              : <Check size={11} className="mr-1" />}
            {saving ? T.saving : isDone ? T.btnUpdate : T.btnSaveResult}
          </Button>
        </div>
      )}
    </div>
  )
}

// ── PlayoffTab ────────────────────────────────────────────────────────────

// ── Position label helpers ─────────────────────────────────────────────────

/**
 * Computes a position label for a given seed index based on tournament format.
 *
 * groups_playoff → "A1", "B2", "C1" …
 * league_playoff → "1-е м.", "2-е м.", "8-е м." …
 */
function seedLabel(seedIndex: number, format: string, groupsCount: number, T: TournamentTx): string {
  if (format === 'groups_playoff') {
    const place    = Math.floor(seedIndex / groupsCount) + 1
    const letter   = String.fromCharCode(65 + (seedIndex % groupsCount))  // A, B, C …
    return `${letter}${place}`
  }
  if (format === 'league_playoff') {
    const n = seedIndex + 1
    return T.seedPlace(n)
  }
  return 'TBD'
}

// ── PlayoffTab ────────────────────────────────────────────────────────────

export default function PlayoffTab({ tournament, teams, matches, livePlayoffMatchId, isPro = false, lang = 'ru' }: {
  tournament: Tournament
  teams: Team[]
  matches: PlayoffMatch[]
  livePlayoffMatchId?: string | null
  isPro?: boolean
  lang?: Lang
}) {
  const T = tx[lang]
  const [generating, setGenerating] = useState(false)
  const fmt = tournament.format ?? 'playoff'
  const isDE = fmt === 'double_elim'
  const selfGenerating = fmt === 'playoff' || isDE   // formats that own a "generate bracket" button

  // Horizontal-scroll affordance for the bracket (mobile)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollRight, setCanScrollRight] = useState(false)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 24)
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [matches.length])

  function scrollRightBy() {
    scrollRef.current?.scrollBy({ left: 280, behavior: 'smooth' })
  }

  async function handleGenerate() {
    if (selfGenerating && teams.length < 2) { toast.error(T.minTeamsToGenerate); return }
    if (matches.length > 0) {
      const ok = await confirmDialog({ title: T.bracketRegenerateConfirm, tone: 'danger', lang })
      if (!ok) return
    }
    setGenerating(true)
    const res = await generatePlayoff(tournament.id)
    if (res?.error) toast.error(res.error)
    else toast.success(T.bracketCreated)
    setGenerating(false)
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <Trophy size={28} className="text-amber-500" />
        </div>
        <p className="font-bold text-gray-700 text-lg mb-2">{T.emptyBracketTitle}</p>
        <p className="text-sm text-gray-400 mb-6">{T.emptyBracketHint}</p>
        {selfGenerating && (
          <Button onClick={handleGenerate} disabled={generating || teams.length < 2} className="bg-[var(--sp)] hover:bg-[var(--spd)]">
            {generating && <Loader2 size={14} className="mr-2 animate-spin" />}
            {generating ? '…' : T.generateBracket}
          </Button>
        )}
      </div>
    )
  }

  // ── Double elimination: three stacked brackets (Winners / Losers / Grand Final) ──
  if (isDE) {
    const wb = matches.filter(m => m.bracket === 'WB')
    const lb = matches.filter(m => m.bracket === 'LB')
    const gf = matches.filter(m => m.bracket === 'GF')
    const wbRoundVals = [...new Set(wb.map(m => m.round_order))].sort((a, b) => b - a) // desc: first round first
    const lbRoundVals = [...new Set(lb.map(m => m.round_order))].sort((a, b) => a - b) // asc: first round first

    const played = matches.filter(m => m.winner_id !== null).length

    const renderColumn = (label: string, colMatches: PlayoffMatch[]) => (
      <div className="flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400 text-center">{label}</p>
        <div className="flex flex-col gap-4 justify-around flex-1">
          {colMatches.sort((a, b) => a.match_order - b.match_order).map(m => (
            <PlayoffMatchCard
              key={m.id}
              match={m}
              teams={teams}
              tournamentId={tournament.id}
              sport={tournament.sport ?? undefined}
              isLive={livePlayoffMatchId === m.id}
              isPro={isPro}
              T={T}
              lang={lang}
            />
          ))}
        </div>
      </div>
    )

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{T.matchesProgress(played, matches.length)}</p>
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating} className="gap-2 text-xs">
            <RefreshCw size={12} /> {generating ? '…' : T.regenerate}
          </Button>
        </div>

        {/* Winners bracket */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-black text-gray-800">{T.deWinners}</h3>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-6 min-w-max">
              {wbRoundVals.map(ro => (
                <div key={`wb-${ro}`}>{renderColumn(getRoundLabel(ro, T), wb.filter(m => m.round_order === ro))}</div>
              ))}
            </div>
          </div>
        </section>

        {/* Losers bracket */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-5 rounded-full bg-amber-500" />
            <h3 className="text-sm font-black text-gray-800">{T.deLosers}</h3>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-6 min-w-max">
              {lbRoundVals.map((ro, i) => (
                <div key={`lb-${ro}`}>{renderColumn(T.roundN(i + 1), lb.filter(m => m.round_order === ro))}</div>
              ))}
            </div>
          </div>
        </section>

        {/* Grand final */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-5 rounded-full bg-[var(--sp)]" />
            <h3 className="text-sm font-black text-gray-800">{T.deGrandFinal}</h3>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max">
              {renderColumn('', gf)}
            </div>
          </div>
        </section>
      </div>
    )
  }

  // Group by round_order, sort descending (largest = first round)
  const rounds = [...new Set(matches.map(m => m.round_order))].sort((a, b) => b - a)
  const maxRound = rounds[0]  // first (largest) round

  // Compute position labels for groups_playoff and league_playoff
  const groupsCount   = tournament.groups_count   ?? 4
  const teamsAdvance  = tournament.teams_advance  ?? 2
  const totalSeeds    = fmt === 'groups_playoff'
    ? groupsCount * teamsAdvance
    : fmt === 'league_playoff'
      ? teamsAdvance
      : 0

  const positions = totalSeeds >= 2 ? seededBracketPositions(totalSeeds) : []

  // Build a label map: matchId → { home, away }
  const labelMap = new Map<string, { home: string; away: string }>()
  if (positions.length > 0) {
    const firstRoundMatches = matches
      .filter(m => m.round_order === maxRound)
      .sort((a, b) => a.match_order - b.match_order)
    firstRoundMatches.forEach((m, i) => {
      const hiIdx = i * 2
      const aiIdx = i * 2 + 1
      if (hiIdx < positions.length && aiIdx < positions.length) {
        labelMap.set(m.id, {
          home: seedLabel(positions[hiIdx], fmt, groupsCount, T),
          away: seedLabel(positions[aiIdx], fmt, groupsCount, T),
        })
      }
    })
  }

  const played  = matches.filter(m => m.winner_id !== null).length
  const total   = matches.length
  const isPlaceholderOnly = fmt !== 'playoff' && matches.every(m => !m.home_team_id && !m.away_team_id && !m.winner_id)

  return (
    <div className="space-y-4">
      {isPlaceholderOnly ? (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Clock size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800">
              {fmt === 'league_playoff' ? T.awaitingLeagueStage : T.awaitingGroupStage}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {fmt === 'league_playoff' ? T.awaitingLeagueDetail : T.awaitingGroupDetail}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{T.matchesProgress(played, total)}</p>
          {fmt === 'playoff' && (
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating} className="gap-2 text-xs">
              <RefreshCw size={12} /> {generating ? '…' : T.regenerate}
            </Button>
          )}
        </div>
      )}

      <div className="relative">
        <div ref={scrollRef} className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max">
          {rounds.map(ro => (
            <div key={ro} className="flex flex-col gap-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 text-center">
                {getRoundLabel(ro, T)}
              </p>
              <div className="flex flex-col gap-4 justify-around flex-1">
                {matches
                  .filter(m => m.round_order === ro)
                  .sort((a, b) => a.match_order - b.match_order)
                  .map(m => {
                    const labels = labelMap.get(m.id)
                    return (
                      <PlayoffMatchCard
                        key={m.id}
                        match={m}
                        teams={teams}
                        tournamentId={tournament.id}
                        sport={tournament.sport ?? undefined}
                        isLive={livePlayoffMatchId === m.id}
                        homeLabel={labels?.home}
                        awayLabel={labels?.away}
                        isPro={isPro}
                        T={T}
                        lang={lang}
                      />
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
        </div>

        {/* Scroll affordance — fade + tappable chevron when more cards are off-screen */}
        <div
          className={`pointer-events-none absolute top-0 right-0 bottom-4 w-16 bg-gradient-to-l from-gray-50 to-transparent transition-opacity duration-200 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <button
          type="button"
          onClick={scrollRightBy}
          aria-label="Листать дальше"
          className={`absolute top-1/2 right-1 -translate-y-1/2 flex items-center gap-1 bg-white shadow-md border border-gray-200 rounded-full pl-2.5 pr-2 py-1 text-[10px] font-bold text-gray-500 hover:text-emerald-600 transition-all duration-200 ${
            canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {T.scrollMore} <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}
