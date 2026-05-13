'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LiveGame, Team, Tournament } from '@/types'
import TeamAvatar from '@/components/tournament/TeamAvatar'
import { Maximize2, Minimize2, Play, Square, RotateCcw, Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'

const PERIOD_LABELS: Record<string, string> = {
  first: '1-й тайм',
  second: '2-й тайм',
  extra: 'Доп. время',
  penalties: 'Пенальти',
}

function calcSeconds(game: LiveGame): number {
  if (!game.is_running || !game.started_at) return game.accumulated_secs
  return game.accumulated_secs + Math.floor((Date.now() - new Date(game.started_at).getTime()) / 1000)
}

function fmt(secs: number): string {
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
  // Memoize supabase client — do NOT recreate on every render
  const supabase = useMemo(() => createClient(), [])

  const [game, setGame] = useState<LiveGame | null>(initialGame)
  const [secs, setSecs] = useState(initialGame ? calcSeconds(initialGame) : 0)
  const [fullscreen, setFullscreen] = useState(false)
  const [selectingTeams, setSelectingTeams] = useState(!initialGame && isOwner)
  const [selectedHome, setSelectedHome] = useState<string>(
    defaultHomeId ?? teams[0]?.id ?? ''
  )
  const [selectedAway, setSelectedAway] = useState<string>(
    defaultAwayId ?? (teams[1]?.id ?? '')
  )
  const [saving, setSaving] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Store game in ref to avoid stale closure in interval
  const gameRef = useRef<LiveGame | null>(initialGame)
  gameRef.current = game

  // ── Direct DB write helper (no server action round-trip → no lag) ──
  const patch = useCallback(async (update: Partial<LiveGame>) => {
    const { error } = await supabase
      .from('live_games')
      .update(update)
      .eq('tournament_id', tournament.id)
    if (error) toast.error(error.message)
  }, [supabase, tournament.id])

  // ── Realtime subscription ──
  useEffect(() => {
    const channel = supabase
      .channel(`live:${tournament.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'live_games',
        filter: `tournament_id=eq.${tournament.id}`,
      }, payload => {
        const next = payload.new as LiveGame
        // Viewers always sync; owner already applied optimistic update
        if (!isOwner) {
          setGame(next)
          setSecs(calcSeconds(next))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, tournament.id, isOwner])

  // ── Local timer tick ──
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (game?.is_running) {
      timerRef.current = setInterval(() => {
        const g = gameRef.current
        if (g) setSecs(calcSeconds(g))
      }, 200)
    } else {
      setSecs(game?.accumulated_secs ?? 0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [game?.is_running, game?.accumulated_secs, game?.started_at])

  // ── Actions ──
  async function handleInit() {
    if (!selectedHome || !selectedAway || selectedHome === selectedAway) {
      toast.error('Выберите разные команды')
      return
    }
    setSaving(true)
    const init = {
      tournament_id: tournament.id,
      home_team_id: selectedHome,
      away_team_id: selectedAway,
      home_score: 0,
      away_score: 0,
      accumulated_secs: 0,
      started_at: null as string | null,
      is_running: false,
      period: 'first',
    }
    const { data, error } = await supabase
      .from('live_games')
      .upsert(init, { onConflict: 'tournament_id' })
      .select()
      .single()
    if (error) { toast.error(error.message); setSaving(false); return }
    setGame(data as LiveGame)
    setSecs(0)
    setSelectingTeams(false)
    setSaving(false)
  }

  function handleTimerToggle() {
    if (!game) return
    if (game.is_running) {
      const update = { is_running: false, accumulated_secs: secs, started_at: null as string | null }
      setGame(prev => prev ? { ...prev, ...update } : prev)
      patch(update)
    } else {
      const now = new Date().toISOString()
      const update = { is_running: true, started_at: now, accumulated_secs: secs }
      setGame(prev => prev ? { ...prev, ...update } : prev)
      patch(update)
    }
  }

  function handleReset() {
    if (!game) return
    const update = { is_running: false, accumulated_secs: 0, started_at: null as string | null }
    setGame(prev => prev ? { ...prev, ...update } : prev)
    setSecs(0)
    patch(update)
  }

  function handleScore(side: 'home' | 'away', delta: number) {
    if (!game) return
    const next = side === 'home'
      ? { home_score: Math.max(0, game.home_score + delta) }
      : { away_score: Math.max(0, game.away_score + delta) }
    setGame(prev => prev ? { ...prev, ...next } : prev)
    patch(next)
  }

  function handlePeriod(period: string) {
    if (!game) return
    setGame(prev => prev ? { ...prev, period: period as LiveGame['period'] } : prev)
    patch({ period: period as LiveGame['period'] })
  }

  const homeTeam = teams.find(t => t.id === game?.home_team_id)
  const awayTeam = teams.find(t => t.id === game?.away_team_id)

  // ── Team selection screen ──
  if (selectingTeams) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full space-y-6">
          <h2 className="text-white font-bold text-xl text-center">Выберите команды</h2>
          <div className="space-y-4">
            {(['home', 'away'] as const).map(side => (
              <div key={side}>
                <label className="text-gray-400 text-sm mb-1 block">
                  {side === 'home' ? 'Хозяева' : 'Гости'}
                </label>
                <select
                  value={side === 'home' ? selectedHome : selectedAway}
                  onChange={e => side === 'home' ? setSelectedHome(e.target.value) : setSelectedAway(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-xl px-4 py-2.5 border border-gray-600"
                >
                  <option value="">{side === 'home' ? 'Хозяева' : 'Гости'}</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button
            onClick={handleInit}
            disabled={saving || !selectedHome || !selectedAway || selectedHome === selectedAway}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? 'Загружаем…' : '▶ Начать матч'}
          </button>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Матч ещё не начался</p>
      </div>
    )
  }

  const boardClass = fullscreen
    ? 'fixed inset-0 z-50 bg-gray-900 flex flex-col'
    : 'min-h-screen bg-gray-900 flex flex-col'

  return (
    <div className={boardClass}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
        <span className="text-gray-500 text-sm font-semibold uppercase tracking-widest truncate max-w-[50%]">
          {tournament.name}
        </span>
        <div className="flex items-center gap-3 shrink-0">
          {isOwner && (
            <select
              value={game.period}
              onChange={e => handlePeriod(e.target.value)}
              className="bg-gray-800 text-gray-300 text-xs rounded-lg px-2 py-1 border border-gray-700"
            >
              {Object.entries(PERIOD_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => setFullscreen(f => !f)}
            className="text-gray-500 hover:text-white transition-colors"
          >
            {fullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>

      {/* Period label */}
      <p className="text-center text-gray-500 text-xs uppercase tracking-widest mb-2">
        {PERIOD_LABELS[game.period]}
      </p>

      {/* Timer */}
      <div className="text-center mb-6">
        <span className={`font-mono font-black tabular-nums ${fullscreen ? 'text-8xl' : 'text-6xl'} ${game.is_running ? 'text-emerald-400' : 'text-white'}`}>
          {fmt(secs)}
        </span>
      </div>

      {/* Scoreboard */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className={`w-full max-w-3xl grid grid-cols-[1fr_auto_1fr] items-center ${fullscreen ? 'gap-8' : 'gap-4'}`}>
          {/* Home */}
          <div className="flex flex-col items-center gap-3">
            <TeamAvatar name={homeTeam?.name ?? ''} logoUrl={homeTeam?.logo_url ?? null} size={fullscreen ? 80 : 56} />
            <span className={`font-black text-white text-center leading-tight ${fullscreen ? 'text-2xl' : 'text-lg'}`}>
              {homeTeam?.name}
            </span>
            {isOwner && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleScore('home', -1)}
                  disabled={game.home_score <= 0}
                  className="w-9 h-9 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center disabled:opacity-40 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <button
                  onClick={() => handleScore('home', 1)}
                  className="w-9 h-9 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white flex items-center justify-center transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Score */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`font-black tabular-nums text-white ${fullscreen ? 'text-[110px] leading-none' : 'text-7xl'}`}>
              {game.home_score}
            </span>
            <span className={`font-black text-gray-600 ${fullscreen ? 'text-5xl' : 'text-3xl'}`}>:</span>
            <span className={`font-black tabular-nums text-white ${fullscreen ? 'text-[110px] leading-none' : 'text-7xl'}`}>
              {game.away_score}
            </span>
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-3">
            <TeamAvatar name={awayTeam?.name ?? ''} logoUrl={awayTeam?.logo_url ?? null} size={fullscreen ? 80 : 56} />
            <span className={`font-black text-white text-center leading-tight ${fullscreen ? 'text-2xl' : 'text-lg'}`}>
              {awayTeam?.name}
            </span>
            {isOwner && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleScore('away', -1)}
                  disabled={game.away_score <= 0}
                  className="w-9 h-9 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center disabled:opacity-40 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <button
                  onClick={() => handleScore('away', 1)}
                  className="w-9 h-9 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white flex items-center justify-center transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timer controls */}
      {isOwner && (
        <div className="flex justify-center gap-3 py-8 shrink-0 flex-wrap">
          <button
            onClick={handleTimerToggle}
            className={`flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-colors ${
              game.is_running
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {game.is_running ? <><Square size={16} /> Стоп</> : <><Play size={16} /> Старт</>}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
          >
            <RotateCcw size={16} /> Сброс
          </button>
          <button
            onClick={() => setSelectingTeams(true)}
            className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 font-semibold rounded-xl transition-colors text-sm"
          >
            Новый матч
          </button>
        </div>
      )}
    </div>
  )
}
