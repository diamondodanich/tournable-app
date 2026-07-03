'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Save, Trash2, Settings as SettingsIcon, Users, Layers, AlertTriangle } from 'lucide-react'
import { updateLeague, deleteLeague } from '@/app/actions/leagues'
import TeamsSquadsTab from './TeamsSquadsTab'
import SeasonsTab from './SeasonsTab'
import { getSportTheme } from '@/lib/sports'
import type { League, Season, LeagueTeam, Player } from '@/types'

type TeamWithPlayers = LeagueTeam & { players: Player[] }
type Lang = 'ru' | 'kz' | 'en'
type SubTab = 'general' | 'teams' | 'seasons' | 'danger'

const SPORTS: Record<Lang, { value: string; label: string }[]> = {
  ru: [
    { value: 'football', label: 'Футбол' }, { value: 'futsal', label: 'Футзал' },
    { value: 'basketball', label: 'Баскетбол' }, { value: 'volleyball', label: 'Волейбол' },
    { value: 'hockey', label: 'Хоккей' }, { value: 'efootball', label: 'Киберфутбол' },
    { value: 'ebasketball', label: 'Кибербаскетбол' }, { value: 'beach_volleyball', label: 'Пляжный волейбол' },
    { value: 'other', label: 'Другое' },
  ],
  kz: [
    { value: 'football', label: 'Футбол' }, { value: 'futsal', label: 'Футзал' },
    { value: 'basketball', label: 'Баскетбол' }, { value: 'volleyball', label: 'Волейбол' },
    { value: 'hockey', label: 'Хоккей' }, { value: 'efootball', label: 'Кибер футбол' },
    { value: 'ebasketball', label: 'Кибер баскетбол' }, { value: 'beach_volleyball', label: 'Пляжды волейбол' },
    { value: 'other', label: 'Басқа' },
  ],
  en: [
    { value: 'football', label: 'Football' }, { value: 'futsal', label: 'Futsal' },
    { value: 'basketball', label: 'Basketball' }, { value: 'volleyball', label: 'Volleyball' },
    { value: 'hockey', label: 'Hockey' }, { value: 'efootball', label: 'eFootball' },
    { value: 'ebasketball', label: 'eBasketball' }, { value: 'beach_volleyball', label: 'Beach volleyball' },
    { value: 'other', label: 'Other' },
  ],
}

const T = {
  ru: {
    back: 'К чемпионату', title: 'Настройки чемпионата',
    tabs: { general: 'Основное', teams: 'Команды и составы', seasons: 'Сезоны', danger: 'Удаление' },
    nameLabel: 'Название', sportLabel: 'Вид спорта', notSpecified: 'Не указан', cityLabel: 'Город',
    publicLabel: 'Публичная страница', publicHint: 'Виден в поиске и по прямой ссылке',
    save: 'Сохранить', saved: 'Сохранено', enterName: 'Введите название',
    dangerTitle: 'Удалить чемпионат', dangerHint: 'Все сезоны, команды и статистика будут удалены безвозвратно.',
    delete: 'Удалить чемпионат',
    confirmDelete: (n: string) => `Удалить чемпионат "${n}"? Это действие необратимо.`,
  },
  kz: {
    back: 'Чемпионатқа', title: 'Чемпионат баптаулары',
    tabs: { general: 'Негізгі', teams: 'Командалар мен құрамдар', seasons: 'Маусымдар', danger: 'Жою' },
    nameLabel: 'Атауы', sportLabel: 'Спорт түрі', notSpecified: 'Көрсетілмеген', cityLabel: 'Қала',
    publicLabel: 'Ашық бет', publicHint: 'Іздеуден және тікелей сілтемеден көрінеді',
    save: 'Сақтау', saved: 'Сақталды', enterName: 'Атауын енгізіңіз',
    dangerTitle: 'Чемпионатты жою', dangerHint: 'Барлық маусымдар, командалар және статистика қайтарымсыз жойылады.',
    delete: 'Чемпионатты жою',
    confirmDelete: (n: string) => `"${n}" чемпионатын жою керек пе? Бұл әрекетті қайтару мүмкін емес.`,
  },
  en: {
    back: 'To championship', title: 'Championship settings',
    tabs: { general: 'General', teams: 'Teams & squads', seasons: 'Seasons', danger: 'Delete' },
    nameLabel: 'Name', sportLabel: 'Sport', notSpecified: 'Not specified', cityLabel: 'City',
    publicLabel: 'Public page', publicHint: 'Discoverable in search and via direct link',
    save: 'Save', saved: 'Saved', enterName: 'Enter a name',
    dangerTitle: 'Delete championship', dangerHint: 'All seasons, teams and statistics will be permanently deleted.',
    delete: 'Delete championship',
    confirmDelete: (n: string) => `Delete championship "${n}"? This action cannot be undone.`,
  },
} as const

export default function ChampionshipSettings({ league, seasons, teams, lang = 'ru' }: {
  league: League
  seasons: Season[]
  teams: TeamWithPlayers[]
  lang?: Lang
}) {
  const tx = T[lang]
  const router = useRouter()
  const theme = getSportTheme(league.sport)
  const [tab, setTab] = useState<SubTab>('general')

  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(league.name)
  const [sport, setSport] = useState(league.sport ?? '')
  const [city, setCity] = useState(league.city ?? '')
  const [isPublic, setIsPublic] = useState(league.is_public)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function handleSave() {
    if (!name.trim()) { setError(tx.enterName); return }
    setError('')
    startTransition(async () => {
      const res = await updateLeague(league.id, {
        name: name.trim(), sport: sport || null, city: city.trim() || null, is_public: isPublic,
      })
      if (res?.error) { setError(res.error); return }
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    })
  }

  function handleDelete() {
    if (!confirm(tx.confirmDelete(league.name))) return
    startTransition(() => deleteLeague(league.id))
  }

  const TABS: { id: SubTab; label: string; icon: typeof SettingsIcon }[] = [
    { id: 'general', label: tx.tabs.general, icon: SettingsIcon },
    { id: 'teams', label: tx.tabs.teams, icon: Users },
    { id: 'seasons', label: tx.tabs.seasons, icon: Layers },
    { id: 'danger', label: tx.tabs.danger, icon: AlertTriangle },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl px-5 py-4 text-white shadow-sm"
        style={{ background: `linear-gradient(135deg, ${theme.primaryDark} 0%, ${theme.primary} 100%)` }}>
        <button onClick={() => router.push(`/dashboard/leagues/${league.id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors mb-2">
          <ChevronLeft size={14} /> {tx.back}
        </button>
        <h1 className="text-xl sm:text-2xl font-black">{tx.title}</h1>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          const danger = t.id === 'danger'
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                active
                  ? danger ? 'bg-red-600 text-white' : 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white text-gray-500 hover:text-violet-600 border border-gray-100'
              }`}>
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'general' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5 max-w-lg">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">{tx.nameLabel}</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-violet-400 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">{tx.sportLabel}</label>
            <select value={sport} onChange={e => setSport(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-violet-400 outline-none text-sm bg-white">
              <option value="">{tx.notSpecified}</option>
              {SPORTS[lang].map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">{tx.cityLabel}</label>
            <input value={city} onChange={e => setCity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-violet-400 outline-none text-sm" />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer border-t border-gray-100 pt-4">
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-4 h-4 accent-violet-600" />
            <span>
              <span className="block text-sm font-bold text-gray-700">{tx.publicLabel}</span>
              <span className="block text-xs text-gray-400">{tx.publicHint}</span>
            </span>
          </label>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button onClick={handleSave} disabled={isPending}
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
            <Save size={14} /> {saved ? tx.saved : tx.save}
          </button>
        </div>
      )}

      {tab === 'teams' && (
        <TeamsSquadsTab leagueId={league.id} teams={teams} lang={lang} />
      )}

      {tab === 'seasons' && (
        <SeasonsTab leagueId={league.id} seasons={seasons} lang={lang} />
      )}

      {tab === 'danger' && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 max-w-lg">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <AlertTriangle size={17} className="text-red-500" />
            </div>
            <div>
              <p className="font-black text-gray-900 text-sm">{tx.dangerTitle}</p>
              <p className="text-xs text-gray-400 mt-0.5">{tx.dangerHint}</p>
            </div>
          </div>
          <button onClick={handleDelete} disabled={isPending}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
            <Trash2 size={14} /> {tx.delete}
          </button>
        </div>
      )}
    </div>
  )
}
