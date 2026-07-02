'use client'

import { useState, useTransition } from 'react'
import { addPlayer, removePlayer } from '@/app/actions/leagues'
import { Plus, Trash2, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import type { LeagueTeam, Player } from '@/types'

type TeamWithPlayers = LeagueTeam & { players: Player[] }
type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: {
    positions: [
      { value: 'goalkeeper',  label: 'Вратарь' },
      { value: 'defender',    label: 'Защитник' },
      { value: 'midfielder',  label: 'Полузащитник' },
      { value: 'forward',     label: 'Нападающий' },
      { value: 'other',       label: 'Другое' },
    ],
    positionLabels: { goalkeeper: 'ВРТ', defender: 'ЗАЩ', midfielder: 'ПЗ', forward: 'НАП', other: '—' } as Record<string, string>,
    enterName: 'Введите имя',
    players: 'игроков',
    noPlayers: 'Нет игроков',
    namePlaceholder: 'Имя игрока',
    numberPlaceholder: '#',
    add: 'Добавить',
    cancel: 'Отмена',
    addPlayer: 'Добавить игрока',
    addTeamsFirst: (tabLabel: string) => `Сначала добавьте команды на вкладке «${tabLabel}».`,
  },
  kz: {
    positions: [
      { value: 'goalkeeper',  label: 'Қақпашы' },
      { value: 'defender',    label: 'Қорғаушы' },
      { value: 'midfielder',  label: 'Жартылай қорғаушы' },
      { value: 'forward',     label: 'Шабуылшы' },
      { value: 'other',       label: 'Басқа' },
    ],
    positionLabels: { goalkeeper: 'ҚҚП', defender: 'ҚРғ', midfielder: 'ЖҚ', forward: 'ШБ', other: '—' } as Record<string, string>,
    enterName: 'Атын енгізіңіз',
    players: 'ойыншы',
    noPlayers: 'Ойыншылар жоқ',
    namePlaceholder: 'Ойыншының аты',
    numberPlaceholder: '#',
    add: 'Қосу',
    cancel: 'Бас тарту',
    addPlayer: 'Ойыншы қосу',
    addTeamsFirst: (tabLabel: string) => `Алдымен «${tabLabel}» бөлімінде командаларды қосыңыз.`,
  },
  en: {
    positions: [
      { value: 'goalkeeper',  label: 'Goalkeeper' },
      { value: 'defender',    label: 'Defender' },
      { value: 'midfielder',  label: 'Midfielder' },
      { value: 'forward',     label: 'Forward' },
      { value: 'other',       label: 'Other' },
    ],
    positionLabels: { goalkeeper: 'GK', defender: 'DEF', midfielder: 'MID', forward: 'FWD', other: '—' } as Record<string, string>,
    enterName: 'Enter name',
    players: 'players',
    noPlayers: 'No players yet',
    namePlaceholder: 'Player name',
    numberPlaceholder: '#',
    add: 'Add',
    cancel: 'Cancel',
    addPlayer: 'Add player',
    addTeamsFirst: (tabLabel: string) => `Add teams in the "${tabLabel}" tab first.`,
  },
} as const

function TeamSquad({ leagueId, team, lang }: { leagueId: string; team: TeamWithPlayers; lang: Lang }) {
  const T_ = T[lang]
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [number, setNumber] = useState('')
  const [position, setPosition] = useState('other')
  const [error, setError] = useState('')

  function handleAdd() {
    if (!playerName.trim()) { setError(T_.enterName); return }
    setError('')
    startTransition(() => {
      void (async () => {
        const result = await addPlayer(team.id, leagueId, {
          name: playerName.trim(),
          number: number ? parseInt(number) : null,
          position,
        })
        if (result?.error) { setError(result.error); return }
        setAdding(false)
        setPlayerName('')
        setNumber('')
        setPosition('other')
      })()
    })
  }

  function handleRemove(playerId: string) {
    startTransition(() => { void removePlayer(playerId, leagueId) })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-xs font-black text-purple-600 shrink-0">
          {team.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 text-left">
          <p className="font-bold text-sm text-gray-900">{team.name}</p>
          <p className="text-xs text-gray-400">{team.players.length} {T_.players}</p>
        </div>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-2">
          {team.players.map(p => (
            <div key={p.id} className="flex items-center gap-2 py-1">
              {p.number != null && (
                <span className="w-6 text-xs font-black text-gray-400 text-right shrink-0">{p.number}</span>
              )}
              <span className="text-xs font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                {T_.positionLabels[p.position ?? 'other']}
              </span>
              <span className="flex-1 text-sm text-gray-900">{p.name}</span>
              <button
                onClick={() => handleRemove(p.id)}
                disabled={isPending}
                className="text-gray-300 hover:text-red-400 transition-colors p-0.5"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {team.players.length === 0 && !adding && (
            <p className="text-xs text-gray-400 py-1">{T_.noPlayers}</p>
          )}

          {adding ? (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder={T_.namePlaceholder}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 focus:border-purple-400 outline-none text-sm"
                />
                <input
                  value={number}
                  onChange={e => setNumber(e.target.value)}
                  placeholder={T_.numberPlaceholder}
                  type="number"
                  className="w-14 px-2 py-1.5 rounded-lg border border-gray-200 focus:border-purple-400 outline-none text-sm text-center"
                />
              </div>
              <select
                value={position}
                onChange={e => setPosition(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 focus:border-purple-400 outline-none text-sm bg-white"
              >
                {T_.positions.map(pos => (
                  <option key={pos.value} value={pos.value}>{pos.label}</option>
                ))}
              </select>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={isPending}
                  className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Check size={11} /> {T_.add}
                </button>
                <button
                  onClick={() => { setAdding(false); setError('') }}
                  className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-xs px-2 py-1.5 rounded-lg transition-colors"
                >
                  <X size={11} /> {T_.cancel}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-600 font-medium transition-colors pt-1"
            >
              <Plus size={11} /> {T_.addPlayer}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function SquadsTab({
  leagueId,
  teams,
  lang = 'ru',
  tabsLabel,
}: {
  leagueId: string
  teams: TeamWithPlayers[]
  lang?: Lang
  tabsLabel?: string
}) {
  const T_ = T[lang]
  const defaultTeamsLabel = lang === 'ru' ? 'Команды' : lang === 'kz' ? 'Командалар' : 'Teams'

  if (teams.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">
        {T_.addTeamsFirst(tabsLabel ?? defaultTeamsLabel)}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {teams.map(team => (
        <TeamSquad key={team.id} leagueId={leagueId} team={team} lang={lang} />
      ))}
    </div>
  )
}
