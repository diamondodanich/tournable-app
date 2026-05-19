'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LiveGame, Team, Tournament } from '@/types'
import { Button } from '@/components/ui/button'
import { Maximize2, Minimize2, Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react'
import TeamAvatar from '@/components/tournament/TeamAvatar'
import { toast } from 'sonner'

const PERIODS = [
  { value: '1', label: '1-й тайм' },
  { value: '2', label: '2-й тайм' },
  { value: 'ot', label: 'Доп. время' },
]

function formatTime(secs: number) {
  const m = Math.floor(Math.abs(secs) / 60).toString().padStart(2, '0')
  const s = (Math.abs(secs) % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

interface Props {
  tournament: Tournament
  teams: Team[]
  initialGame: LiveGame | null
  isOwner: boolean
  defaultHomeId?: string
  defaultAwayId?: string
}

export default function LiveBoard({ tournament, teams, initialGame, isOwner, defaultHomeId, defaultAwayId }: Props) {
  const supabase = createClient()

  const [game, setGame] = useState<LiveGame | null>(initialGame)
  const [displaySecs, setDisplaySecs] = useState(initialGame?.accumulated_secs ?? 0)
  const [fullscreen, setFullscreen] = useState(false)
  const [homeId, setHomeId] = useState(defaultHomeId ?? teams[0]?.id ?? '')
  const [awayId, setAwayId] = useState(defaultAwayId ?? (teams[1]?.id ?? ''))
  const [initing, setIniting] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const gameRef = useRef<LiveGame | null>(initialGame)
  gameRef.current = game

  // Realtime subscription — viewers sync from DB, owner uses optimistic state
  useEffect(() => {
    const channel = supabase
      .channel(`live_${tournament.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'live_games',
        filter: `tournament_id=eq.${tournament.id}`,
      }, payload => {
        const g = payload.new as LiveGame
        if (!isOwner) {
          setGame(g)
          if (!g.timer_running) setDisplaySecs(g.accumulated_secs)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tournament.id, isOwner])

  // Local timer tick
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (game?.timer_running && game.started_at) {
      timerRef.current = setInterval(() => {
        const g = gameRef.current
        if (!g?.started_at) return
        const elapsed = Math.floor((Date.now() - new Date(g.started_at).getTime()) / 1000)
        setDisplaySecs(g.accumulated_secs + elapsed)
      }, 200)
    } else if (!game?.timer_running) {
      setDisplaySecs(game?.accumulated_secs ?? 0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [game?.timer_running, game?.accumulated_secs, game?.started_at])

  // Direct Supabase update — no server action round-trip
  const updateGame = useCallback(async (patch: Partial<LiveGame>) => {
    const { error } = await supabase
      .from('live_games')
      .update(patch)
      .eq('tournament_id', tournament.id)
    if (error) toast.error(error.message)
  }, [tournament.id])

  async function handleInit() {
    if (!homeId || !awayId || homeId === awayId) { toast.error('Выберите разные команды'); return }
    setIniting(true)
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
    }
    const { data, error } = await supabase
      .from('live_games')
      .upsert(newGame, { onConflict: 'tournament_id' })
      .select()
      .single()
    if (error) { toast.error(error.message); setIniting(false); return }
    setGame(data as LiveGame)
    setDisplaySecs(0)
    setIniting(false)
  }

  function handleTimerToggle() {
    if (!game) return
    if (game.timer_running) {
      const patch = { timer_running: false, accumulated_secs: displaySecs, started_at: null as string | null }
      setGame(prev => prev ? { ...prev, ...patch } : prev)
      updateGame(patch)
    } else {
      const now = new Date().toISOString()
      const patch = { timer_running: true, accumulated_secs: displaySecs, started_at: now }
      setGame(prev => prev ? { ...prev, ...patch } : prev)
      updateGame(patch)
    }
  }

  function handleResetTimer() {
    if (!game) return
    const patch = { timer_running: false, accumulated_secs: 0, started_at: null as string | null }
    setGame(prev => prev ? { ...prev, ...patch } : prev)
    setDisplaySecs(0)
    updateGame(patch)
  }

  function handleScore(side: 'home' | 'away', delta: number) {
    if (!game) return
    const patch = side === 'home'
      ? { home_score: Math.max(0, game.home_score + delta) }
      : { away_score: Math.max(0, game.away_score + delta) }
    setGame(prev => prev ? { ...prev, ...patch } : prev)
    updateGame(patch)
  }

  function handlePeriod(p: string) {
    if (!game) return
    setGame(prev => prev ? { ...prev, period: p } : prev)
    updateGame({ period: p })
  }

  const homeTeam = teams.find(t => t.id === game?.home_team_id)
  const awayTeam = teams.find(t => t.id === game?.away_team_id)
  const currentPeriod = PERIODS.find(p => p.value === game?.period)

  const boardClass = fullscreen
    ? 'fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center p-6 sm:p-10'
    : 'relative bg-gray-900 rounded-2xl flex flex-col items-center justify-center p-6 sm:p-10 min-h-[420px]'

  // ── No game yet ──
  if (!game) {
    if (!isOwner) {
      return (
        <div className={boardClass}>
          <p className="text-gray-400 text-lg">Матч ещё не начался</p>
        </div>
      )
    }
    return (
      <div className={boardClass}>
        <p className="text-white text-lg font-bold mb-6 text-center">Выберите команды для матча</p>
        <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full max-w-sm">
          {(['home', 'away'] as const).map(side => (
            <select
              key={side}
              value={side === 'home' ? homeId : awayId}
              onChange={e => side === 'home' ? setHomeId(e.target.value) : setAwayId(e.target.value)}
              className="flex-1 bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm border border-gray-700"
            >
              <option value="">{side === 'home' ? 'Хозяева' : 'Гости'}</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          ))}
        </div>
        <Button onClick={handleInit} disabled={initing} className="bg-emerald-600 hover:bg-emerald-700 px-8">
          {initing ? 'Запускаем…' : '▶ Начать матч'}
        </Button>
      </div>
    )
  }

  // ── Live board ──
  return (
    <div className={boardClass}>
      {/* Fullscreen toggle */}
      <button
        onClick={() => setFullscreen(f => !f)}
        className="absolute top-3 right-3 text-gray-600 hover:text-gray-300 transition-colors"
        title={fullscreen ? 'Выйти из полного экрана' : 'На весь экран'}
      >
        {fullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>

      {/* Period selector — owner only */}
      {isOwner && (
        <div className="flex gap-1.5 mb-5">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => handlePeriod(p.value)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                game.period === p.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Period label — viewers */}
      {!isOwner && currentPeriod && (
        <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-5">{currentPeriod.label}</p>
      )}

      {/* Main scoreboard */}
      <div className="flex items-center gap-6 sm:gap-10 mb-6 w-full max-w-lg justify-center">
        {/* Home team */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <TeamAvatar name={homeTeam?.name ?? ''} logoUrl={homeTeam?.logo_url} size={fullscreen ? 72 : 52} />
          <p className="text-white font-black text-sm sm:text-base text-center leading-tight">{homeTeam?.name}</p>
          {isOwner ? (
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => handleScore('home', -1)}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <Minus size={14} />
              </button>
              <span className={`font-black text-white font-mono text-center ${fullscreen ? 'text-8xl' : 'text-6xl'} w-16`}>
                {game.home_score}
              </span>
              <button onClick={() => handleScore('home', 1)}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <span className={`font-black text-white font-mono mt-1 ${fullscreen ? 'text-8xl' : 'text-6xl'}`}>
              {game.home_score}
            </span>
          )}
        </div>

        {/* Center: timer + controls */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <span className={`font-mono font-black ${game.timer_running ? 'text-emerald-400' : 'text-gray-400'} ${fullscreen ? 'text-4xl' : 'text-2xl'}`}>
            {formatTime(displaySecs)}
          </span>
          {isOwner && (
            <div className="flex gap-1.5">
              <button onClick={handleTimerToggle}
                className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition-colors">
                {game.timer_running ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button onClick={handleResetTimer}
                className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors">
                <RotateCcw size={14} />
              </button>
            </div>
          )}
          <span className="text-gray-700 text-xs font-bold uppercase tracking-widest">vs</span>
        </div>

        {/* Away team */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <TeamAvatar name={awayTeam?.name ?? ''} logoUrl={awayTeam?.logo_url} size={fullscreen ? 72 : 52} />
          <p className="text-white font-black text-sm sm:text-base text-center leading-tight">{awayTeam?.name}</p>
          {isOwner ? (
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => handleScore('away', -1)}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <Minus size={14} />
              </button>
              <span className={`font-black text-white font-mono text-center ${fullscreen ? 'text-8xl' : 'text-6xl'} w-16`}>
                {game.away_score}
              </span>
              <button onClick={() => handleScore('away', 1)}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <span className={`font-black text-white font-mono mt-1 ${fullscreen ? 'text-8xl' : 'text-6xl'}`}>
              {game.away_score}
            </span>
          )}
        </div>
      </div>

      {/* Tournament name + reset match */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-gray-600 text-xs uppercase tracking-widest">{tournament.name}</p>
        {isOwner && (
          <button
            onClick={handleInit}
            className="text-gray-700 hover:text-gray-400 text-xs underline underline-offset-2 transition-colors mt-1"
          >
            Новый матч
          </button>
        )}
      </div>
    </div>
  )
}
