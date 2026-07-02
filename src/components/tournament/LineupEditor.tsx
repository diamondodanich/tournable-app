'use client'

import { useState, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Trash2, Check, Copy, Users, Loader2, Shirt } from 'lucide-react'
import { toast } from 'sonner'
import {
  getRoster, addTeamPlayer, removeTeamPlayer,
  getFixtureLineup, saveLineup, copyLastLineup,
} from '@/app/actions/lineups'
import type { TeamPlayer, Team } from '@/types'
import { tx, type Lang } from '@/lib/i18n'

type Role = 'starter' | 'sub' | null

const POS_ORDER: Record<string, number> = {
  goalkeeper: 0, defender: 1, midfielder: 2, forward: 3, other: 4,
}

// ── One team's column ─────────────────────────────────────────────────────────
function TeamColumn({
  team, fixtureId, tournamentId, accent, lang = 'ru',
}: {
  team: Team
  fixtureId: string
  tournamentId: string
  accent: string
  lang?: Lang
}) {
  const T = tx[lang]

  const POSITIONS = [
    { value: 'goalkeeper', label: T.posGK },
    { value: 'defender',   label: T.posDEF },
    { value: 'midfielder', label: T.posMID },
    { value: 'forward',    label: T.posFWD },
    { value: 'other',      label: T.posNone },
  ]
  const POS_LABEL: Record<string, string> = {
    goalkeeper: T.posGK, defender: T.posDEF, midfielder: T.posMID, forward: T.posFWD, other: T.posNone,
  }

  const [roster, setRoster] = useState<TeamPlayer[]>([])
  const [roles, setRoles] = useState<Record<string, Role>>({})
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [position, setPosition] = useState('other')

  // Load roster + existing lineup
  useEffect(() => {
    let active = true
    void (async () => {
      const [r, lineup] = await Promise.all([
        getRoster(team.id),
        getFixtureLineup(fixtureId),
      ])
      if (!active) return
      setRoster(r)
      const map: Record<string, Role> = {}
      lineup.filter(l => l.team_id === team.id).forEach(l => { map[l.player_id] = l.role })
      setRoles(map)
      setLoading(false)
    })()
    return () => { active = false }
  }, [team.id, fixtureId])

  const sortedRoster = [...roster].sort((a, b) =>
    (POS_ORDER[a.position] - POS_ORDER[b.position]) ||
    ((a.number ?? 999) - (b.number ?? 999))
  )

  const starters = sortedRoster.filter(p => roles[p.id] === 'starter')
  const subs     = sortedRoster.filter(p => roles[p.id] === 'sub')

  function cycleRole(id: string) {
    setRoles(prev => {
      const cur = prev[id] ?? null
      const next: Role = cur === null ? 'starter' : cur === 'starter' ? 'sub' : null
      return { ...prev, [id]: next }
    })
  }

  function handleAdd() {
    if (!name.trim()) { toast.error(T.enterNamePrompt); return }
    startTransition(() => {
      void (async () => {
        const res = await addTeamPlayer(team.id, tournamentId, {
          name: name.trim(),
          number: number ? parseInt(number) : null,
          position,
        })
        if (res.error) { toast.error(res.error); return }
        if (res.player) setRoster(prev => [...prev, res.player!])
        setName(''); setNumber(''); setPosition('other'); setAdding(false)
      })()
    })
  }

  function handleRemovePlayer(id: string) {
    startTransition(() => {
      void (async () => {
        const res = await removeTeamPlayer(id, tournamentId)
        if (res.error) { toast.error(res.error); return }
        setRoster(prev => prev.filter(p => p.id !== id))
        setRoles(prev => { const n = { ...prev }; delete n[id]; return n })
      })()
    })
  }

  function handleSave() {
    const entries = sortedRoster
      .filter(p => roles[p.id])
      .map((p, i) => ({ playerId: p.id, role: roles[p.id] as 'starter' | 'sub', slot: i }))
    startTransition(() => {
      void (async () => {
        const res = await saveLineup(fixtureId, team.id, tournamentId, entries)
        if (res.error) { toast.error(res.error); return }
        toast.success(T.lineupSaved(team.name))
      })()
    })
  }

  function handleCopyLast() {
    startTransition(() => {
      void (async () => {
        const res = await copyLastLineup(fixtureId, team.id, tournamentId)
        if (res.error) { toast.error(res.error); return }
        // reload lineup
        const lineup = await getFixtureLineup(fixtureId)
        const map: Record<string, Role> = {}
        lineup.filter(l => l.team_id === team.id).forEach(l => { map[l.player_id] = l.role })
        setRoles(map)
        toast.success(T.playersCopied(res.copied ?? 0))
      })()
    })
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Team header */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0" style={{ background: accent }}>
          {team.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 truncate">{team.name}</p>
          <p className="text-xs text-gray-400">{T.startersSubsCount(starters.length, subs.length)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-300">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '46vh' }}>
          {roster.length === 0 && !adding && (
            <p className="text-xs text-gray-400 text-center py-4">
              {T.noPlayersYet}
            </p>
          )}

          {/* Roster list — click jersey to cycle: none → старт → запас → none */}
          <div className="space-y-1">
            {sortedRoster.map(p => {
              const role = roles[p.id] ?? null
              return (
                <div key={p.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => cycleRole(p.id)}
                    title={T.cycleRoleTitle}
                    className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0 transition-all border ${
                      role === 'starter'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : role === 'sub'
                        ? 'bg-amber-100 border-amber-300 text-amber-700'
                        : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <Shirt className="w-3.5 h-3.5" />
                    <span className="text-[8px] font-black leading-none mt-0.5">
                      {role === 'starter' ? T.posStart : role === 'sub' ? T.posSub : T.posNone}
                    </span>
                  </button>
                  <span className="w-6 text-xs font-black text-gray-400 text-right shrink-0">
                    {p.number ?? ''}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0 w-9 text-center">
                    {POS_LABEL[p.position]}
                  </span>
                  <span className="flex-1 text-sm text-gray-900 truncate">{p.name}</span>
                  <button
                    onClick={() => handleRemovePlayer(p.id)}
                    disabled={isPending}
                    className="text-gray-200 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Add player */}
          {adding ? (
            <div className="space-y-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex gap-2">
                <input
                  autoFocus value={name} onChange={e => setName(e.target.value)}
                  placeholder={T.playerNamePh}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 outline-none text-sm focus:border-emerald-400"
                />
                <input
                  value={number} onChange={e => setNumber(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  placeholder="#" inputMode="numeric"
                  className="w-12 px-2 py-1.5 rounded-lg border border-gray-200 outline-none text-sm text-center focus:border-emerald-400"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={position} onChange={e => setPosition(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 outline-none text-sm bg-white focus:border-emerald-400"
                >
                  {POSITIONS.map(pos => <option key={pos.value} value={pos.value}>{pos.label}</option>)}
                </select>
                <button onClick={handleAdd} disabled={isPending}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 rounded-lg transition-colors">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setAdding(false); setName(''); setNumber('') }}
                  className="text-gray-400 hover:text-gray-600 px-2 rounded-lg transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)}
              className="flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-emerald-600 font-medium border border-dashed border-gray-200 hover:border-emerald-300 rounded-lg py-2 transition-colors">
              <Plus className="w-3.5 h-3.5" /> {T.addPlayerBtn}
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        <button onClick={handleCopyLast} disabled={isPending}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
          <Copy className="w-3.5 h-3.5" /> {T.lastLineupBtn}
        </button>
        <button onClick={handleSave} disabled={isPending}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          style={{ background: accent }}>
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {T.saveLineupBtn}
        </button>
      </div>
    </div>
  )
}

// ── Modal shell ───────────────────────────────────────────────────────────────
export default function LineupEditor({
  fixtureId, tournamentId, homeTeam, awayTeam, onClose, lang = 'ru',
}: {
  fixtureId: string
  tournamentId: string
  homeTeam: Team | null
  awayTeam: Team | null
  onClose: () => void
  lang?: Lang
}) {
  const T = tx[lang]
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 text-sm">{T.lineupsForMatchTitle}</h2>
              <p className="text-xs text-gray-400">{T.lineupsHint}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — two team columns */}
        <div className="flex flex-col sm:flex-row gap-5 p-5 overflow-y-auto">
          {homeTeam && (
            <TeamColumn team={homeTeam} fixtureId={fixtureId} tournamentId={tournamentId} accent="#059669" lang={lang} />
          )}
          <div className="hidden sm:block w-px bg-gray-100 shrink-0" />
          {awayTeam && (
            <TeamColumn team={awayTeam} fixtureId={fixtureId} tournamentId={tournamentId} accent="#7c3aed" lang={lang} />
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
