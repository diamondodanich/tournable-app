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

function EvtIcon({ type }: { type: string }) {
  if (type === 'goal')        return <span className="text-xs">⚽</span>
  if (type === 'own_goal')    return <span className="text-xs text-red-500">↩</span>
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
}

function InlineForm({ form, setForm, onConfirm }: InlineFormProps) {
  const isGoal = form.actionType === 'goal'
  const submitLabel = form.isOwnGoal ? '↩ АГ'
    : isGoal ? '⚽ Гол'
    : form.actionType === 'yellow_card' ? '🟨 ЖК' : '🟥 КК'
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
          { v: 'goal'        as const, l: '⚽' },
          { v: 'yellow_card' as const, l: '🟨' },
          { v: 'red_card'    as const, l: '🟥' },
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
            <span className="text-xs text-gray-500">↩</span>
          </label>
        )}
      </div>

      {/* Player name — autoFocus only fires on mount (stable component type) */}
      <Input
        autoFocus
        value={form.player}
        onChange={e => setForm(f => f ? { ...f, player: e.target.value } : f)}
        onKeyDown={e => e.key === 'Enter' && onConfirm()}
        placeholder={isGoal ? 'Автор гола' : 'Игрок'}
        className="h-7 text-xs bg-white w-full"
      />

      {/* Assister — no autoFocus; typing here no longer steals focus back */}
      {isGoal && !form.isOwnGoal && (
        <Input
          value={form.assister}
          onChange={e => setForm(f => f ? { ...f, assister: e.target.value } : f)}
          onKeyDown={e => e.key === 'Enter' && onConfirm()}
          placeholder="Ассистент (опц.)"
          className="h-7 text-xs bg-white w-full"
        />
      )}

      {/* Minute + confirm + cancel */}
      <div className="flex gap-1">
        <Input
          value={form.minute}
          onChange={e => setForm(f => f ? { ...f, minute: e.target.value } : f)}
          placeholder="мин." type="number" min={1} max={120}
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
  const [saving, setSaving]     = useState(false)
  const [starting, setStarting] = useState(false)
  const [status, setStatus]     = useState<'scheduled' | 'live' | 'finished'>(
    fixture.status ?? (fixture.played ? 'finished' : 'scheduled')
  )
  const [isEditing, setIsEditing] = useState(status !== 'finished')
  const [form, setForm]           = useState<FormState | null>(null)

  const homeTeam = teamById(teams, fixture.home_team_id)
  const awayTeam = teamById(teams, fixture.away_team_id)

  // Score computed from tracked goals (same approach as PlayoffTab)
  const hasGoals = events.some(e => e.type === 'goal' || e.type === 'own_goal')
  const cHome = events.filter(e =>
    (e.teamId === fixture.home_team_id && e.type === 'goal') ||
    (e.teamId === fixture.away_team_id && e.type === 'own_goal')
  ).length
  const cAway = events.filter(e =>
    (e.teamId === fixture.away_team_id && e.type === 'goal') ||
    (e.teamId === fixture.home_team_id && e.type === 'own_goal')
  ).length

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
    setStarting(true)
    const prevStatus = status
    setStatus('live')
    const result = await startFixture(fixture.id, tournamentId, fixture.home_team_id ?? undefined, fixture.away_team_id ?? undefined)
    setStarting(false)
    if (result?.error) { setStatus(prevStatus); toast.error(`Ошибка: ${result.error}`); return }
    window.open(`/t/${tournamentId}/live?home=${fixture.home_team_id}&away=${fixture.away_team_id}&fixture=${fixture.id}`, '_blank')
  }

  async function handleSave() {
    // Use computed score if goals are tracked, otherwise use manual inputs
    const hs  = hasGoals ? cHome : parseInt(homeScore)
    const as_ = hasGoals ? cAway : parseInt(awayScore)
    if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) { toast.error('Введите корректный счёт'); return }
    const prevStatus = status
    setStatus('finished')
    setSaving(true)
    toast.success('Результат сохранён')
    const result = await saveFixtureResult(
      fixture.id, tournamentId, hs, as_,
      events.map(e => ({ teamId: e.teamId, playerName: e.playerName, type: e.type, minute: e.minute ? parseInt(e.minute) : undefined }))
    )
    setSaving(false)
    if (result?.error) { setStatus(prevStatus); toast.error(`Ошибка: ${result.error}`) }
    else setIsEditing(false)
  }

  if (fixture.is_bye) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 opacity-60">
        <Badge variant="secondary" className="mb-2 text-xs">ПРОПУСК</Badge>
        <p className="text-sm text-gray-500">{homeTeam?.name ?? awayTeam?.name} — отдыхает</p>
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
          <Badge className="bg-emerald-100 text-emerald-700 text-xs"><Check size={10} className="mr-1" />Сыгран</Badge>
          <button onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition-colors">
            <Pencil size={11} /> Изменить
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 mb-2">
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
        {hasEvts && (
          <div className="border-t border-dashed border-emerald-200 pt-2">
            <div className="grid grid-cols-2 gap-x-2">
              <div className="min-w-0 space-y-1">
                {homeRows.map((r, i) => (
                  <div key={i} className={`flex items-center gap-1 text-xs ${r.type === 'own_goal' ? 'text-red-500' : 'text-gray-600'}`}>
                    <EvtIcon type={r.type} />
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
                    <EvtIcon type={r.type} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Edit / Scheduled / Live ───────────────────────────────────────────────

  const homeRows = buildRows(fixture.home_team_id ?? '', events)
  const awayRows = buildRows(fixture.away_team_id ?? '', events)

  return (
    <div className={`bg-white border rounded-xl p-4 shadow-sm ${status === 'finished' ? 'border-emerald-200' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          {status === 'finished' && <Badge className="bg-emerald-100 text-emerald-700 text-xs"><Check size={10} className="mr-1" />Сыгран</Badge>}
          {status === 'live'     && <Badge className="bg-red-100 text-red-600 text-xs animate-pulse"><Radio size={10} className="mr-1" />LIVE</Badge>}
          {status === 'scheduled'&& <Badge className="bg-gray-100 text-gray-500 text-xs">Не начат</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {status === 'live' && (
            <Link href={`/t/${tournamentId}/live?home=${fixture.home_team_id}&away=${fixture.away_team_id}&fixture=${fixture.id}`} target="_blank"
              className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-full transition-colors">
              <Radio size={11} /> Табло
            </Link>
          )}
          {status === 'scheduled' && (
            <button onClick={handleStart} disabled={starting || !fixture.home_team_id || !fixture.away_team_id}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full transition-colors disabled:opacity-50">
              <Play size={11} /> {starting ? 'Запуск…' : 'Начать матч'}
            </button>
          )}
          {status === 'finished' && isEditing && (
            <button onClick={() => setIsEditing(false)}
              className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-full transition-colors">
              ← Просмотр
            </button>
          )}
        </div>
      </div>

      {/* Score row — computed from goals when tracked, else manual inputs */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <TeamAvatar name={homeTeam?.name ?? ''} logoUrl={homeTeam?.logo_url} size={24} />
          <span className="font-bold text-sm text-gray-900 truncate">{homeTeam?.name}</span>
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
          <span className="font-bold text-sm text-gray-900 truncate text-right">{awayTeam?.name}</span>
          <TeamAvatar name={awayTeam?.name ?? ''} logoUrl={awayTeam?.logo_url} size={24} />
        </div>
      </div>

      {/* Events columns — min-w-0 + overflow-hidden keeps card width stable */}
      <div className="border-t border-dashed border-gray-200 pt-2 mb-3">
        <div className="grid grid-cols-2 gap-x-3">

          {/* Home */}
          <div className="min-w-0 overflow-hidden">
            {homeRows.map((r, i) => (
              <div key={i} className="flex items-center gap-1 mb-1">
                <EvtIcon type={r.type} />
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
            {form?.teamId === fixture.home_team_id && (
              <InlineForm form={form} setForm={setForm} onConfirm={confirmForm} />
            )}
            {form?.teamId !== fixture.home_team_id && (
              <button onClick={() => fixture.home_team_id && openForm(fixture.home_team_id)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 transition-colors mt-0.5">
                <Plus size={10} /> Событие
              </button>
            )}
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
                <EvtIcon type={r.type} />
              </div>
            ))}
            {form?.teamId === fixture.away_team_id && (
              <InlineForm form={form} setForm={setForm} onConfirm={confirmForm} />
            )}
            {form?.teamId !== fixture.away_team_id && (
              <button onClick={() => fixture.away_team_id && openForm(fixture.away_team_id)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 transition-colors mt-0.5 ml-auto">
                Событие <Plus size={10} />
              </button>
            )}
          </div>

        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-700 px-5">
          <Check size={13} className="mr-1.5" />
          {saving ? 'Сохраняем…' : 'Сохранить результат'}
        </Button>
      </div>
    </div>
  )
}

// ── FixturesTab ───────────────────────────────────────────────────────────────

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
