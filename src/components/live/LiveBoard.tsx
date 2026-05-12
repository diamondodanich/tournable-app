'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tournament, Team, LiveGame } from '@/types'
import { initLiveGame, startTimer, stopTimer, resetTimer, updateLiveScore, setLivePeriod } from '@/app/actions/live'
import { Button } from '@/components/ui/button'
import { Maximize2, Minimize2, Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react'
import TeamAvatar from '@/components/tournament/TeamAvatar'
import { toast } from 'sonner'

const PERIODS = ['1st', '2nd', 'OT', 'PEN']

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

interface Props {
  tournament: Tournament
  teams: Team[]
  initialGame: LiveGame | null
  isOwner: boolean
}

export default function LiveBoard({ tournament, teams, initialGame, isOwner }: Props) {
  const [game, setGame] = useState<LiveGame | null>(initialGame)
  const [displaySecs, setDisplaySecs] = useState(initialGame?.accumulated_secs ?? 0)
  const [fullscreen, setFullscreen] = useState(false)
  const [homeId, setHomeId] = useState(teams[0]?.id ?? '')
  const [awayId, setAwayId] = useState(teams[1]?.id ?? '')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`live_${tournament.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_games',
        filter: `tournament_id=eq.${tournament.id}`,
      }, payload => {
        const g = payload.new as LiveGame
        setGame(g)
        if (!g.timer_running) setDisplaySecs(g.accumulated_secs)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tournament.id])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (game?.timer_running && game.started_at) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(game.started_at!).getTime()) / 1000)
        setDisplaySecs(game.accumulated_secs + elapsed)
      }, 500)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [game?.timer_running, game?.accumulated_secs, game?.started_at])

  async function handleInit() {
    if (!homeId || !awayId || homeId === awayId) { toast.error('Выберите разные команды'); return }
    await initLiveGame(tournament.id, homeId, awayId)
  }

  async function handleTimerToggle() {
    if (!game) return
    if (game.timer_running) {
      await stopTimer(tournament.id, displaySecs)
    } else {
      await startTimer(tournament.id, displaySecs)
    }
  }

  async function handleResetTimer() {
    if (!game) return
    await resetTimer(tournament.id)
    setDisplaySecs(0)
  }

  async function handleScore(side: 'home' | 'away', delta: number) {
    if (!game) return
    const next = { home: game.home_score, away: game.away_score }
    if (side === 'home') next.home = Math.max(0, next.home + delta)
    else next.away = Math.max(0, next.away + delta)
    await updateLiveScore(tournament.id, next.home, next.away)
  }

  async function handlePeriod(p: string) {
    if (!game) return
    await setLivePeriod(tournament.id, p)
  }

  const homeTeam = teams.find(t => t.id === game?.home_team_id)
  const awayTeam = teams.find(t => t.id === game?.away_team_id)

  const boardClass = fullscreen
    ? 'fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center p-8'
    : 'bg-gray-900 rounded-2xl flex flex-col items-center justify-center p-8 min-h-[400px]'

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
        <p className="text-white text-lg font-bold mb-6">Выберите команды для матча</p>
        <div className="flex gap-4 mb-6">
          {['home', 'away'].map(side => (
            <select
              key={side}
              value={side === 'home' ? homeId : awayId}
              onChange={e => side === 'home' ? setHomeId(e.target.value) : setAwayId(e.target.value)}
              className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700"
            >
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          ))}
        </div>
        <Button onClick={handleInit} className="bg-emerald-600 hover:bg-emerald-700">
          Начать матч
        </Button>
      </div>
    )
  }

  return (
    <div className={boardClass}>
      {/* Fullscreen toggle */}
      <button
        onClick={() => setFullscreen(f => !f)}
        className="absolute top-4 right-4 text-gray-500 hover:text-white"
      >
        {fullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>

      {/* Period */}
      <div className="flex gap-1 mb-6">
        {PERIODS.map(p => (
          <button
            key={p}
            onClick={() => isOwner && handlePeriod(p)}
            disabled={!isOwner}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              game.period === p ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-center w-full max-w-lg mb-8">
        {/* Home */}
        <div className="flex flex-col items-center gap-2">
          <TeamAvatar name={homeTeam?.name ?? ''} logoUrl={homeTeam?.logo_url} size={56} />
          <p className="text-white font-black text-base text-center">{homeTeam?.name}</p>
          {isOwner && (
            <div className="flex items-center gap-2">
              <button onClick={() => handleScore('home', -1)} className="text-gray-500 hover:text-white"><Minus size={16} /></button>
              <span className="text-6xl font-black text-white font-mono w-16 text-center">{game.home_score}</span>
              <button onClick={() => handleScore('home', 1)} className="text-gray-500 hover:text-white"><Plus size={16} /></button>
            </div>
          )}
          {!isOwner && <span className="text-6xl font-black text-white font-mono">{game.home_score}</span>}
        </div>

        {/* Timer */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-3xl font-mono font-black text-emerald-400">{formatTime(displaySecs)}</span>
          {isOwner && (
            <div className="flex gap-2">
              <button onClick={handleTimerToggle} className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white">
                {game.timer_running ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button onClick={handleResetTimer} className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400">
                <RotateCcw size={14} />
              </button>
            </div>
          )}
          <span className="text-gray-600 text-xs font-bold uppercase tracking-wide">vs</span>
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-2">
          <TeamAvatar name={awayTeam?.name ?? ''} logoUrl={awayTeam?.logo_url} size={56} />
          <p className="text-white font-black text-base text-center">{awayTeam?.name}</p>
          {isOwner && (
            <div className="flex items-center gap-2">
              <button onClick={() => handleScore('away', -1)} className="text-gray-500 hover:text-white"><Minus size={16} /></button>
              <span className="text-6xl font-black text-white font-mono w-16 text-center">{game.away_score}</span>
              <button onClick={() => handleScore('away', 1)} className="text-gray-500 hover:text-white"><Plus size={16} /></button>
            </div>
          )}
          {!isOwner && <span className="text-6xl font-black text-white font-mono">{game.away_score}</span>}
        </div>
      </div>

      <p className="text-gray-600 text-xs uppercase tracking-widest">{tournament.name}</p>
    </div>
  )
}
