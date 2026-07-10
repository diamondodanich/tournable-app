'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LiveGame, MatchEvent, Team, Tournament } from '@/types'
import { finishLiveMatch, initLiveGame, patchLiveGame } from '@/app/actions/live'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Maximize2, Minimize2, Play, Pause, RotateCcw, CheckCircle2, X, AlertTriangle, Plus, Minus } from 'lucide-react'
import TeamAvatar from '@/components/tournament/TeamAvatar'
import { AssistIcon } from '@/components/ui/SportIcon'
import { SoccerBall, BasketballBall } from '@/components/icons/sport-icons'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { APP_URL } from '@/lib/appUrl'
import { useFeedback } from '@/hooks/useFeedback'
import { getSportTheme, getCategoryForSport } from '@/lib/sports'

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

const BASKETBALL_SPORTS = new Set(['basketball', 'streetball', 'ebasketball'])

function GoalBall({ size, sport, className }: { size: number; sport?: string; className?: string }) {
  const Ball = BASKETBALL_SPORTS.has(sport ?? '') ? BasketballBall : SoccerBall
  return (
    <div style={{ width: size, height: size }} className={`inline-flex items-center justify-center shrink-0 ${className ?? ''}`}>
      <Ball className="w-full h-full" />
    </div>
  )
}

function EventIcon({ type, size = 14, sport }: { type: string; size?: number; sport?: string }) {
  if (type === 'goal')        return <GoalBall size={size} sport={sport} className="text-[var(--lb)]" />
  if (type === 'own_goal')    return <GoalBall size={size} sport={sport} className="text-red-400" />
  if (type === 'assist')      return <AssistIcon size={size} className="text-sky-400 shrink-0" />
  if (type === 'yellow_card') return <span className="inline-block rounded-[2px] bg-yellow-400 shrink-0"
    style={{ width: Math.round(size * 0.65), height: size }} />
  if (type === 'red_card')    return <span className="inline-block rounded-[2px] bg-red-500 shrink-0"
    style={{ width: Math.round(size * 0.65), height: size }} />
  return null
}

/** Pair each goal/card event with its assist (same team + minute, first available) */
function pairWithAssists(
  mainEvents: MatchEvent[],
  assists: MatchEvent[]
): { evt: MatchEvent; assist: MatchEvent | null }[] {
  const usedIds = new Set<string>()
  return mainEvents.map(evt => {
    if (evt.type !== 'goal' && evt.type !== 'own_goal') return { evt, assist: null }
    const match = assists.find(a =>
      !usedIds.has(a.id) &&
      a.team_id === evt.team_id &&
      a.minute === evt.minute
    )
    if (match) usedIds.add(match.id)
    return { evt, assist: match ?? null }
  })
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
  defaultPlayoffMatchId?: string
}

// ── Component ──────────────────────────────────────────────────────────────

export default function LiveBoard({
  tournament, teams, initialGame, initialEvents,
  isOwner, defaultHomeId, defaultAwayId, defaultFixtureId, defaultPlayoffMatchId,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const feedback = useFeedback()

  // ── Core state ──
  const [game, setGame]               = useState<LiveGame | null>(initialGame)
  const [displaySecs, setDisplaySecs] = useState(initialGame?.accumulated_secs ?? 0)
  const [events, setEvents]           = useState<MatchEvent[]>(initialEvents)
  const [fullscreen, setFullscreen]   = useState(false)
  const [isFinished, setIsFinished]   = useState(false)
  const [isTimeUp, setIsTimeUp]       = useState(false)

  // ── Setup state (no game) ──
  const [homeId, setHomeId]   = useState(defaultHomeId ?? teams[0]?.id ?? '')
  const [awayId, setAwayId]   = useState(defaultAwayId ?? (teams[1]?.id ?? ''))
  const [initing, setIniting] = useState(false)

  // ── Unified event form ──
  type ActionType = 'goal' | 'yellow_card' | 'red_card'
  const [side, setSide]             = useState<'home' | 'away'>('home')
  const [actionType, setActionType] = useState<ActionType>('goal')
  const [player, setPlayer]         = useState('')
  const [assister, setAssister]     = useState('')
  const [minute, setMinute]         = useState('')   // empty = use timer value
  const [isOwnGoal, setIsOwnGoal]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [playerSuggestions, setPlayerSuggestions] = useState<string[]>([])

  // ── Finish confirm ──
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [finishing, setFinishing]                 = useState(false)

  // ── Add event sheet ──
  const [showForm, setShowForm] = useState(false)

  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const gameRef    = useRef<LiveGame | null>(initialGame)
  const timeUpRef  = useRef(false)
  const warnRef    = useRef(false)
  gameRef.current  = game

  // ── Combat sports (MMA/boxing/wrestling): rounds + count-down round timer,
  // no football events (goals/cards/assists). ────────────────────────────────
  const isCombat = getCategoryForSport(tournament.sport ?? '')?.id === 'combat'

  // Total match duration in seconds based on tournament settings
  const totalDurationSecs = (tournament.match_periods ?? 2) * (tournament.match_duration_mins ?? 45) * 60
  // Combat counts DOWN per round; ball sports count UP across the whole match.
  const roundDurationSecs = (tournament.match_duration_mins ?? 5) * 60
  const timeLimitSecs = isCombat ? roundDurationSecs : totalDurationSecs

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
        // Non-owners always sync; owners/editors sync only when they have no game yet
        // (i.e. they opened the live page before the match was started by another device)
        if (!isOwner || gameRef.current === null) {
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
    const playoffId = game?.playoff_match_id ?? defaultPlayoffMatchId
    const channelKey = fixtureId ?? playoffId
    if (!channelKey) return
    const filterField = fixtureId ? 'fixture_id' : 'playoff_match_id'
    const channel = supabase
      .channel(`events_${channelKey}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'match_events',
        filter: `${filterField}=eq.${channelKey}`,
      }, payload => {
        const e = payload.new as MatchEvent
        setEvents(prev => [...prev.filter(x => x.id !== e.id), e])
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'match_events',
        filter: `${filterField}=eq.${channelKey}`,
      }, payload => {
        setEvents(prev => prev.filter(e => e.id !== payload.old.id))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [game?.fixture_id, game?.playoff_match_id, defaultFixtureId, defaultPlayoffMatchId])

  // ── Timer tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (game?.timer_running && game.started_at) {
      timerRef.current = setInterval(() => {
        const g = gameRef.current
        if (!g?.started_at) return
        const elapsed = Math.floor((Date.now() - new Date(g.started_at).getTime()) / 1000)
        const secs = g.accumulated_secs + elapsed
        setDisplaySecs(secs)

        // Auto-detect time up (only for owner, only fire once)
        if (isOwner && secs >= timeLimitSecs && !timeUpRef.current) {
          timeUpRef.current = true
          setIsTimeUp(true)
          feedback.timeUp()
        }
        // Combat: warn 10 seconds before the round ends
        if (isCombat && isOwner) {
          const remaining = timeLimitSecs - secs
          if (remaining <= 10 && remaining > 0 && !warnRef.current) {
            warnRef.current = true
            feedback.timeUp()
          }
        }
      }, 200)
    } else {
      setDisplaySecs(game?.accumulated_secs ?? 0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [game?.timer_running, game?.accumulated_secs, game?.started_at, isOwner, timeLimitSecs, isCombat])

  // ── beforeunload — only while match is in progress ────────────────────────
  useEffect(() => {
    if (!game || !isOwner || isFinished) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [game, isOwner, isFinished])

  // ── Auto-navigate after finish ─────────────────────────────────────────────
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [closingIn, setClosingIn] = useState<number | null>(null)

  useEffect(() => {
    if (!isFinished) return
    let secs = 3
    setClosingIn(secs)
    const tick = setInterval(() => {
      secs--
      setClosingIn(secs > 0 ? secs : null)
    }, 1000)
    autoCloseTimerRef.current = setTimeout(() => {
      clearInterval(tick)
      if (window.opener && !window.opener.closed) {
        window.opener.location.reload()
        window.close()
      } else {
        router.push(`/dashboard/tournament/${tournament.id}`)
      }
    }, 3000)
    return () => {
      clearInterval(tick)
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current)
    }
  }, [isFinished]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── DB helper ─────────────────────────────────────────────────────────────
  const patchGame = useCallback(async (patch: Partial<LiveGame>) => {
    const { error } = await patchLiveGame(tournament.id, patch as Record<string, unknown>)
    if (error) toast.error(error)
  }, [tournament.id])

  // ── Init match (via server action — works for both owners and editors) ─────
  async function handleInit() {
    if (!homeId || !awayId || homeId === awayId) { toast.error('Выберите разные команды'); return }
    setIniting(true)
    const result = await initLiveGame(
      tournament.id,
      homeId,
      awayId,
      defaultFixtureId ?? null,
      defaultPlayoffMatchId ?? null,
    )
    if (result.error) { toast.error(result.error); setIniting(false); return }
    setGame(result.data as unknown as LiveGame)
    setDisplaySecs(0)
    setEvents([])
    setIniting(false)
  }

  // ── Timer ─────────────────────────────────────────────────────────────────
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
    timeUpRef.current = false
    warnRef.current = false
    setIsTimeUp(false)
    patchGame(patch)
  }

  function handlePeriod(p: string) {
    if (!game) return
    setGame(prev => prev ? { ...prev, period: p } : prev)
    // Combat: each round runs its own count-down, so re-arm the timer on round change.
    if (isCombat) {
      const patch = { timer_running: false, accumulated_secs: 0, started_at: null as string | null, period: p }
      setGame(prev => prev ? { ...prev, ...patch } : prev)
      setDisplaySecs(0)
      timeUpRef.current = false
      warnRef.current = false
      setIsTimeUp(false)
      patchGame(patch)
      return
    }
    patchGame({ period: p })
  }

  // Combat scoring: manual +/- per fighter (no goal events)
  function bumpScore(sideKey: 'home' | 'away', delta: number) {
    if (!game) return
    const patch: Partial<LiveGame> = sideKey === 'home'
      ? { home_score: Math.max(0, game.home_score + delta) }
      : { away_score: Math.max(0, game.away_score + delta) }
    setGame(prev => prev ? { ...prev, ...patch } : prev)
    patchGame(patch)
  }

  // ── Submit event (unified) ────────────────────────────────────────────────
  async function handleSubmit() {
    if (!game) return
    const fixtureId = game.fixture_id ?? defaultFixtureId
    const playoffId = game.playoff_match_id ?? defaultPlayoffMatchId
    if (!fixtureId && !playoffId) { toast.error('Матч не привязан'); return }
    if (!player.trim()) { toast.error('Введите имя игрока'); return }

    const teamId = side === 'home' ? game.home_team_id : game.away_team_id
    if (!teamId) return

    // Supabase generated types predate migration 009 (fixture_id was NOT NULL;
    // now nullable for playoff events). Use unknown cast to escape strict types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventRow = (extra: Record<string, unknown>) => (fixtureId
      ? { fixture_id: fixtureId, team_id: teamId, minute: null, ...extra }
      : { fixture_id: null, playoff_match_id: playoffId, team_id: teamId, minute: null, ...extra }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as unknown as any

    setSubmitting(true)
    // Auto-minute: use current timer minute if field is empty; 0:xx → 1' (football 1-indexed)
    const autoMin = Math.floor(displaySecs / 60)
    const min = minute.trim() ? parseInt(minute) : Math.max(1, autoMin)

    if (actionType === 'goal') {
      const type = isOwnGoal ? 'own_goal' as const : 'goal' as const

      const scorePatch: Partial<LiveGame> = isOwnGoal
        ? (side === 'home' ? { away_score: game.away_score + 1 } : { home_score: game.home_score + 1 })
        : (side === 'home' ? { home_score: game.home_score + 1 } : { away_score: game.away_score + 1 })

      setGame(prev => prev ? { ...prev, ...scorePatch } : prev)
      patchGame(scorePatch)

      const tempGoalId   = `temp_g_${Date.now()}`
      const tempAssistId = `temp_a_${Date.now() + 1}`
      const hasAssist    = assister.trim().length > 0

      setEvents(prev => [
        ...prev,
        { id: tempGoalId, fixture_id: fixtureId ?? null, playoff_match_id: playoffId ?? null, team_id: teamId, player_name: player.trim(), type, minute: min, created_at: new Date().toISOString() },
        ...(hasAssist ? [{ id: tempAssistId, fixture_id: fixtureId ?? null, playoff_match_id: playoffId ?? null, team_id: teamId, player_name: assister.trim(), type: 'assist' as const, minute: min, created_at: new Date().toISOString() }] : []),
      ])

      const { data: goalData, error: goalErr } = await supabase
        .from('match_events')
        .insert(eventRow({ player_name: player.trim(), type, minute: min }))
        .select().single()

      if (!goalErr) feedback.goal()

      if (goalErr) {
        setEvents(prev => prev.filter(e => e.id !== tempGoalId && e.id !== tempAssistId))
        setGame(prev => {
          if (!prev) return prev
          return isOwnGoal
            ? side === 'home' ? { ...prev, away_score: prev.away_score - 1 } : { ...prev, home_score: prev.home_score - 1 }
            : side === 'home' ? { ...prev, home_score: prev.home_score - 1 } : { ...prev, away_score: prev.away_score - 1 }
        })
        toast.error(goalErr.message)
        setSubmitting(false)
        return
      }
      setEvents(prev => prev.map(e => e.id === tempGoalId ? (goalData as MatchEvent) : e))

      if (hasAssist) {
        const { data: aData, error: aErr } = await supabase
          .from('match_events')
          .insert(eventRow({ player_name: assister.trim(), type: 'assist', minute: min }))
          .select().single()
        if (!aErr && aData) {
          setEvents(prev => prev.map(e => e.id === tempAssistId ? (aData as MatchEvent) : e))
        } else {
          setEvents(prev => prev.filter(e => e.id !== tempAssistId))
        }
      }

    } else {
      // Card — check 2YC
      const normalizedName  = player.trim().toLowerCase()
      const existingYellows = events.filter(e =>
        e.type === 'yellow_card' &&
        e.team_id === teamId &&
        e.player_name.trim().toLowerCase() === normalizedName
      )
      const isSecondYellow = actionType === 'yellow_card' && existingYellows.length >= 1

      const rows = isSecondYellow
        ? [
            eventRow({ player_name: player.trim(), type: 'yellow_card' as const, minute: min }),
            eventRow({ player_name: player.trim(), type: 'red_card'    as const, minute: min }),
          ]
        : [eventRow({ player_name: player.trim(), type: actionType, minute: min })]

      if (isSecondYellow) toast.info(`2-я жёлтая → автоматическая красная для ${player.trim()}`)

      const tempIds = rows.map((_, i) => `temp_c_${Date.now() + i}`)
      setEvents(prev => [
        ...prev,
        ...rows.map((r, i) => ({ id: tempIds[i], ...r, created_at: new Date().toISOString() } as MatchEvent)),
      ])

      const { data, error } = await supabase.from('match_events').insert(rows).select()
      if (error) {
        setEvents(prev => prev.filter(e => !tempIds.includes(e.id)))
        toast.error(error.message)
      } else {
        feedback.card()
        // One-time hint: share the scoreboard (shown only on first event ever)
        const HINT_KEY = 'live-share-hint-shown'
        if (!localStorage.getItem(HINT_KEY)) {
          localStorage.setItem(HINT_KEY, '1')
          const shareUrl = `${APP_URL}/t/${tournament.id}`
          toast.info('Поделитесь табло — участники смогут следить в реальном времени', {
            action: {
              label: 'Поделиться',
              onClick: async () => {
                if (navigator.share) {
                  try { await navigator.share({ title: tournament.name, url: shareUrl }) } catch {}
                } else {
                  await navigator.clipboard.writeText(shareUrl)
                  toast.success('Ссылка скопирована!')
                }
              },
            },
            duration: 10000,
          })
        }
      }
      if (data) {
        setEvents(prev => {
          const result = [...prev]
          tempIds.forEach((tid, i) => {
            const idx = result.findIndex(e => e.id === tid)
            if (idx !== -1 && data[i]) result[idx] = data[i] as MatchEvent
          })
          return result
        })
      }
    }

    setShowForm(false)
    setPlayer('')
    setAssister('')
    setMinute('')
    setSubmitting(false)
  }

  // ── Remove event ──────────────────────────────────────────────────────────
  async function handleRemoveEvent(event: MatchEvent) {
    if (!game) return
    if (event.type === 'goal' || event.type === 'own_goal') {
      const patch: Partial<LiveGame> = event.type === 'goal'
        ? (event.team_id === game.home_team_id
            ? { home_score: Math.max(0, game.home_score - 1) }
            : { away_score: Math.max(0, game.away_score - 1) })
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
      const fid = game.fixture_id ?? defaultFixtureId
      if (fid) {
        const { data } = await supabase.from('match_events').select('*').eq('fixture_id', fid)
        if (data) setEvents(data as MatchEvent[])
      }
    }
  }

  // ── Finish ────────────────────────────────────────────────────────────────
  async function handleFinish() {
    if (!game) return
    setFinishing(true)
    const result = await finishLiveMatch(tournament.id)
    setFinishing(false)
    if (result?.error) { toast.error(result.error); return }
    feedback.finish()
    setShowFinishConfirm(false)
    setIsFinished(true)
  }

  // ── Player autocomplete: fetch from league_teams by team name ─────────────
  const homeTeam = teams.find(t => t.id === (game?.home_team_id ?? homeId))
  const awayTeam = teams.find(t => t.id === (game?.away_team_id ?? awayId))

  useEffect(() => {
    const currentTeam = side === 'home' ? homeTeam : awayTeam
    if (!currentTeam?.name) { setPlayerSuggestions([]); return }
    let cancelled = false
    supabase
      .from('league_teams')
      .select('players(name)')
      .ilike('name', currentTeam.name)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        const players = (data as any)?.players ?? []
        setPlayerSuggestions(players.map((p: { name: string }) => p.name))
      })
    return () => { cancelled = true }
  }, [side, homeTeam?.name, awayTeam?.name]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ───────────────────────────────────────────────────────────────
  const homeEvents  = events.filter(e => e.team_id === game?.home_team_id)
  const awayEvents  = events.filter(e => e.team_id === game?.away_team_id)
  const homeStrip   = homeEvents.filter(e => e.type !== 'assist').sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999))
  const awayStrip   = awayEvents.filter(e => e.type !== 'assist').sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999))
  const homeAssists = homeEvents.filter(e => e.type === 'assist')
  const awayAssists = awayEvents.filter(e => e.type === 'assist')

  // Pair goals with their assists for inline display
  const homePaired = pairWithAssists(homeStrip, homeAssists)
  const awayPaired = pairWithAssists(awayStrip, awayAssists)

  const hasEvents  = events.length > 0
  const hasFixture = !!(game?.fixture_id ?? game?.playoff_match_id ?? defaultFixtureId ?? defaultPlayoffMatchId)

  // Period/round tabs. Combat shows N rounds; ball sports show halves/quarters + OT.
  const activePeriods = isCombat
    ? Array.from({ length: tournament.match_periods ?? 3 }, (_, i) => ({ value: String(i + 1), label: `Раунд ${i + 1}` }))
    : PERIODS.filter(p => {
        if (p.value === 'ot') return tournament.extra_time ?? false
        return parseInt(p.value) <= (tournament.match_periods ?? 2)
      })
  const currentPeriodLabel = activePeriods.find(p => p.value === game?.period)?.label ?? ''

  // Combat count-down: seconds remaining in the current round.
  const remainingSecs = Math.max(0, timeLimitSecs - displaySecs)
  const timerText = isCombat ? formatTime(remainingSecs) : formatTime(displaySecs)
  const timerDanger = isCombat && !!game?.timer_running && remainingSecs <= 10

  // Current timer minute for auto-minute placeholder
  const currentMinute = Math.floor(displaySecs / 60)

  // ── Finished screen ───────────────────────────────────────────────────────

  if (isFinished) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-sm w-full">
          <CheckCircle2 size={56} className="text-emerald-400 mx-auto" />
          <div>
            <p className="text-white font-black text-2xl mb-1">{isCombat ? 'Бой завершён' : 'Матч завершён'}</p>
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
            onClick={() => {
              if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current)
              if (window.opener && !window.opener.closed) {
                window.opener.location.reload()
                window.close()
              } else {
                router.push(`/dashboard/tournament/${tournament.id}`)
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-700 px-8"
          >
            {closingIn !== null ? `Закрываем через ${closingIn}…` : 'Вернуться к турниру'}
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
            {(['home', 'away'] as const).map(s => (
              <div key={s}>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1.5">
                  {s === 'home' ? 'Хозяева' : 'Гости'}
                </p>
                <select
                  value={s === 'home' ? homeId : awayId}
                  onChange={e => s === 'home' ? setHomeId(e.target.value) : setAwayId(e.target.value)}
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

  // Sport-coloured accents: --lb (primary) / --lbd (dark) drive all accent classes below
  const sportTheme = getSportTheme(tournament.sport)
  const themeVars = { ['--lb' as string]: sportTheme.primary, ['--lbd' as string]: sportTheme.primaryDark } as React.CSSProperties

  const submitLabel = submitting
    ? 'Сохраняем…'
    : actionType === 'goal'
      ? (isOwnGoal ? '↩ Авто-гол' : 'Гол')
      : actionType === 'yellow_card' ? 'Жёлтая' : 'Красная'

  const submitClass = actionType === 'goal' && isOwnGoal
    ? 'bg-red-900/70 hover:bg-red-900 text-red-200'
    : actionType === 'goal'
      ? 'bg-[var(--lbd)] hover:bg-[var(--lb)] text-white'
      : actionType === 'yellow_card'
        ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
        : 'bg-red-600 hover:bg-red-500 text-white'

  return (
    <div className={boardWrap} style={themeVars}>

      {/* ── Top bar: period tabs + fullscreen ───────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-gray-800 shrink-0">
        <div className="flex gap-1">
          {activePeriods.map(p => (
            <button
              key={p.value}
              onClick={() => isOwner && handlePeriod(p.value)}
              disabled={!isOwner}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                game.period === p.value
                  ? 'bg-[var(--lb)] text-white'
                  : 'bg-gray-800 text-gray-500 ' + (isOwner ? 'hover:bg-gray-700' : 'cursor-default')
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

      {/* ── Time-up banner ──────────────────────────────────────────────── */}
      {isTimeUp && isOwner && !showFinishConfirm && (
        <div className="shrink-0 mx-4 mt-2">
          <div className="bg-amber-900/40 border border-amber-600/50 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-400 shrink-0" />
              <p className="text-amber-300 text-xs font-bold">
                {isCombat
                  ? `Раунд окончен (${tournament.match_duration_mins ?? 5} мин)`
                  : `Время вышло (${tournament.match_periods ?? 2}×${tournament.match_duration_mins ?? 45} мин)`}
              </p>
            </div>
            <button
              onClick={() => setShowFinishConfirm(true)}
              className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded-lg transition-colors shrink-0"
            >
              Завершить
            </button>
          </div>
        </div>
      )}

      {/* ── Scoreboard ──────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pt-5 pb-4">

        {/* Teams + Score row */}
        <div className="flex items-center">

          {/* Home team */}
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <TeamAvatar
              name={homeTeam?.name ?? ''}
              logoUrl={homeTeam?.logo_url}
              size={fullscreen ? 96 : 68}
            />
            <p className="text-white font-black text-sm text-center leading-tight line-clamp-2 max-w-[96px]">
              {homeTeam?.name}
            </p>
          </div>

          {/* Score */}
          <div className="flex items-center gap-1 px-2 shrink-0">
            <span className={`font-black text-white font-mono tabular-nums leading-none select-none ${
              fullscreen ? 'text-[9rem]' : 'text-[5.5rem] sm:text-[7rem]'
            }`}>
              {game.home_score}
            </span>
            <span className={`font-black text-gray-700 font-mono select-none leading-none ${
              fullscreen ? 'text-6xl' : 'text-4xl sm:text-5xl'
            }`}>
              :
            </span>
            <span className={`font-black text-white font-mono tabular-nums leading-none select-none ${
              fullscreen ? 'text-[9rem]' : 'text-[5.5rem] sm:text-[7rem]'
            }`}>
              {game.away_score}
            </span>
          </div>

          {/* Away team */}
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <TeamAvatar
              name={awayTeam?.name ?? ''}
              logoUrl={awayTeam?.logo_url}
              size={fullscreen ? 96 : 68}
            />
            <p className="text-white font-black text-sm text-center leading-tight line-clamp-2 max-w-[96px]">
              {awayTeam?.name}
            </p>
          </div>
        </div>

        {/* Combat: manual +/- scoring per fighter (no goal events) */}
        {isCombat && isOwner && (
          <div className="flex items-stretch justify-center gap-10 mt-3">
            {(['home', 'away'] as const).map(sk => (
              <div key={sk} className="flex items-center gap-2">
                <button onClick={() => bumpScore(sk, -1)}
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 flex items-center justify-center transition-colors">
                  <Minus size={14} />
                </button>
                <button onClick={() => bumpScore(sk, 1)}
                  className="w-8 h-8 rounded-full bg-[var(--lbd)] hover:bg-[var(--lb)] text-white flex items-center justify-center transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Timer + period + controls row */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <span className={`font-mono font-black tabular-nums ${
            timerDanger ? 'text-red-500 animate-pulse' : game.timer_running ? 'text-[var(--lb)]' : 'text-gray-600'
          } ${fullscreen ? 'text-3xl' : 'text-xl sm:text-2xl'}`}>
            {timerText}
          </span>
          <span className="text-gray-600 text-[11px] font-bold uppercase tracking-wider">
            {currentPeriodLabel}
          </span>
          {isOwner && (
            <div className="flex gap-2">
              <button
                onClick={handleTimerToggle}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  game.timer_running
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-[var(--lbd)] hover:bg-[var(--lb)] text-white'
                }`}
              >
                {game.timer_running ? <Pause size={15} /> : <Play size={15} />}
              </button>
              <button
                onClick={handleResetTimer}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Events strip — gets all remaining space, scrollable ──────────── */}
      <div className="flex-1 min-h-0 mx-4 mb-2 overflow-y-auto scrollbar-hide">
        {!isCombat && hasEvents && (
          <div className="bg-gray-900/70 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-gray-800">

              {/* Home */}
              <div className="p-3 space-y-2">
                {homePaired.map(({ evt: e, assist }) => (
                  <div key={e.id} className="flex items-start gap-2 group">
                    <span className="text-gray-600 font-mono text-xs w-7 shrink-0 pt-0.5">
                      {e.minute != null ? `${e.minute}'` : ''}
                    </span>
                    <span className="pt-0.5 shrink-0"><EventIcon type={e.type} size={13} sport={tournament.sport ?? undefined} /></span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate leading-tight ${e.type === 'own_goal' ? 'text-red-400' : 'text-gray-200'}`}>
                        {e.player_name}
                        {e.type === 'own_goal' && <span className="text-red-600 text-xs ml-1 font-normal">ОГ</span>}
                      </p>
                      {assist && (
                        <p className="text-gray-500 text-[11px] truncate leading-tight">↗ {assist.player_name}</p>
                      )}
                    </div>
                    {isOwner && (
                      <button onClick={() => handleRemoveEvent(e)}
                        className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-500 transition-opacity shrink-0 pt-0.5">
                        <X size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Away — mirrored */}
              <div className="p-3 space-y-2">
                {awayPaired.map(({ evt: e, assist }) => (
                  <div key={e.id} className="flex items-start gap-2 justify-end group">
                    {isOwner && (
                      <button onClick={() => handleRemoveEvent(e)}
                        className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-500 transition-opacity shrink-0 pt-0.5">
                        <X size={11} />
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate leading-tight text-right ${e.type === 'own_goal' ? 'text-red-400' : 'text-gray-200'}`}>
                        {e.type === 'own_goal' && <span className="text-red-600 text-xs mr-1 font-normal">ОГ</span>}
                        {e.player_name}
                      </p>
                      {assist && (
                        <p className="text-gray-500 text-[11px] truncate leading-tight text-right">{assist.player_name} ↗</p>
                      )}
                    </div>
                    <span className="pt-0.5 shrink-0"><EventIcon type={e.type} size={13} sport={tournament.sport ?? undefined} /></span>
                    <span className="text-gray-600 font-mono text-xs w-7 shrink-0 text-right pt-0.5">
                      {e.minute != null ? `${e.minute}'` : ''}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ── Bottom action bar ────────────────────────────────────────────── */}
      {isOwner && (
        <div className="shrink-0 px-4 pb-4 flex gap-2">
          {hasFixture && (() => {
            const matchStarted = game.accumulated_secs > 0 || game.timer_running
            // Combat has no goal/card events → skip the "Событие" button once started.
            if (matchStarted && isCombat) return null
            return matchStarted ? (
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 rounded-2xl bg-[var(--lbd)] hover:bg-[var(--lb)] active:bg-[var(--lbd)] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shrink-0"
              >
                <Plus size={16} />
                Событие
              </button>
            ) : (
              <button
                onClick={handleTimerToggle}
                className="flex-1 py-3 rounded-2xl bg-emerald-900/40 border border-emerald-800/60 text-emerald-500 text-sm font-semibold flex items-center justify-center gap-2 transition-colors hover:bg-emerald-800/40"
              >
                <Play size={15} />
                Начать
              </button>
            )
          })()}
          <button
            onClick={() => setShowFinishConfirm(true)}
            className="flex-1 py-3 rounded-2xl border border-gray-800 hover:border-red-900/60 hover:text-red-400 text-gray-600 text-sm font-bold transition-colors"
          >
            Завершить
          </button>
        </div>
      )}

      {/* ── Finish confirm modal ─────────────────────────────────────────── */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <p className="text-white font-black text-xl mb-1">{isCombat ? 'Завершить бой?' : 'Завершить матч?'}</p>
            <p className="text-gray-400 text-sm mb-6">
              Результат{' '}
              <span className="text-white font-bold">{game.home_score} : {game.away_score}</span>{' '}
              {isCombat ? 'будет сохранён в турнире.' : 'и все события будут сохранены в турнире.'}
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
                className="flex-1 py-2.5 rounded-xl bg-[var(--lb)] hover:bg-[var(--lbd)] text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {finishing ? 'Сохраняем…' : 'Завершить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add event bottom sheet ───────────────────────────────────────── */}
      {showForm && isOwner && hasFixture && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end"
          onClick={() => setShowForm(false)}
        >
          <div
            className="w-full bg-gray-950 border-t border-gray-800 rounded-t-3xl p-5 pb-10 space-y-3 max-w-lg mx-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-1" />

            {/* Team selector */}
            <div className="grid grid-cols-2 gap-2">
              {(['home', 'away'] as const).map(s => {
                const tm = s === 'home' ? homeTeam : awayTeam
                const active = side === s
                return (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                      active
                        ? 'border-[var(--lb)] bg-white/10 text-white'
                        : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <TeamAvatar name={tm?.name ?? ''} logoUrl={tm?.logo_url} size={22} />
                    <span className="text-sm font-bold truncate">{tm?.name ?? (s === 'home' ? 'Хозяева' : 'Гости')}</span>
                  </button>
                )
              })}
            </div>

            {/* Action type */}
            <div className="flex gap-2 justify-center">
              {([
                { value: 'goal',        label: 'Гол' },
                { value: 'yellow_card', label: 'ЖК' },
                { value: 'red_card',    label: 'КК' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setActionType(opt.value); if (opt.value !== 'goal') setIsOwnGoal(false) }}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                    actionType === opt.value
                      ? opt.value === 'goal'        ? 'bg-[var(--lbd)] text-white'
                      : opt.value === 'yellow_card' ? 'bg-yellow-500 text-black'
                      : 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Player inputs */}
            {playerSuggestions.length > 0 && (
              <datalist id="player-suggestions">
                {playerSuggestions.map(name => <option key={name} value={name} />)}
              </datalist>
            )}
            {actionType === 'goal' ? (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={player}
                  onChange={e => setPlayer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="Автор гола"
                  list={playerSuggestions.length > 0 ? 'player-suggestions' : undefined}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 h-10 text-sm"
                />
                <Input
                  value={assister}
                  onChange={e => setAssister(e.target.value)}
                  placeholder="Ассистент"
                  list={playerSuggestions.length > 0 ? 'player-suggestions' : undefined}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 h-10 text-sm"
                />
              </div>
            ) : (
              <Input
                value={player}
                onChange={e => setPlayer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="Игрок"
                list={playerSuggestions.length > 0 ? 'player-suggestions' : undefined}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 h-10 text-sm"
              />
            )}

            {/* Auto-minute display + own goal + submit */}
            <div className="flex items-center gap-2">
              {/* Auto-minute (read-only) */}
              <div className="h-10 px-3 rounded-xl bg-gray-800/60 border border-gray-700/60 flex items-center justify-center shrink-0">
                <span className="text-[var(--lb)] font-mono text-sm font-bold tabular-nums">
                  {currentMinute > 0 ? `${currentMinute}'` : '0\''}
                </span>
              </div>
              {actionType === 'goal' && (
                <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    checked={isOwnGoal}
                    onChange={e => setIsOwnGoal(e.target.checked)}
                    className="accent-red-500 w-3.5 h-3.5"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">↩ ОГ</span>
                </label>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting || !player.trim()}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 ${submitClass}`}
              >
                {submitLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
