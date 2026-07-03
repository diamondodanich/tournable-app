'use client'

import { useState, useTransition } from 'react'
import { addLeagueTeam, removeLeagueTeam, addPlayer, removePlayer } from '@/app/actions/leagues'
import { Plus, Trash2, MapPin, Check, X, ChevronDown, ChevronUp, Users } from 'lucide-react'
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
    enterTeamName: 'Введите название команды',
    enterName: 'Введите имя',
    confirmRemoveTeam: (name: string) => `Удалить команду "${name}"? Игроки команды тоже удалятся.`,
    noTeams: 'Пока нет команд. Добавьте первую — она перейдёт во все сезоны чемпионата.',
    teamNamePlaceholder: 'Название команды',
    cityPlaceholder: 'Город (необязательно)',
    players: 'игроков',
    noPlayers: 'Состав пуст',
    namePlaceholder: 'Имя игрока',
    numberPlaceholder: '#',
    add: 'Добавить',
    cancel: 'Отмена',
    addTeam: 'Добавить команду',
    addPlayer: 'Добавить игрока',
    squad: 'Состав',
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
    enterTeamName: 'Команда атауын енгізіңіз',
    enterName: 'Атын енгізіңіз',
    confirmRemoveTeam: (name: string) => `"${name}" командасын жою керек пе? Команданың ойыншылары да жойылады.`,
    noTeams: 'Әзірге командалар жоқ. Біріншісін қосыңыз — ол барлық маусымдарға өтеді.',
    teamNamePlaceholder: 'Команда атауы',
    cityPlaceholder: 'Қала (міндетті емес)',
    players: 'ойыншы',
    noPlayers: 'Құрам бос',
    namePlaceholder: 'Ойыншының аты',
    numberPlaceholder: '#',
    add: 'Қосу',
    cancel: 'Бас тарту',
    addTeam: 'Команда қосу',
    addPlayer: 'Ойыншы қосу',
    squad: 'Құрам',
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
    enterTeamName: 'Enter team name',
    enterName: 'Enter name',
    confirmRemoveTeam: (name: string) => `Remove team "${name}"? Its players will be deleted too.`,
    noTeams: 'No teams yet. Add the first — it will carry into every season.',
    teamNamePlaceholder: 'Team name',
    cityPlaceholder: 'City (optional)',
    players: 'players',
    noPlayers: 'Squad is empty',
    namePlaceholder: 'Player name',
    numberPlaceholder: '#',
    add: 'Add',
    cancel: 'Cancel',
    addTeam: 'Add team',
    addPlayer: 'Add player',
    squad: 'Squad',
  },
} as const

function TeamCard({ leagueId, team, lang, onRemoveTeam }: {
  leagueId: string
  team: TeamWithPlayers
  lang: Lang
  onRemoveTeam: (id: string, name: string) => void
}) {
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
        setAdding(false); setPlayerName(''); setNumber(''); setPosition('other')
      })()
    })
  }

  function handleRemovePlayer(playerId: string) {
    startTransition(() => { void removePlayer(playerId, leagueId) })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-black text-white shrink-0">
            {team.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gray-900 truncate">{team.name}</p>
            <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
              {team.city && (<><MapPin size={10} /> {team.city} ·</>)}
              <Users size={10} /> {team.players.length} {T_.players}
            </p>
          </div>
          {open ? <ChevronUp size={15} className="text-gray-400 shrink-0" /> : <ChevronDown size={15} className="text-gray-400 shrink-0" />}
        </button>
        <button
          onClick={() => onRemoveTeam(team.id, team.name)}
          className="text-gray-300 hover:text-red-400 transition-colors p-1 shrink-0"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-1.5 bg-gray-50/50">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{T_.squad}</p>
          {team.players
            .slice()
            .sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
            .map(p => (
              <div key={p.id} className="flex items-center gap-2 py-1">
                <span className="w-6 text-xs font-black text-gray-400 text-right shrink-0">{p.number ?? ''}</span>
                <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded shrink-0">
                  {T_.positionLabels[p.position ?? 'other']}
                </span>
                <span className="flex-1 text-sm text-gray-900 truncate">{p.name}</span>
                <button
                  onClick={() => handleRemovePlayer(p.id)}
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
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 focus:border-violet-400 outline-none text-sm"
                />
                <input
                  value={number}
                  onChange={e => setNumber(e.target.value)}
                  placeholder={T_.numberPlaceholder}
                  type="number"
                  className="w-14 px-2 py-1.5 rounded-lg border border-gray-200 focus:border-violet-400 outline-none text-sm text-center"
                />
              </div>
              <select
                value={position}
                onChange={e => setPosition(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 focus:border-violet-400 outline-none text-sm bg-white"
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
                  className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
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
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600 font-medium transition-colors pt-1"
            >
              <Plus size={11} /> {T_.addPlayer}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function TeamsSquadsTab({ leagueId, teams, lang = 'ru' }: {
  leagueId: string
  teams: TeamWithPlayers[]
  lang?: Lang
}) {
  const T_ = T[lang]
  const [isPending, startTransition] = useTransition()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState('')

  function handleAddTeam() {
    if (!name.trim()) { setError(T_.enterTeamName); return }
    setError('')
    startTransition(() => {
      void (async () => {
        const result = await addLeagueTeam(leagueId, name.trim(), city.trim() || undefined)
        if (result?.error) { setError(result.error); return }
        setAdding(false); setName(''); setCity('')
      })()
    })
  }

  function handleRemoveTeam(teamId: string, teamName: string) {
    if (!confirm(T_.confirmRemoveTeam(teamName))) return
    startTransition(() => { void removeLeagueTeam(teamId, leagueId) })
  }

  return (
    <div className="space-y-3">
      {teams.length === 0 && !adding && (
        <p className="text-sm text-gray-400 py-6 text-center">{T_.noTeams}</p>
      )}

      {teams.map(team => (
        <TeamCard key={team.id} leagueId={leagueId} team={team} lang={lang} onRemoveTeam={handleRemoveTeam} />
      ))}

      {adding ? (
        <div className="bg-white rounded-2xl border border-violet-200 p-4 space-y-3 shadow-sm">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={T_.teamNamePlaceholder}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-violet-400 outline-none text-sm"
          />
          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder={T_.cityPlaceholder}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-violet-400 outline-none text-sm"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAddTeam}
              disabled={isPending}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              <Check size={14} /> {T_.add}
            </button>
            <button
              onClick={() => { setAdding(false); setError('') }}
              className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm px-3 py-2 rounded-lg transition-colors"
            >
              <X size={14} /> {T_.cancel}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center justify-center gap-1.5 w-full text-sm font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 transition-colors py-2.5 rounded-xl"
        >
          <Plus size={15} /> {T_.addTeam}
        </button>
      )}
    </div>
  )
}
