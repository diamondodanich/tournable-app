'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LiveGame, MatchEvent, Team, Tournament } from '@/types'
import { finishLiveMatch } from '@/app/actions/live'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Maximize2, Minimize2, Play, Pause, RotateCcw,
  Plus, Minus, CircleDot, Zap, X, CheckCircle2,
} from 'lucide-react'
import TeamAvatar from '@/components/tournament/TeamAvatar'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────────────────────

type EventType = 'goal' | 'assist' | 'yellow_card' | 'red_card'

const EVENT_TYPES: { value: EventType; label: string; color: string; activeColor: string }[] = [
  { value: 'goal',        label: 'Гол',    color: 'text-gray-400',   activeColor: 'bg-emerald-600 text-white' },
  { value: 'assist',      label: 'Ассист', color: 'text-gray-400',   activeColor: 'bg-blue-600 text-white'    },
  { value: 'yellow_card', label: 'ЖК',     color: 'text-gray-400',   activeColor: 'bg-yellow-500 text-black'  },
  { value: 'red_card',    label: 'КК',     color: 'text-gray-400',   activeColor: 'bg-red-600 text-white'     },
]

const PERIODS = [
  { value: '1',  label: '1-й тайм' },
  { value: '2',  label: '2-й тайм' },
  { value: 'ot', label: 'Доп. время' },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(secs: number) {
  const m = Math.floor(Math.abs(secs) / 60).toString().padStart(2, '0')
  const s = (Math.abs(secs) % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function EventIcon({ type, size = 14 }: { type: string; size?: number }) {
  if (type === 'goal')
    return <CircleDot size={size} className="text-emerald-400 shrink-0" />
  if (type === 'assist')
    return <Zap size={size} className="text-blue-400 shrink-0" />
  if (type === 'yellow_card')
    return <div className="shrink-0 rounded-[2px] bg-yellow-400"
      style={{ width: Math.round(size * 0.65), height: size }} />
  if (type === 'red_card')
    return <div className="shrink-0 rounded-[2px] bg-red-500"
      style={{ width: Math.round(size * 0.65), height: size }} />
  return null
}

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  tournament: Tournament
  teams: Team[]
  initialGame: LiveGame | null
  initialEvents: MatchEvent[]
  isOwner: boolean
  defaultHomeId?: string
  defaultAwayId?: string
  defaultFixtureId?: string
}

// ── Component ──────────────────────────────────────────────────────────────

export default function LiveBoard({
  tournament, teams, initialGame, initialEvents,
  isOwner, defaultHomeId, defaultAwayId, defaultFixtureId,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  // ── Core state ──
  const [game, setGame] = useState<LiveGame | null>(initialGame)
  const [displaySecs, setDisplaySecs] = useState(initialGame?.accumulated_secs ?? 0)
  const [events, setEvents] = useState<MatchEvent[]>(initialEvents)
  const [fullscreen, setFullscreen] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  // ── Team selector state (no game yet) ──
  const [homeId, setHomeId] = useState(defaultHomeId ?? teams[0]?.id ?? '')
  const [awayId, setAwayId] = useState(defaultAwayId ?? (teams[1]?.id ?? ''))
  const [initing, setIniting] = useState(false)

  // ── Add event form ──
  const [newSide, setNewSide] = useState<'home' | 'away'>('home')
  const [newPlayer, setNewPlayer] = useState('')
  const [newType, setNewType] = useState<EventType>('goal')
  const [newMinute, setNewMinute] = useState('')
  const [addingEvent, setAddingEvent] = useState(false)

  // ── Finish match ──
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [finishing, setFinishing] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const gameRef = useRef<LiveGame | null>(initialGame)
  gameRef.current = game

  // ── Realtime: live_games ───────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`live_${tournament.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'live_games',
        filter: `tournament_id=eq.${tournament.id}`,
      }, payload => {
        if (payload.eventType === 'DELETE') {
          if (!isOwner) setIsFinished(true)
          return
        }
        const g = payload.new as LiveGame
        if (!isOwner) {
          setGame(g)
          if (!g.timer_running) setDisplaySecs(g.accumulated_secs)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tournament.id, isOwner])

  // ── Realtime: match_events ─────────────────────────────────────────────
  useEffect(() => {
    const fixtureId = game?.fixture_id ?? defaultFixtureId
    if (!fixtureId) return

    const channel = supabase
      .channel(`events_${fixtureId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'match_events',
        filter: `fixture_id=eq.${fixtureId}`,
      }, payload => {
        const e = payload.new as MatchEvent
        setEvents(prev => [...prev, e])
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'match_events',
        filter: `fixture_id=eq.${fixtureId}`,
      }, payload => {
        setEvents(prev => prev.filter(e => e.id !== payload.old.id))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [game?.fixture_id, defaultFixtureId])

  // ── Timer tick ────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (game?.timer_running && game.started_at) {
      timerRef.current = setInterval(() => {
        const g = gameRef.current
        if (!g?.started_at) return
        const elapsed = Math.floor((Date.now() - new Date(g.started_at).getTime()) / 1000)
        setDisplaySecs(g.accumulated_secs + elapsed)
      }, 200)
    } else {
      setDisplaySecs(game?.accumulated_secs ?? 0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [game?.timer_running, game?.accumulated_secs, game?.started_at])

  // ── beforeunload protection ───────────────────────────────────────────
  useEffect(() => {
    if (!game || !isOwner) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [game, isOwner])

  // ── DB helpers ────────────────────────────────────────────────────────
  const patchGame = useCallback(async (patch: Partial<LiveGame>) => {
    const { error } = await supabase
      .from('live_games')
      .update(patch)
      .eq('tournament_id', tournament.id)
    if (error) toast.error(error.message)
  }, [tournament.id])

  // ── Actions ───────────────────────────────────────────────────────────

  async function handleInit() {
    if (!homeId || !awayId || homeId === awayId) {
      toast.error('Выберите разные команды')
      return
    }
    setIniting(true)
    const fixtureId = defaultFixtureId ?? undefined
    const newGame = {
      tournament_id: tournament.id,
      home_team_id: homeId,
      away_team_id: awayId,
      home_score: 0,
      away_score: 0,
      period: '1',
      timer_running: false,
      accumulated_secs: 0,
      started_at: null as string | null,
      fixture_id: fixtureId ?? null,
    }
    const { data, error } = await supabase
      .from('live_games')
      .upsert(newGame, { onConflict: 'tournament_id' })
      .select()
      .single()
    if (error) { toast.error(error.message); setIniting(false); return }
    setGame(data as LiveGame)
    setDisplaySecs(0)
    setEvents([])
    setIniting(false)
  }

  function handleTimerToggle() {
    if (!game) return
    if (game.timer_running) {
      const patch = { timer_running: false, accumulated_secs: displaySecs, started_at: null as string | null }
      setGame(prev => prev ? { ...prev, ...patch } : prev)
      patchGame(patch)
    } else {
      const now = new Date().toISOString()
      const patch = { timer_running: true, accumulated_secs: displaySecs, started_at: now }
      setGame(prev => prev ? { ...prev, ...patch } : prev)
      patchGame(patch)
    }
  }

  function handleResetTimer() {
    if (!game) return
    const patch = { timer_running: false, accumulated_secs: 0, started_at: null as string | null }
    setGame(prev => prev ? { ...prev, ...patch } : prev)
    setDisplaySecs(0)
    patchGame(patch)
  }

  function handleScore(side: 'home' | 'away', delta: number) {
    if (!game) return
    const patch = side === 'home'
      ? { home_score: Math.max(0, game.home_score + delta) }
      : { away_score: Math.max(0, game.away_score + delta) }
    setGame(prev => prev ? { ...prev, ...patch } : prev)
    patchGame(patch)
  }

  function handlePeriod(p: string) {
    if (!game) return
    setGame(prev => prev ? { ...prev, period: p } : prev)
    patchGame({ period: p })
  }

  async function handleAddEvent() {
    if (!game) return
    const fixtureId = game.fixture_id ?? defaultFixtureId
    if (!fixtureId) { toast.error('Матч не привязан к фикстуре'); return }
    if (!newPlayer.trim()) { toast.error('Введите имя игрока'); return }

    const teamId = newSide === 'home' ? game.home_team_id : game.away_team_id
    if (!teamId) return

    setAddingEvent(true)
    const minute = newMinute ? parseInt(newMinute) : null

    // Optimistic add
    const optimisticEvent: MatchEvent = {
      id: `temp_${Date.now()}`,
      fixture_id: fixtureId,
      team_id: teamId,
      player_name: newPlayer.trim(),
      type: newType,
      minute,
      created_at: new Date().toISOString(),
    }
    setEvents(prev => [...prev, optimisticEvent])

    const { data, error } = await supabase.from('match_events').insert({
      fixture_id: fixtureId,
      team_id: teamId,
      player_name: newPlayer.trim(),
      type: newType,
      minute,
    }).select().single()

    if (error) {
      setEvents(prev => prev.filter(e => e.id !== optimisticEvent.id))
      toast.error(error.message)
    } else {
      // Replace optimistic entry with real one
      setEvents(prev => prev.map(e => e.id === optimisticEvent.id ? data as MatchEvent : e))
      setNewPlayer('')
      setNewMinute('')
    }
    setAddingEvent(false)
  }

  async function handleRemoveEvent(eventId: string) {
    setEvents(prev => prev.filter(e => e.id !== eventId))
    const { error } = await supabase.from('match_events').delete().eq('id', eventId)
    if (error) {
      toast.error(error.message)
      // Restore on failure — refetch
      const fixtureId = game?.fixture_id ?? defaultFixtureId
      if (fixtureId) {
        const { data } = await supabase.from('match_events').select('*').eq('fixture_id', fixtureId)
        if (data) setEvents(data as MatchEvent[])
      }
    }
  }

  async function handleFinish() {
    if (!game) return
    setFinishing(true)
    const result = await finishLiveMatch(tournament.id)
    setFinishing(false)
    if (result?.error) {
      toast.error(result.error)
      return
    }
    setShowFinishConfirm(false)
    setIsFinished(true)
  }

  // ── Derived ───────────────────────────────────────────────────────────

  const homeTeam = teams.find(t => t.id === (game?.home_team_id ?? homeId))
  const awayTeam = teams.find(t => t.id === (game?.away_team_id ?? awayId))
  const currentPeriodLabel = PERIODS.find(p => p.value === game?.period)?.label ?? ''

  const homeEvents = events.filter(e => e.team_id === game?.home_team_id)
  const awayEvents = events.filter(e => e.team_id === game?.away_team_id)
  const sortedEvents = [...events].sort((a, b) => (b.minute ?? 999) - (a.minute ?? 999))

  const newTeamId = newSide === 'home' ? game?.home_team_id : game?.away_team_id

  // ── Finished screen ───────────────────────────────────────────────────

  if (isFinished) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-sm w-full">
          <CheckCircle2 size={56} className="text-emerald-400 mx-auto" />
          <div>
            <p className="text-white font-black text-2xl mb-1">Матч завершён</p>
            <p className="text-gray-400 text-sm">Результат сохранён в турнире</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 flex items-center justify-center gap-6">
            <div className="text-center">
              <TeamAvatar name={homeTeam?.name ?? ''} logoUrl={homeTeam?.logo_url} size={40} />
              <p className="text-gray-400 text-xs mt-1.5 font-bold">{homeTeam?.name}</p>
            </div>
            <p className="text-white font-black text-5xl font-mono">
              {game?.home_score ?? 0} : {game?.away_score ?? 0}
            </p>
            <div className="text-center">
              <TeamAvatar name={awayTeam?.name ?? ''} logoUrl={awayTeam?.logo_url} size={40} />
              <p className="text-gray-400 text-xs mt-1.5 font-bold">{awayTeam?.name}</p>
            </div>
          </div>
          <Button
            onClick={() => router.push(`/dashboard/tournament/${tournament.id}`)}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            Вернуться к турниру
          </Button>
        </div>
      </div>
    )
  }

  // ── No game yet ───────────────────────────────────────────────────────

  if (!game) {
    if (!isOwner) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-lg">Матч ещё не начался</p>
        </div>
      )
    }
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full space-y-6">
          <p className="text-white font-bold text-xl text-center">Выберите команды</p>
          <div className="space-y-3">
            {(['home', 'away'] as const).map(side => (
              <div key={side}>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1.5">
                  {side === 'home' ? 'Хозяева' : 'Гости'}
                </p>
                <select
                  value={side === 'home' ? homeId : awayId}
                  onChange={e => side === 'home' ? setHomeId(e.target.value) : setAwayId(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 border border-gray-700 text-sm"
                >
                  <option value="">Выберите команду</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            ))}
          </div>
          <Button
            onClick={handleInit}
            disabled={initing || !homeId || !awayId || homeId === awayId}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {initing ? 'Запускаем…' : '▶ Начать матч'}
          </Button>
        </div>
      </div>
    )
  }

  // ── Live board ────────────────────────────────────────────────────────

  const boardWrap = fullscreen
    ? 'fixed inset-0 z-50 bg-gray-950 flex flex-col overflow-hidden'
    : 'flex-1 flex flex-col overflow-hidden'

  return (
    <div className={boardWrap}>

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
        {/* Period pills */}
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => isOwner && handlePeriod(p.value)}
              disabled={!isOwner}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                game.period === p.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-500 ' + (isOwner ? 'hover:bg-gray-700 cursor-pointer' : 'cursor-default')
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFullscreen(f => !f)}
          className="text-gray-600 hover:text-gray-300 transition-colors p-1"
        >
          {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      {/* ── Main area: scoreboard + events ───────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">

        {/* ── Scoreboard (left / top) ────────────────────────────── */}
        <div className="flex flex-col items-center justify-center p-6 lg:p-8 lg:flex-1 shrink-0">

          {/* Teams + scores */}
          <div className="flex items-center gap-4 sm:gap-8 w-full max-w-lg">

            {/* Home */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <TeamAvatar name={homeTeam?.name ?? ''} logoUrl={homeTeam?.logo_url} size={fullscreen ? 68 : 52} />
              <p className="text-white font-black text-sm text-center leading-tight truncate w-full text-center">
                {homeTeam?.name}
              </p>
              {/* Home score events summary */}
              {homeEvents.length > 0 && (
                <div className="flex flex-col items-center gap-0.5">
                  {homeEvents.filter(e => e.type === 'goal').map((e, i) => (
                    <span key={i} className="text-gray-500 text-xs">
                      {e.minute ? `${e.minute}'` : ''} {e.player_name}
                    </span>
                  ))}
                </div>
              )}
              {isOwner && (
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => handleScore('home', -1)} disabled={game.home_score <= 0}
                    className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-30">
                    <Minus size={14} />
                  </button>
                  <span className={`font-black text-white font-mono w-14 text-center tabular-nums ${fullscreen ? 'text-7xl' : 'text-5xl'}`}>
                    {game.home_score}
                  </span>
                  <button onClick={() => handleScore('home', 1)}
                    className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              )}
              {!isOwner && (
                <span className={`font-black text-white font-mono tabular-nums ${fullscreen ? 'text-7xl' : 'text-5xl'}`}>
                  {game.home_score}
                </span>
              )}
            </div>

            {/* Center: timer */}
            <div className="flex flex-col items-center gap-3 shrink-0">
              <span className={`font-mono font-black tabular-nums ${
                game.timer_running ? 'text-emerald-400' : 'text-gray-600'
              } ${fullscreen ? 'text-3xl' : 'text-xl'}`}>
                {formatTime(displaySecs)}
              </span>
              {isOwner && (
                <div className="flex gap-1.5">
                  <button onClick={handleTimerToggle}
                    className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition-colors">
                    {game.timer_running ? <Pause size={15} /> : <Play size={15} />}
                  </button>
                  <button onClick={handleResetTimer}
                    className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors">
                    <RotateCcw size={13} />
                  </button>
                </div>
              )}
              <span className="text-gray-700 text-xs font-bold uppercase tracking-wider">
                {currentPeriodLabel}
              </span>
            </div>

            {/* Away */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <TeamAvatar name={awayTeam?.name ?? ''} logoUrl={awayTeam?.logo_url} size={fullscreen ? 68 : 52} />
              <p className="text-white font-black text-sm text-center leading-tight truncate w-full text-center">
                {awayTeam?.name}
              </p>
              {awayEvents.length > 0 && (
                <div className="flex flex-col items-center gap-0.5">
                  {awayEvents.filter(e => e.type === 'goal').map((e, i) => (
                    <span key={i} className="text-gray-500 text-xs">
                      {e.minute ? `${e.minute}'` : ''} {e.player_name}
                    </span>
                  ))}
                </div>
              )}
              {isOwner && (
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => handleScore('away', -1)} disabled={game.away_score <= 0}
                    className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-30">
                    <Minus size={14} />
                  </button>
                  <span className={`font-black text-white font-mono w-14 text-center tabular-nums ${fullscreen ? 'text-7xl' : 'text-5xl'}`}>
                    {game.away_score}
                  </span>
                  <button onClick={() => handleScore('away', 1)}
                    className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              )}
              {!isOwner && (
                <span className={`font-black text-white font-mono tabular-nums ${fullscreen ? 'text-7xl' : 'text-5xl'}`}>
                  {game.away_score}
                </span>
              )}
            </div>
          </div>

          {/* Finish button */}
          {isOwner && (
            <button
              onClick={() => setShowFinishConfirm(true)}
              className="mt-6 text-xs text-gray-600 hover:text-red-400 underline underline-offset-2 transition-colors"
            >
              Завершить матч
            </button>
          )}
        </div>

        {/* ── Event panel (right / bottom) ──────────────────────── */}
        <div className="flex flex-col border-t lg:border-t-0 lg:border-l border-gray-800 lg:w-80 xl:w-96 shrink-0 min-h-0">

          {/* Add event form — owner only */}
          {isOwner && (game.fixture_id || defaultFixtureId) && (
            <div className="p-4 border-b border-gray-800 space-y-3 shrink-0">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Добавить событие
              </p>

              {/* Home / Away toggle */}
              <div className="flex gap-1 bg-gray-800 p-0.5 rounded-lg">
                {(['home', 'away'] as const).map(side => (
                  <button
                    key={side}
                    onClick={() => setNewSide(side)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                      newSide === side ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {side === 'home' ? (homeTeam?.name ?? 'Хозяева') : (awayTeam?.name ?? 'Гости')}
                  </button>
                ))}
              </div>

              {/* Event type pills */}
              <div className="flex gap-1.5 flex-wrap">
                {EVENT_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setNewType(t.value)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                      newType === t.value ? t.activeColor : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                    }`}
                  >
                    <EventIcon type={t.value} size={11} />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Player + minute */}
              <div className="flex gap-2">
                <Input
                  value={newPlayer}
                  onChange={e => setNewPlayer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddEvent()}
                  placeholder="Имя игрока"
                  className="flex-1 h-8 text-xs bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
                />
                <Input
                  value={newMinute}
                  onChange={e => setNewMinute(e.target.value)}
                  placeholder="мин."
                  type="number" min={1} max={120}
                  className="w-16 h-8 text-xs bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
                />
              </div>

              <Button
                onClick={handleAddEvent}
                disabled={addingEvent || !newPlayer.trim()}
                size="sm"
                className="w-full h-8 bg-gray-700 hover:bg-gray-600 text-white text-xs"
              >
                <Plus size={13} className="mr-1" />
                {addingEvent ? 'Добавляем…' : 'Добавить'}
              </Button>
            </div>
          )}

          {/* Event feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0">
            {sortedEvents.length === 0 ? (
              <p className="text-gray-700 text-xs text-center pt-4">
                Нет событий
              </p>
            ) : (
              sortedEvents.map(e => {
                const team = teams.find(t => t.id === e.team_id)
                return (
                  <div key={e.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-gray-900 group transition-colors">
                    <EventIcon type={e.type} size={14} />
                    {e.minute && (
                      <span className="text-gray-600 text-xs font-mono w-8 shrink-0">
                        {e.minute}&apos;
                      </span>
                    )}
                    <span className="text-white text-xs font-semibold flex-1 min-w-0 truncate">
                      {e.player_name}
                    </span>
                    <span className="text-gray-600 text-xs shrink-0 truncate max-w-[60px]">
                      {team?.name}
                    </span>
                    {isOwner && (
                      <button
                        onClick={() => handleRemoveEvent(e.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-500 transition-all shrink-0"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Finish confirm modal ──────────────────────────────────── */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <p className="text-white font-black text-xl mb-1">Завершить матч?</p>
            <p className="text-gray-400 text-sm mb-6">
              Результат{' '}
              <span className="text-white font-bold">
                {game.home_score} : {game.away_score}
              </span>{' '}
              и все события будут сохранены в турнире.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleFinish}
                disabled={finishing}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {finishing ? 'Сохраняем…' : 'Сохранить и завершить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
