'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LiveGame, MatchEvent, Team, Tournament } from '@/types'
import { finishLiveMatch } from '@/app/actions/live'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Maximize2, Minimize2, Play, Pause, RotateCcw, CheckCircle2, X } from 'lucide-react'
import TeamAvatar from '@/components/tournament/TeamAvatar'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────────────────────

type GoalType = 'goal' | 'own_goal'
type CardType = 'yellow_card' | 'red_card'

// ── Constants ──────────────────────────────────────────────────────────────

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
  if (type === 'goal')        return <span style={{ fontSize: size }}>⚽</span>
  if (type === 'own_goal')    return <span style={{ fontSize: size }} className="text-red-400">↩</span>
  if (type === 'assist')      return <span style={{ fontSize: size }}>🎯</span>
  if (type === 'yellow_card') return <span className="inline-block rounded-[2px] bg-yellow-400 shrink-0"
    style={{ width: Math.round(size * 0.65), height: size }} />
  if (type === 'red_card')    return <span className="inline-block rounded-[2px] bg-red-500 shrink-0"
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
  const [game, setGame]               = useState<LiveGame | null>(initialGame)
  const [displaySecs, setDisplaySecs] = useState(initialGame?.accumulated_secs ?? 0)
  const [events, setEvents]           = useState<MatchEvent[]>(initialEvents)
  const [fullscreen, setFullscreen]   = useState(false)
  const [isFinished, setIsFinished]   = useState(false)

  // ── Setup state (no game) ──
  const [homeId, setHomeId]   = useState(defaultHomeId ?? teams[0]?.id ?? '')
  const [awayId, setAwayId]   = useState(defaultAwayId ?? (teams[1]?.id ?? ''))
  const [initing, setIniting] = useState(false)

  // ── Form mode ──
  const [formMode, setFormMode] = useState<'goal' | 'card'>('goal')

  // ── Goal form ──
  const [goalSide, setGoalSide]         = useState<'home' | 'away'>('home')
  const [goalType, setGoalType]         = useState<GoalType>('goal')
  const [goalPlayer, setGoalPlayer]     = useState('')
  const [assistPlayer, setAssistPlayer] = useState('')
  const [goalMinute, setGoalMinute]     = useState('')
  const [addingGoal, setAddingGoal]     = useState(false)

  // ── Card form ──
  const [cardSide, setCardSide]     = useState<'home' | 'away'>('home')
  const [cardPlayer, setCardPlayer] = useState('')
  const [cardType, setCardType]     = useState<CardType>('yellow_card')
  const [cardMinute, setCardMinute] = useState('')
  const [addingCard, setAddingCard] = useState(false)

  // ── Finish confirm ──
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [finishing, setFinishing]                 = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const gameRef  = useRef<LiveGame | null>(initialGame)
  gameRef.current = game

  // ── Realtime: live_games ──────────────────────────────────────────────────
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

  // ── Realtime: match_events ────────────────────────────────────────────────
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
        // dedup in case of optimistic entry
        setEvents(prev => [...prev.filter(x => x.id !== e.id), e])
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

  // ── Timer tick ────────────────────────────────────────────────────────────
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

  // ── beforeunload protection ───────────────────────────────────────────────
  useEffect(() => {
    if (!game || !isOwner) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [game, isOwner])

  // ── DB helper ─────────────────────────────────────────────────────────────
  const patchGame = useCallback(async (patch: Partial<LiveGame>) => {
    const { error } = await supabase
      .from('live_games').update(patch).eq('tournament_id', tournament.id)
    if (error) toast.error(error.message)
  }, [tournament.id])

  // ── Init match ────────────────────────────────────────────────────────────
  async function handleInit() {
    if (!homeId || !awayId || homeId === awayId) { toast.error('Выберите разные команды'); return }
    setIniting(true)
    const { data, error } = await supabase
      .from('live_games')
      .upsert({
        tournament_id: tournament.id,
        home_team_id:  homeId,
        away_team_id:  awayId,
        home_score: 0, away_score: 0,
        period: '1', timer_running: false,
        accumulated_secs: 0, started_at: null,
        fixture_id: defaultFixtureId ?? null,
      }, { onConflict: 'tournament_id' })
      .select().single()
    if (error) { toast.error(error.message); setIniting(false); return }
    setGame(data as LiveGame)
    setDisplaySecs(0)
    setEvents([])
    setIniting(false)
  }

  // ── Timer toggle ──────────────────────────────────────────────────────────
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

  function handlePeriod(p: string) {
    if (!game) return
    setGame(prev => prev ? { ...prev, period: p } : prev)
    patchGame({ period: p })
  }

  // ── Add goal (+ optional assist) ──────────────────────────────────────────
  async function handleAddGoal() {
    if (!game) return
    const fixtureId = game.fixture_id ?? defaultFixtureId
    if (!fixtureId) { toast.error('Матч не привязан к фикстуре'); return }
    if (!goalPlayer.trim()) { toast.error('Введите имя голеадора'); return }

    const scorerTeamId = goalSide === 'home' ? game.home_team_id : game.away_team_id
    if (!scorerTeamId) return

    setAddingGoal(true)
    const minute = goalMinute ? parseInt(goalMinute) : null

    // own_goal: scorer's OPPONENT gets the point
    const scorePatch: Partial<LiveGame> = goalType === 'own_goal'
      ? (goalSide === 'home'
          ? { away_score: game.away_score + 1 }
          : { home_score: game.home_score + 1 })
      : (goalSide === 'home'
          ? { home_score: game.home_score + 1 }
          : { away_score: game.away_score + 1 })

    setGame(prev => prev ? { ...prev, ...scorePatch } : prev)
    patchGame(scorePatch)

    // Build optimistic events
    const tempGoalId   = `temp_goal_${Date.now()}`
    const tempAssistId = `temp_assist_${Date.now() + 1}`
    const hasAssist    = assistPlayer.trim().length > 0

    const optimistic: MatchEvent[] = [
      {
        id: tempGoalId, fixture_id: fixtureId,
        team_id: scorerTeamId, player_name: goalPlayer.trim(),
        type: goalType, minute, created_at: new Date().toISOString(),
      },
      ...(hasAssist ? [{
        id: tempAssistId, fixture_id: fixtureId,
        team_id: scorerTeamId, player_name: assistPlayer.trim(),
        type: 'assist' as const, minute, created_at: new Date().toISOString(),
      }] : []),
    ]
    setEvents(prev => [...prev, ...optimistic])

    // Persist goal
    const { data: goalData, error: goalErr } = await supabase
      .from('match_events')
      .insert({ fixture_id: fixtureId, team_id: scorerTeamId, player_name: goalPlayer.trim(), type: goalType, minute })
      .select().single()

    if (goalErr) {
      setEvents(prev => prev.filter(e => e.id !== tempGoalId && e.id !== tempAssistId))
      // rollback score
      setGame(prev => {
        if (!prev) return prev
        return goalType === 'own_goal'
          ? goalSide === 'home'
            ? { ...prev, away_score: prev.away_score - 1 }
            : { ...prev, home_score: prev.home_score - 1 }
          : goalSide === 'home'
            ? { ...prev, home_score: prev.home_score - 1 }
            : { ...prev, away_score: prev.away_score - 1 }
      })
      toast.error(goalErr.message)
      setAddingGoal(false)
      return
    }
    setEvents(prev => prev.map(e => e.id === tempGoalId ? (goalData as MatchEvent) : e))

    // Persist assist
    if (hasAssist) {
      const { data: aData, error: aErr } = await supabase
        .from('match_events')
        .insert({ fixture_id: fixtureId, team_id: scorerTeamId, player_name: assistPlayer.trim(), type: 'assist', minute })
        .select().single()
      if (!aErr && aData) {
        setEvents(prev => prev.map(e => e.id === tempAssistId ? (aData as MatchEvent) : e))
      } else {
        setEvents(prev => prev.filter(e => e.id !== tempAssistId))
      }
    }

    setGoalPlayer('')
    setAssistPlayer('')
    setGoalMinute('')
    setAddingGoal(false)
  }

  // ── Add card (2 YC = auto RC) ─────────────────────────────────────────────
  async function handleAddCard() {
    if (!game) return
    const fixtureId = game.fixture_id ?? defaultFixtureId
    if (!fixtureId) { toast.error('Матч не привязан к фикстуре'); return }
    if (!cardPlayer.trim()) { toast.error('Введите имя игрока'); return }

    const teamId = cardSide === 'home' ? game.home_team_id : game.away_team_id
    if (!teamId) return

    const minute           = cardMinute ? parseInt(cardMinute) : null
    const normalizedName   = cardPlayer.trim().toLowerCase()
    const existingYellows  = events.filter(e =>
      e.type === 'yellow_card' &&
      e.team_id === teamId &&
      e.player_name.trim().toLowerCase() === normalizedName
    )
    const isSecondYellow = cardType === 'yellow_card' && existingYellows.length >= 1

    setAddingCard(true)

    const rows = isSecondYellow
      ? [
          { fixture_id: fixtureId, team_id: teamId, player_name: cardPlayer.trim(), type: 'yellow_card' as const, minute },
          { fixture_id: fixtureId, team_id: teamId, player_name: cardPlayer.trim(), type: 'red_card'    as const, minute },
        ]
      : [{ fixture_id: fixtureId, team_id: teamId, player_name: cardPlayer.trim(), type: cardType, minute }]

    if (isSecondYellow) toast.info(`2-я жёлтая → автоматическая красная для ${cardPlayer.trim()}`)

    const tempIds = rows.map((_, i) => `temp_card_${Date.now() + i}`)
    setEvents(prev => [
      ...prev,
      ...rows.map((r, i) => ({ id: tempIds[i], ...r, created_at: new Date().toISOString() } as MatchEvent)),
    ])

    const { data, error } = await supabase.from('match_events').insert(rows).select()

    if (error) {
      setEvents(prev => prev.filter(e => !tempIds.includes(e.id)))
      toast.error(error.message)
    } else if (data) {
      setEvents(prev => {
        const result = [...prev]
        tempIds.forEach((tid, i) => {
          const idx = result.findIndex(e => e.id === tid)
          if (idx !== -1 && data[i]) result[idx] = data[i] as MatchEvent
        })
        return result
      })
    }

    setCardPlayer('')
    setCardMinute('')
    setAddingCard(false)
  }

  // ── Remove event ──────────────────────────────────────────────────────────
  async function handleRemoveEvent(event: MatchEvent) {
    if (!game) return

    // Adjust score when removing a goal
    if (event.type === 'goal' || event.type === 'own_goal') {
      const patch: Partial<LiveGame> = event.type === 'goal'
        ? (event.team_id === game.home_team_id
            ? { home_score: Math.max(0, game.home_score - 1) }
            : { away_score: Math.max(0, game.away_score - 1) })
        // own_goal: undo the opponent's point
        : (event.team_id === game.home_team_id
            ? { away_score: Math.max(0, game.away_score - 1) }
            : { home_score: Math.max(0, game.home_score - 1) })
      setGame(prev => prev ? { ...prev, ...patch } : prev)
      patchGame(patch)
    }

    setEvents(prev => prev.filter(e => e.id !== event.id))
    const { error } = await supabase.from('match_events').delete().eq('id', event.id)
    if (error) {
      toast.error(error.message)
      const fixtureId = game.fixture_id ?? defaultFixtureId
      if (fixtureId) {
        const { data } = await supabase.from('match_events').select('*').eq('fixture_id', fixtureId)
        if (data) setEvents(data as MatchEvent[])
      }
    }
  }

  // ── Finish match ──────────────────────────────────────────────────────────
  async function handleFinish() {
    if (!game) return
    setFinishing(true)
    const result = await finishLiveMatch(tournament.id)
    setFinishing(false)
    if (result?.error) { toast.error(result.error); return }
    setShowFinishConfirm(false)
    setIsFinished(true)
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const homeTeam = teams.find(t => t.id === (game?.home_team_id ?? homeId))
  const awayTeam = teams.find(t => t.id === (game?.away_team_id ?? awayId))
  const currentPeriodLabel = PERIODS.find(p => p.value === game?.period)?.label ?? ''

  // Events belonging to each side (by team_id, regardless of type)
  const homeEvents = events.filter(e => e.team_id === game?.home_team_id)
  const awayEvents = events.filter(e => e.team_id === game?.away_team_id)

  // Non-assist events for the TV strip (goals & cards), sorted by minute asc
  const homeStrip = homeEvents.filter(e => e.type !== 'assist').sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999))
  const awayStrip = awayEvents.filter(e => e.type !== 'assist').sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999))
  const homeAssists = homeEvents.filter(e => e.type === 'assist')
  const awayAssists = awayEvents.filter(e => e.type === 'assist')

  const hasEvents = events.length > 0
  const hasFixture = !!(game?.fixture_id ?? defaultFixtureId)

  // ── Finished screen ───────────────────────────────────────────────────────

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

  // ── No game yet ───────────────────────────────────────────────────────────

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

  // ── Live board ────────────────────────────────────────────────────────────

  const boardWrap = fullscreen
    ? 'fixed inset-0 z-50 bg-gray-950 flex flex-col overflow-hidden'
    : 'flex-1 flex flex-col overflow-hidden'

  return (
    <div className={boardWrap}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-900/80 border-b border-gray-800 shrink-0">
        {/* Period tabs */}
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => isOwner && handlePeriod(p.value)}
              disabled={!isOwner}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                game.period === p.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-500 ' + (isOwner ? 'hover:bg-gray-700' : 'cursor-default')
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Timer controls — owner only */}
        {isOwner && (
          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={handleTimerToggle}
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition-colors"
            >
              {game.timer_running ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <button
              onClick={handleResetTimer}
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        )}

        <button
          onClick={() => setFullscreen(f => !f)}
          className="ml-auto text-gray-600 hover:text-gray-300 transition-colors p-1"
        >
          {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Scoreboard ──────────────────────────────────────────────── */}
        <div className="flex items-stretch">

          {/* Home */}
          <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 gap-4 min-w-0">
            <TeamAvatar
              name={homeTeam?.name ?? ''}
              logoUrl={homeTeam?.logo_url}
              size={fullscreen ? 96 : 72}
            />
            <p className="text-white font-black text-xl sm:text-2xl text-center leading-tight line-clamp-2 max-w-[160px]">
              {homeTeam?.name}
            </p>
            <span className={`font-black text-white font-mono tabular-nums leading-none select-none ${
              fullscreen ? 'text-[11rem]' : 'text-[8rem] sm:text-[10rem]'
            }`}>
              {game.home_score}
            </span>
          </div>

          {/* Center */}
          <div className="flex flex-col items-center justify-center gap-3 px-2 shrink-0">
            <span className={`font-black text-gray-700 font-mono select-none ${fullscreen ? 'text-6xl' : 'text-5xl'}`}>
              :
            </span>
            <span className={`font-mono font-black tabular-nums ${
              game.timer_running ? 'text-emerald-400' : 'text-gray-600'
            } ${fullscreen ? 'text-3xl' : 'text-2xl'}`}>
              {formatTime(displaySecs)}
            </span>
            <span className="text-gray-600 text-xs font-bold uppercase tracking-wider text-center">
              {currentPeriodLabel}
            </span>
          </div>

          {/* Away */}
          <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 gap-4 min-w-0">
            <TeamAvatar
              name={awayTeam?.name ?? ''}
              logoUrl={awayTeam?.logo_url}
              size={fullscreen ? 96 : 72}
            />
            <p className="text-white font-black text-xl sm:text-2xl text-center leading-tight line-clamp-2 max-w-[160px]">
              {awayTeam?.name}
            </p>
            <span className={`font-black text-white font-mono tabular-nums leading-none select-none ${
              fullscreen ? 'text-[11rem]' : 'text-[8rem] sm:text-[10rem]'
            }`}>
              {game.away_score}
            </span>
          </div>
        </div>

        {/* ── TV Events strip ──────────────────────────────────────────── */}
        {hasEvents && (
          <div className="mx-4 mb-4 bg-gray-900/70 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-gray-800">

              {/* Home events */}
              <div className="p-4 space-y-2">
                {homeStrip.map(e => (
                  <div key={e.id} className="flex items-center gap-2 group">
                    <span className="text-gray-600 font-mono text-xs w-8 shrink-0">
                      {e.minute != null ? `${e.minute}'` : ''}
                    </span>
                    <EventIcon type={e.type} size={13} />
                    <span className={`text-sm font-semibold flex-1 min-w-0 truncate ${e.type === 'own_goal' ? 'text-red-400' : 'text-gray-200'}`}>
                      {e.player_name}
                      {e.type === 'own_goal' && <span className="text-red-600 text-xs ml-1 font-normal">ОГ</span>}
                    </span>
                    {isOwner && (
                      <button
                        onClick={() => handleRemoveEvent(e)}
                        className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-500 transition-opacity shrink-0"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                ))}
                {homeAssists.map(e => (
                  <div key={e.id} className="flex items-center gap-2 group pl-10">
                    <EventIcon type="assist" size={12} />
                    <span className="text-xs text-gray-500 flex-1 truncate">{e.player_name}</span>
                    {isOwner && (
                      <button
                        onClick={() => handleRemoveEvent(e)}
                        className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-500 transition-opacity shrink-0"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Away events — mirrored */}
              <div className="p-4 space-y-2">
                {awayStrip.map(e => (
                  <div key={e.id} className="flex items-center gap-2 justify-end group">
                    {isOwner && (
                      <button
                        onClick={() => handleRemoveEvent(e)}
                        className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-500 transition-opacity shrink-0"
                      >
                        <X size={11} />
                      </button>
                    )}
                    <span className={`text-sm font-semibold flex-1 min-w-0 truncate text-right ${e.type === 'own_goal' ? 'text-red-400' : 'text-gray-200'}`}>
                      {e.type === 'own_goal' && <span className="text-red-600 text-xs mr-1 font-normal">ОГ</span>}
                      {e.player_name}
                    </span>
                    <EventIcon type={e.type} size={13} />
                    <span className="text-gray-600 font-mono text-xs w-8 shrink-0 text-right">
                      {e.minute != null ? `${e.minute}'` : ''}
                    </span>
                  </div>
                ))}
                {awayAssists.map(e => (
                  <div key={e.id} className="flex items-center gap-2 justify-end group pr-10">
                    {isOwner && (
                      <button
                        onClick={() => handleRemoveEvent(e)}
                        className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-500 transition-opacity shrink-0"
                      >
                        <X size={10} />
                      </button>
                    )}
                    <span className="text-xs text-gray-500 flex-1 truncate text-right">{e.player_name}</span>
                    <EventIcon type="assist" size={12} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Owner: Add event panel ────────────────────────────────── */}
        {isOwner && hasFixture && (
          <div className="mx-4 mb-4 bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4">

            {/* Mode tabs */}
            <div className="flex gap-1 bg-gray-800 p-0.5 rounded-xl">
              <button
                onClick={() => setFormMode('goal')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  formMode === 'goal' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                ⚽ Гол / Авто-гол
              </button>
              <button
                onClick={() => setFormMode('card')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  formMode === 'card' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                🟨 Карточки
              </button>
            </div>

            {/* ── Goal form ──────────────────────────────────────── */}
            {formMode === 'goal' && (
              <div className="space-y-3">

                {/* Goal type: Гол / Авто-гол */}
                <div className="flex gap-1 bg-gray-800 p-0.5 rounded-xl">
                  <button
                    onClick={() => setGoalType('goal')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      goalType === 'goal' ? 'bg-emerald-700 text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    ⚽ Гол
                  </button>
                  <button
                    onClick={() => setGoalType('own_goal')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      goalType === 'own_goal' ? 'bg-red-900 text-red-200' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    ↩ Авто-гол
                  </button>
                </div>

                {/* Side — whose player scored/conceded */}
                <div className="flex gap-1 bg-gray-800 p-0.5 rounded-xl">
                  {(['home', 'away'] as const).map(side => (
                    <button
                      key={side}
                      onClick={() => setGoalSide(side)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all truncate px-2 ${
                        goalSide === side ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {side === 'home' ? (homeTeam?.name ?? 'Хозяева') : (awayTeam?.name ?? 'Гости')}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-gray-500 text-xs block">
                    {goalType === 'own_goal' ? 'Игрок (авто-гол)' : 'Голеадор'}
                  </label>
                  <Input
                    value={goalPlayer}
                    onChange={e => setGoalPlayer(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddGoal()}
                    placeholder="Имя игрока"
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 h-9"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-gray-500 text-xs block">Ассистент (необязательно)</label>
                  <Input
                    value={assistPlayer}
                    onChange={e => setAssistPlayer(e.target.value)}
                    placeholder="Имя ассистента"
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 h-9"
                  />
                </div>

                <Input
                  value={goalMinute}
                  onChange={e => setGoalMinute(e.target.value)}
                  placeholder="Минута (необязательно)"
                  type="number" min={1} max={120}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 h-9"
                />

                <Button
                  onClick={handleAddGoal}
                  disabled={addingGoal || !goalPlayer.trim()}
                  className={`w-full h-10 font-bold ${
                    goalType === 'own_goal'
                      ? 'bg-red-900 hover:bg-red-800 text-red-100'
                      : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {addingGoal ? 'Сохраняем…' : goalType === 'own_goal' ? '↩ Авто-гол' : '⚽ Гол'}
                </Button>
              </div>
            )}

            {/* ── Card form ──────────────────────────────────────── */}
            {formMode === 'card' && (
              <div className="space-y-3">

                {/* Side */}
                <div className="flex gap-1 bg-gray-800 p-0.5 rounded-xl">
                  {(['home', 'away'] as const).map(side => (
                    <button
                      key={side}
                      onClick={() => setCardSide(side)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all truncate px-2 ${
                        cardSide === side ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {side === 'home' ? (homeTeam?.name ?? 'Хозяева') : (awayTeam?.name ?? 'Гости')}
                    </button>
                  ))}
                </div>

                {/* Card type */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setCardType('yellow_card')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      cardType === 'yellow_card' ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                    }`}
                  >
                    <span className="inline-block w-3 h-4 bg-yellow-400 rounded-[2px]" />
                    Жёлтая
                  </button>
                  <button
                    onClick={() => setCardType('red_card')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      cardType === 'red_card' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                    }`}
                  >
                    <span className="inline-block w-3 h-4 bg-red-500 rounded-[2px]" />
                    Красная
                  </button>
                </div>

                <Input
                  value={cardPlayer}
                  onChange={e => setCardPlayer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCard()}
                  placeholder="Имя игрока"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 h-9"
                />

                <Input
                  value={cardMinute}
                  onChange={e => setCardMinute(e.target.value)}
                  placeholder="Минута (необязательно)"
                  type="number" min={1} max={120}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 h-9"
                />

                <Button
                  onClick={handleAddCard}
                  disabled={addingCard || !cardPlayer.trim()}
                  className="w-full h-10 font-bold bg-gray-700 hover:bg-gray-600 text-white"
                >
                  {addingCard ? 'Сохраняем…' : 'Выдать карточку'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Finish button ─────────────────────────────────────── */}
        {isOwner && (
          <div className="px-4 pb-8">
            <button
              onClick={() => setShowFinishConfirm(true)}
              className="w-full py-2.5 text-sm text-gray-600 hover:text-red-400 border border-gray-800 hover:border-red-900/60 rounded-xl transition-colors"
            >
              Завершить матч
            </button>
          </div>
        )}
      </div>

      {/* ── Finish confirm modal ─────────────────────────────────────────── */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <p className="text-white font-black text-xl mb-1">Завершить матч?</p>
            <p className="text-gray-400 text-sm mb-6">
              Результат{' '}
              <span className="text-white font-bold">{game.home_score} : {game.away_score}</span>{' '}
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
