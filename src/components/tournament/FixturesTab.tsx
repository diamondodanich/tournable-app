'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tournament, Team, Fixture } from '@/types'
import { saveFixtureResult, startFixture, generateNextSwissRound } from '@/app/actions/tournaments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Check, Plus, X, Radio, Play, Pencil, Loader2, Users, Shuffle } from 'lucide-react'
import { toast } from 'sonner'
import TeamAvatar from './TeamAvatar'
import LineupEditor from './LineupEditor'
import SquadEditor from '@/components/championship/SquadEditor'
import Link from 'next/link'
import { SoccerBall, BasketballBall } from '@/components/icons/sport-icons'
import { tx, type Lang, type TournamentTx } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'

type EventType = 'goal' | 'own_goal' | 'assist' | 'yellow_card' | 'red_card'
type ActionType = 'goal' | 'yellow_card' | 'red_card'
type EventEntry = { teamId: string; playerName: string; type: EventType; minute: string }

type FormState = {
  teamId: string
  actionType: ActionType
  player: string
  assister: string
  minute: string
  isOwnGoal: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function teamById(teams: Team[], id: string | null) {
  return teams.find(t => t.id === id) ?? null
}

const BASKETBALL_SPORTS_FT = new Set(['basketball', 'streetball', 'ebasketball'])

function EvtIcon({ type, sport }: { type: string; sport?: string }) {
  if (type === 'goal' || type === 'own_goal') {
    const Ball = BASKETBALL_SPORTS_FT.has(sport ?? '') ? BasketballBall : SoccerBall
    const color = type === 'own_goal' ? 'text-red-500' : 'text-emerald-500'
    return (
      <div style={{ width: 12, height: 12 }} className={`inline-flex items-center justify-center shrink-0 align-middle ${color}`}>
        <Ball className="w-full h-full" />
      </div>
    )
  }
  if (type === 'yellow_card') return <span className="inline-block w-2 h-3 bg-yellow-400 rounded-[2px] align-middle shrink-0" />
  if (type === 'red_card')    return <span className="inline-block w-2 h-3 bg-red-500 rounded-[2px] align-middle shrink-0" />
  return null
}

function buildRows(teamId: string, events: EventEntry[]) {
  const indexed  = events.map((e, i) => ({ ...e, i }))
  const mine     = indexed.filter(e => e.teamId === teamId)
  const nonAssist = mine.filter(e => e.type !== 'assist')
  const assists  = mine.filter(e => e.type === 'assist')
  const used     = new Set<number>()
  return nonAssist.map(e => {
    let assisterName: string | null = null
    let assistIdx: number | undefined
    if (e.type === 'goal') {
      const a = assists.find(a => !used.has(a.i) && a.minute === e.minute)
      if (a) { used.add(a.i); assisterName = a.playerName; assistIdx = a.i }
    }
    return { ...e, assisterName, assistIdx }
  })
}

// ── InlineForm — defined at module level so React never remounts it when the
//    parent re-renders (typing in assister field would re-create an inner
//    function component, causing autoFocus to fire on the player field again).
interface InlineFormProps {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState | null>>
  onConfirm: () => void
  T: TournamentTx
}

function InlineForm({ form, setForm, onConfirm, T }: InlineFormProps) {
  const isGoal = form.actionType === 'goal'
  const submitLabel = form.isOwnGoal ? T.pillOG
    : isGoal ? T.pillGoal
    : form.actionType === 'yellow_card' ? T.pillYC : T.pillRC
  const submitColor = form.isOwnGoal
    ? 'bg-red-100 text-red-600 hover:bg-red-200'
    : isGoal ? 'bg-emerald-600 text-white hover:bg-emerald-700'
    : form.actionType === 'yellow_card' ? 'bg-yellow-400 text-black hover:bg-yellow-500'
    : 'bg-red-500 text-white hover:bg-red-600'

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 mb-1.5 space-y-1.5">
      {/* Type pills */}
      <div className="flex gap-1">
        {([
          { v: 'goal'        as const, l: T.pillGoal },
          { v: 'yellow_card' as const, l: T.pillYC },
          { v: 'red_card'    as const, l: T.pillRC },
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
          >{opt.l}</button>
        ))}
        {isGoal && (
          <label className="flex items-center gap-1 ml-auto cursor-pointer select-none">
            <input type="checkbox" checked={form.isOwnGoal}
              onChange={e => setForm(f => f ? { ...f, isOwnGoal: e.target.checked } : f)}
              className="accent-red-500 w-3 h-3" />
            <span className="text-xs text-gray-500">{T.pillOG}</span>
          </label>
        )}
      </div>

      {/* Player name — autoFocus only fires on mount (stable component type) */}
      <Input
        autoFocus
        value={form.player}
        onChange={e => setForm(f => f ? { ...f, player: e.target.value } : f)}
        onKeyDown={e => e.key === 'Enter' && onConfirm()}
        placeholder={isGoal ? T.scorerPlaceholder : T.playerPlaceholder}
        className="h-7 text-xs bg-white w-full"
      />

      {/* Assister — no autoFocus; typing here no longer steals focus back */}
      {isGoal && !form.isOwnGoal && (
        <Input
          value={form.assister}
          onChange={e => setForm(f => f ? { ...f, assister: e.target.value } : f)}
          onKeyDown={e => e.key === 'Enter' && onConfirm()}
          placeholder={T.assisterPlaceholder}
          className="h-7 text-xs bg-white w-full"
        />
      )}

      {/* Minute + confirm + cancel */}
      <div className="flex gap-1">
        <Input
          value={form.minute}
          onChange={e => setForm(f => f ? { ...f, minute: e.target.value } : f)}
          placeholder={T.minutePlaceholder} type="number" min={1} max={120}
          className="h-7 text-xs bg-white w-14 shrink-0"
        />
        <button onClick={onConfirm} disabled={!form.player.trim()}
          className={`flex-1 h-7 rounded-md text-xs font-bold transition-colors disabled:opacity-40 ${submitColor}`}>
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

// ── FixtureCard ───────────────────────────────────────────────────────────────

function FixtureCard({ fixture, teams, tournamentId, sport, isPro, isEnterprise, T, lang, onSaved, champSquad }: {
  fixture: Fixture
  teams: Team[]
  tournamentId: string
  sport?: string
  isPro: boolean
  isEnterprise: boolean
  T: TournamentTx
  lang: Lang
  onSaved?: () => void
  champSquad?: { leagueId: string; sport: string | null; brand: string; teamLeagueMap: Record<string, string | null> }
}) {
  const [showLineup, setShowLineup] = useState(false)
  const [squadPick, setSquadPick] = useState(false)
  const [squadTeam, setSquadTeam] = useState<{ leagueTeamId: string; name: string } | null>(null)
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
  const [saving, setSaving]       = useState(false)
  const [starting, setStarting]   = useState(false)
  const [status, setStatus]     = useState<'scheduled' | 'live' | 'finished'>(
    fixture.status ?? (fixture.played ? 'finished' : 'scheduled')
  )
  const [isEditing, setIsEditing] = useState(status !== 'finished')
  const [form, setForm]           = useState<FormState | null>(null)
  // Saved score: needed because fixture prop is stale until realtime re-syncs
  const [savedH, setSavedH] = useState<number | null>(
    fixture.played && fixture.home_score != null ? fixture.home_score : null
  )
  const [savedA, setSavedA] = useState<number | null>(
    fixture.played && fixture.away_score != null ? fixture.away_score : null
  )

  const homeTeam = teamById(teams, fixture.home_team_id)
  const awayTeam = teamById(teams, fixture.away_team_id)

  const hasGoals = events.some(e => e.type === 'goal' || e.type === 'own_goal')
  const cHome = events.filter(e =>
    (e.teamId === fixture.home_team_id && e.type === 'goal') ||
    (e.teamId === fixture.away_team_id && e.type === 'own_goal')
  ).length
  const cAway = events.filter(e =>
    (e.teamId === fixture.away_team_id && e.type === 'goal') ||
    (e.teamId === fixture.home_team_id && e.type === 'own_goal')
  ).length

  // Championship match: the "Состав" button edits the persistent team roster (same
  // editor as the team page), syncing everywhere. Standalone Pro tournaments keep
  // the per-match LineupEditor.
  const homeLT = champSquad ? (champSquad.teamLeagueMap[fixture.home_team_id ?? ''] ?? null) : null
  const awayLT = champSquad ? (champSquad.teamLeagueMap[fixture.away_team_id ?? ''] ?? null) : null
  const isChampSquad = !!champSquad && !fixture.is_bye && (!!homeLT || !!awayLT)

  const canLineup = isEnterprise && !fixture.is_bye && !!fixture.home_team_id && !!fixture.away_team_id
  const lineupBtn = (canLineup || isChampSquad) ? (
    <button onClick={() => isChampSquad ? setSquadPick(true) : setShowLineup(true)}
      className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-full transition-colors">
      <Users size={11} /> {T.lineupBtn}
    </button>
  ) : null
  const lineupModal = (
    <>
      {showLineup && !isChampSquad && (
        <LineupEditor
          fixtureId={fixture.id}
          tournamentId={tournamentId}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          onClose={() => setShowLineup(false)}
          lang={lang}
        />
      )}
      {squadPick && isChampSquad && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setSquadPick(false)} />
          <div className="relative w-full max-w-xs bg-white rounded-2xl shadow-2xl p-5 space-y-2">
            <p className="font-black text-gray-900 mb-2">{T.lineupBtn}</p>
            {homeLT && (
              <button onClick={() => { setSquadTeam({ leagueTeamId: homeLT, name: homeTeam?.name ?? '' }); setSquadPick(false) }}
                className="w-full text-left font-bold text-sm px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                {homeTeam?.name}
              </button>
            )}
            {awayLT && (
              <button onClick={() => { setSquadTeam({ leagueTeamId: awayLT, name: awayTeam?.name ?? '' }); setSquadPick(false) }}
                className="w-full text-left font-bold text-sm px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                {awayTeam?.name}
              </button>
            )}
          </div>
        </div>
      )}
      {squadTeam && champSquad && (
        <SquadEditor
          leagueId={champSquad.leagueId}
          leagueTeamId={squadTeam.leagueTeamId}
          teamName={squadTeam.name}
          sport={champSquad.sport}
          brand={champSquad.brand}
          lang={lang}
          onClose={() => setSquadTeam(null)}
        />
      )}
    </>
  )

  function openForm(teamId: string) {
    if (form?.teamId === teamId) { setForm(null); return }
    setForm({ teamId, actionType: 'goal', player: '', assister: '', minute: '', isOwnGoal: false })
  }

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

  function removeRow(eventIdx: number, assistIdx?: number) {
    setEvents(prev => prev.filter((_, i) => i !== eventIdx && i !== assistIdx))
  }

  async function handleStart() {
    if (!fixture.home_team_id || !fixture.away_team_id) return
    // Live scoreboard is available on all plans (gate removed 2026-07 by product decision)
    setStarting(true)
    const prevStatus = status
    setStatus('live')
    const hs = parseInt(homeScore) || 0
    const as_ = parseInt(awayScore) || 0
    const result = await startFixture(fixture.id, tournamentId, fixture.home_team_id ?? undefined, fixture.away_team_id ?? undefined, hs, as_)
    setStarting(false)
    if (result?.error) { setStatus(prevStatus); toast.error(T.errorPrefix(result.error)) }
  }

  async function handleSave() {
    const hs  = hasGoals ? cHome : parseInt(homeScore)
    const as_ = hasGoals ? cAway : parseInt(awayScore)
    if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) { toast.error(T.invalidScore); return }
    const prevStatus = status
    setStatus('finished')
    setSaving(true)
    const result = await saveFixtureResult(
      fixture.id, tournamentId, hs, as_,
      events.map(e => ({ teamId: e.teamId, playerName: e.playerName, type: e.type, minute: e.minute ? parseInt(e.minute) : undefined }))
    )
    setSaving(false)
    if (result?.error) { setStatus(prevStatus); toast.error(T.errorPrefix(result.error)) }
    else { toast.success(T.resultSaved); setIsEditing(false); setSavedH(hs); setSavedA(as_); onSaved?.() }
  }

  if (fixture.is_bye || !fixture.home_team_id || !fixture.away_team_id) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 opacity-60">
        <Badge variant="secondary" className="mb-2 text-xs">{T.byeLabel}</Badge>
        <p className="text-sm text-gray-500">{homeTeam?.name ?? awayTeam?.name} — {T.byeResting}</p>
      </div>
    )
  }

  // ── Finished summary ──────────────────────────────────────────────────────

  if (status === 'finished' && !isEditing) {
    const homeRows = buildRows(fixture.home_team_id ?? '', events)
    const awayRows = buildRows(fixture.away_team_id ?? '', events)
    const hasEvts  = homeRows.length > 0 || awayRows.length > 0

    return (
      <div className="bg-gradient-to-b from-emerald-50/60 to-white border border-emerald-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <Badge className="bg-emerald-100 text-emerald-700 text-xs"><Check size={10} className="mr-1" />{T.statusPlayed}</Badge>
          <button onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition-colors">
            <Pencil size={11} /> {T.btnEdit}
          </button>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <TeamAvatar name={homeTeam?.name ?? ''} logoUrl={homeTeam?.logo_url} size={28} />
            <span className="font-bold text-sm text-gray-900 leading-tight break-words line-clamp-2">{homeTeam?.name}</span>
          </div>
          <div className="font-black text-2xl text-gray-900 font-mono shrink-0 tabular-nums px-2">
            {savedH ?? fixture.home_score ?? 0} – {savedA ?? fixture.away_score ?? 0}
          </div>
          <div className="flex items-center gap-2 justify-end min-w-0">
            <span className="font-bold text-sm text-gray-900 leading-tight break-words line-clamp-2 text-right">{awayTeam?.name}</span>
            <TeamAvatar name={awayTeam?.name ?? ''} logoUrl={awayTeam?.logo_url} size={28} />
          </div>
        </div>
        {hasEvts && (
          <div className="border-t border-dashed border-emerald-200 pt-2">
            <div className="grid grid-cols-2 gap-x-2">
              <div className="min-w-0 space-y-1">
                {homeRows.map((r, i) => (
                  <div key={i} className={`flex items-center gap-1 text-xs ${r.type === 'own_goal' ? 'text-red-500' : 'text-gray-600'}`}>
                    <EvtIcon type={r.type} sport={sport} />
                    <span className="font-medium truncate flex-1 min-w-0">
                      {r.playerName}
                      {r.assisterName && <span className="text-gray-400 font-normal"> ({r.assisterName})</span>}
                    </span>
                    {r.minute && <span className="text-gray-400 shrink-0 ml-auto">{r.minute}&apos;</span>}
                  </div>
                ))}
              </div>
              <div className="min-w-0 space-y-1">
                {awayRows.map((r, i) => (
                  <div key={i} className={`flex items-center gap-1 text-xs justify-end ${r.type === 'own_goal' ? 'text-red-500' : 'text-gray-600'}`}>
                    {r.minute && <span className="text-gray-400 shrink-0">{r.minute}&apos;</span>}
                    <span className="font-medium truncate text-right min-w-0 flex-1">
                      {r.assisterName && <span className="text-gray-400 font-normal">({r.assisterName}) </span>}
                      {r.playerName}
                    </span>
                    <EvtIcon type={r.type} sport={sport} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Scheduled — show only big "Начать матч" button ──────────────────────────

  if (status === 'scheduled') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        {lineupModal}
        <div className="flex items-center justify-between mb-4">
          <Badge className="bg-gray-100 text-gray-500 text-xs">{T.statusScheduled}</Badge>
          {lineupBtn}
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-5">
          <div className="flex items-center gap-2 min-w-0">
            <TeamAvatar name={homeTeam?.name ?? ''} logoUrl={homeTeam?.logo_url} size={28} />
            <span className="font-bold text-sm text-gray-900 leading-tight break-words line-clamp-2">{homeTeam?.name}</span>
          </div>
          <span className="font-black text-xl text-gray-300 font-mono shrink-0 px-1">—</span>
          <div className="flex items-center gap-2 justify-end min-w-0">
            <span className="font-bold text-sm text-gray-900 leading-tight break-words line-clamp-2 text-right">{awayTeam?.name}</span>
            <TeamAvatar name={awayTeam?.name ?? ''} logoUrl={awayTeam?.logo_url} size={28} />
          </div>
        </div>
        <button
          onClick={handleStart}
          disabled={starting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md">
          {starting ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
          {starting ? T.btnStarting : T.btnStartMatch}
        </button>
      </div>
    )
  }

  // ── Edit / Live ───────────────────────────────────────────────────────────

  const homeRows = buildRows(fixture.home_team_id ?? '', events)
  const awayRows = buildRows(fixture.away_team_id ?? '', events)

  return (
    <div className={`bg-white border rounded-xl p-4 shadow-sm ${status === 'finished' ? 'border-emerald-200' : 'border-gray-200'}`}>
      {lineupModal}
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          {status === 'finished' && <Badge className="bg-emerald-100 text-emerald-700 text-xs"><Check size={10} className="mr-1" />{T.statusPlayed}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {lineupBtn}
          {status === 'finished' && isEditing && (
            <button onClick={() => setIsEditing(false)}
              className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-full transition-colors">
              {T.btnViewResult}
            </button>
          )}
        </div>
      </div>

      {/* Score row */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <TeamAvatar name={homeTeam?.name ?? ''} logoUrl={homeTeam?.logo_url} size={24} />
          <span className="font-bold text-sm text-gray-900 leading-tight break-words line-clamp-2">{homeTeam?.name}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {hasGoals ? (
            <span className={`font-black text-2xl font-mono tabular-nums px-1 ${
              cHome === 0 && cAway === 0 ? 'text-gray-300' : 'text-gray-900'
            }`}>
              {cHome} – {cAway}
            </span>
          ) : (
            <>
              <Input type="number" min={0} max={99} value={homeScore} onChange={e => setHomeScore(e.target.value)}
                className="w-11 text-center font-mono text-base font-bold p-1 h-8" />
              <span className="font-bold text-gray-400 text-sm">–</span>
              <Input type="number" min={0} max={99} value={awayScore} onChange={e => setAwayScore(e.target.value)}
                className="w-11 text-center font-mono text-base font-bold p-1 h-8" />
            </>
          )}
        </div>
        <div className="flex items-center gap-2 justify-end min-w-0">
          <span className="font-bold text-sm text-gray-900 leading-tight break-words line-clamp-2 text-right">{awayTeam?.name}</span>
          <TeamAvatar name={awayTeam?.name ?? ''} logoUrl={awayTeam?.logo_url} size={24} />
        </div>
      </div>

      {/* Events columns */}
      <div className="border-t border-dashed border-gray-200 pt-2 mb-3">
        <div className="grid grid-cols-2 gap-x-3">

          {/* Home */}
          <div className="min-w-0 overflow-hidden">
            {homeRows.map((r, i) => (
              <div key={i} className="flex items-center gap-1 mb-1">
                <EvtIcon type={r.type} sport={sport} />
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
            <button onClick={() => fixture.home_team_id && openForm(fixture.home_team_id)}
              className={`flex items-center gap-1 text-xs transition-colors mt-0.5 ${
                form?.teamId === fixture.home_team_id ? 'text-emerald-600 font-bold' : 'text-gray-400 hover:text-emerald-600'
              }`}>
              <Plus size={10} /> {T.addEvent}
            </button>
          </div>

          {/* Away */}
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
                <EvtIcon type={r.type} sport={sport} />
              </div>
            ))}
            <button onClick={() => fixture.away_team_id && openForm(fixture.away_team_id)}
              className={`flex items-center gap-1 text-xs transition-colors mt-0.5 ml-auto ${
                form?.teamId === fixture.away_team_id ? 'text-emerald-600 font-bold' : 'text-gray-400 hover:text-emerald-600'
              }`}>
              {T.addEvent} <Plus size={10} />
            </button>
          </div>

        </div>

        {/* Full-width add-event form */}
        {form && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{T.eventFor}</span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full max-w-[70%] truncate">
                {form.teamId === fixture.home_team_id ? homeTeam?.name : awayTeam?.name}
              </span>
            </div>
            <InlineForm form={form} setForm={setForm} onConfirm={confirmForm} T={T} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        {status === 'live' ? (
          <Link
            href={`/t/${tournamentId}/live?home=${fixture.home_team_id}&away=${fixture.away_team_id}&fixture=${fixture.id}`}
            target="_blank"
            className="flex items-center gap-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-full transition-colors shadow-sm shrink-0">
            <Radio size={12} /> {T.statusLive} · {T.btnLiveBoard}
          </Link>
        ) : <div />}
        <Button onClick={handleSave} disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-700 px-5">
          {saving
            ? <Loader2 size={13} className="mr-1.5 animate-spin" />
            : <Check size={13} className="mr-1.5" />}
          {saving ? T.saving : T.btnSaveResult}
        </Button>
      </div>
    </div>
  )
}

// ── FixturesTab ───────────────────────────────────────────────────────────────

export default function FixturesTab({ tournament, teams, fixtures: initialFixtures, isPro = false, isEnterprise = false, isOwner = false, lang = 'ru', champSquad }: {
  tournament: Tournament
  teams: Team[]
  fixtures: Fixture[]
  isPro?: boolean
  isEnterprise?: boolean
  isOwner?: boolean
  lang?: Lang
  champSquad?: { leagueId: string; sport: string | null; brand: string; teamLeagueMap: Record<string, string | null> }
}) {
  const T = tx[lang]
  const router = useRouter()
  const [fixtures, setFixtures] = useState<Fixture[]>(initialFixtures)
  const [swissGen, setSwissGen] = useState(false)

  const hasUpcoming = initialFixtures.some(f => !f.is_bye && f.home_team_id && f.away_team_id && !f.played)
  const [subTab, setSubTab] = useState<'upcoming' | 'results'>(hasUpcoming ? 'upcoming' : 'results')

  // Keep local state in sync with fresh server data after router.refresh()
  // (useState ignores changed initial values, so an explicit effect is needed).
  // This is what makes saving a result / generating a new Swiss round update the
  // UI immediately without a manual page reload.
  useEffect(() => { setFixtures(initialFixtures) }, [initialFixtures])

  // Realtime sync: reflect other users' saves (UPDATE), newly generated rounds
  // (INSERT) and bracket regeneration (DELETE) without a page reload.
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`fixtures_${tournament.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'fixtures',
        filter: `tournament_id=eq.${tournament.id}`,
      }, payload => {
        if (payload.eventType === 'INSERT') {
          const added = payload.new as Fixture
          setFixtures(prev => prev.some(f => f.id === added.id) ? prev : [...prev, added])
        } else if (payload.eventType === 'DELETE') {
          const removed = payload.old as { id: string }
          setFixtures(prev => prev.filter(f => f.id !== removed.id))
        } else {
          const updated = payload.new as Fixture
          setFixtures(prev => prev.map(f => f.id === updated.id ? { ...f, ...updated } : f))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tournament.id])

  if (!tournament.generated || fixtures.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <p className="font-bold text-gray-600 mb-1">{T.noMatches}</p>
        <p className="text-sm text-gray-400">{T.noMatchesHint}</p>
      </div>
    )
  }

  // A bye is any fixture missing a side — legacy rows may lack the is_bye flag.
  const isByeFixture = (f: Fixture) => f.is_bye || !f.home_team_id || !f.away_team_id

  const played = fixtures.filter(f => !isByeFixture(f) && f.played).length
  const total  = fixtures.filter(f => !isByeFixture(f)).length

  const visibleFixtures = fixtures.filter(f => {
    if (isByeFixture(f)) return false
    return subTab === 'upcoming' ? !f.played : f.played
  })

  const byMatchday = visibleFixtures.reduce<Record<number, Fixture[]>>((acc, f) => {
    if (!acc[f.matchday]) acc[f.matchday] = []
    acc[f.matchday].push(f)
    return acc
  }, {})

  const sortedMatchdays = Object.entries(byMatchday).sort(([mdA], [mdB]) => {
    return subTab === 'results' ? +mdB - +mdA : +mdA - +mdB
  })

  const showCycleLabel = tournament.format === 'round_robin' || tournament.format === 'league_playoff' || !tournament.format

  // ── Swiss: progressive round generation ─────────────────────────────────────
  const isSwiss = tournament.format === 'swiss'
  const maxMatchday = fixtures.reduce((m, f) => Math.max(m, f.matchday), 0)
  const lastRoundComplete = fixtures.filter(f => f.matchday === maxMatchday).every(f => isByeFixture(f) || f.played)
  const swissRoundsLeft = isSwiss ? (tournament.num_rounds ?? 0) - maxMatchday : 0
  const swissT = {
    ru: { next: 'Сгенерировать следующий тур', gen: 'Генерируем…', finishFirst: 'Доиграйте текущий тур, чтобы открыть следующий', allDone: 'Все туры сыграны — победитель в таблице', progress: `Тур ${maxMatchday} из ${tournament.num_rounds ?? maxMatchday}`, done: 'Тур создан' },
    kz: { next: 'Келесі турды жасау', gen: 'Жасалуда…', finishFirst: 'Келесіні ашу үшін ағымдағы турды аяқтаңыз', allDone: 'Барлық тур ойналды — жеңімпаз кестеде', progress: `${maxMatchday} / ${tournament.num_rounds ?? maxMatchday} тур`, done: 'Тур жасалды' },
    en: { next: 'Generate next round', gen: 'Generating…', finishFirst: 'Finish the current round to unlock the next', allDone: 'All rounds played — winner is in the table', progress: `Round ${maxMatchday} of ${tournament.num_rounds ?? maxMatchday}`, done: 'Round created' },
  }[lang]

  async function handleSwissNext() {
    setSwissGen(true)
    const res = await generateNextSwissRound(tournament.id)
    setSwissGen(false)
    if (res?.error) toast.error(res.error)
    else { toast.success(swissT.done); router.refresh() }
  }

  return (
    <div className="space-y-4">
      {isSwiss && isOwner && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Shuffle size={16} className="text-indigo-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-indigo-800">{swissT.progress}</p>
              {swissRoundsLeft <= 0
                ? <p className="text-xs text-indigo-500">{swissT.allDone}</p>
                : !lastRoundComplete
                  ? <p className="text-xs text-indigo-500">{swissT.finishFirst}</p>
                  : null}
            </div>
          </div>
          {swissRoundsLeft > 0 && (
            <button
              onClick={handleSwissNext}
              disabled={swissGen || !lastRoundComplete}
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 px-3.5 py-2.5 sm:py-2 rounded-lg transition-colors">
              {swissGen ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {swissGen ? swissT.gen : swissT.next}
            </button>
          )}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setSubTab('upcoming')}
          className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
            subTab === 'upcoming'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {T.subUpcoming}
        </button>
        <button
          onClick={() => setSubTab('results')}
          className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
            subTab === 'results'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {T.subResults}
          {played > 0 && (
            <span className="ml-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {played}
            </span>
          )}
        </button>
      </div>

      <p className="text-sm text-gray-500">{T.matchesProgress(played, total)}</p>

      {sortedMatchdays.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-400 text-sm font-medium">
            {subTab === 'upcoming' ? T.noUpcomingMatches : T.noResults}
          </p>
        </div>
      ) : sortedMatchdays.map(([md, mxs]) => (
        <div key={md}>
          <div className="flex items-center gap-3 mb-3">
            <span className="font-black text-emerald-600 text-lg">{T.roundLabel(+md)}</span>
            <div className="flex-1 h-px bg-gray-100" />
            {showCycleLabel && (
              <span className="text-xs text-gray-400 uppercase tracking-wide">
                {T.cycleLabel(mxs[0].round, tournament.num_rounds)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mxs.map(f => <FixtureCard key={f.id} fixture={f} teams={teams} tournamentId={tournament.id} sport={tournament.sport ?? undefined} isPro={isPro} isEnterprise={isEnterprise} T={T} lang={lang} onSaved={() => router.refresh()} champSquad={champSquad} />)}
          </div>
        </div>
      ))}
    </div>
  )
}
