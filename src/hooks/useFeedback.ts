'use client'

import { useCallback } from 'react'

// ── Vibration ──────────────────────────────────────────────────────────────
function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(pattern) } catch { /* unsupported */ }
  }
}

// ── Web Audio ──────────────────────────────────────────────────────────────
let _ctx: AudioContext | null = null

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!_ctx || _ctx.state === 'closed') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _ctx = new (window.AudioContext ?? (window as any).webkitAudioContext)()
    }
    if (_ctx.state === 'suspended') _ctx.resume().catch(() => {})
    return _ctx
  } catch { return null }
}

function tone(
  freq: number,
  dur: number,
  delay = 0,
  type: OscillatorType = 'sine',
  vol = 0.22,
) {
  const c = ctx()
  if (!c) return
  const osc = c.createOscillator()
  const g   = c.createGain()
  osc.connect(g)
  g.connect(c.destination)
  osc.type = type
  osc.frequency.value = freq
  const t0 = c.currentTime + delay
  g.gain.setValueAtTime(0.001, t0)
  g.gain.linearRampToValueAtTime(vol, t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useFeedback() {

  /** Goal scored — triumphant two-note chime */
  const goal = useCallback(() => {
    vibrate([30, 20, 30, 20, 80])
    tone(880, 0.14, 0,    'sine', 0.28)
    tone(1100, 0.22, 0.15, 'sine', 0.28)
  }, [])

  /** Card (yellow/red) — short warning buzz */
  const card = useCallback(() => {
    vibrate([70])
    tone(300, 0.18, 0, 'square', 0.18)
  }, [])

  /** Match finished — ascending three-note fanfare */
  const finish = useCallback(() => {
    vibrate([120, 60, 120, 60, 200])
    tone(660,  0.12, 0,    'sine', 0.25)
    tone(880,  0.12, 0.14, 'sine', 0.25)
    tone(1100, 0.40, 0.28, 'sine', 0.25)
  }, [])

  /** Result saved — soft click */
  const save = useCallback(() => {
    vibrate([25])
    tone(620, 0.07, 0, 'sine', 0.13)
  }, [])

  /** Time up — three referee whistle blasts */
  const timeUp = useCallback(() => {
    vibrate([200, 80, 200, 80, 300])
    tone(880, 0.28, 0.0, 'sine', 0.30)
    tone(880, 0.28, 0.42, 'sine', 0.30)
    tone(880, 0.55, 0.84, 'sine', 0.30)
  }, [])

  /** Light tap — button press confirmation */
  const tap = useCallback(() => {
    vibrate([8])
    tone(700, 0.04, 0, 'sine', 0.09)
  }, [])

  return { goal, card, finish, save, timeUp, tap }
}
