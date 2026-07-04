'use client'

import { useState } from 'react'
import { Team, Fixture } from '@/types'
import { CalendarDays, Clock } from 'lucide-react'
import TeamAvatar from './TeamAvatar'
import { updateFixtureSchedule } from '@/app/actions/tournaments'
import { type Lang } from '@/lib/i18n'

const T = {
  ru: { title: 'Расписание матчей', tbd: 'Дата не назначена', round: 'Тур', save: 'Сохранить дату', setDate: 'Назначить дату', empty: 'Матчей нет' },
  kz: { title: 'Матч кестесі', tbd: 'Күні белгіленбеген', round: 'Тур', save: 'Күнді сақтау', setDate: 'Күн белгілеу', empty: 'Матчтар жоқ' },
  en: { title: 'Match schedule', tbd: 'Date not set', round: 'Round', save: 'Save date', setDate: 'Set date', empty: 'No matches' },
} as const

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function CalendarTab({ fixtures, teams, tournamentId, isOwner = false, lang = 'ru' }: {
  fixtures: Fixture[]
  teams: Team[]
  tournamentId: string
  isOwner?: boolean
  lang?: Lang
}) {
  const t = T[lang]
  const [dates, setDates] = useState<Record<string, string | null>>(
    Object.fromEntries(fixtures.map(f => [f.id, (f as { scheduled_at?: string | null }).scheduled_at ?? null])),
  )
  const [saving, setSaving] = useState<string | null>(null)

  const teamName = (id: string | null) => teams.find(x => x.id === id)?.name ?? '—'
  const teamLogo = (id: string | null) => teams.find(x => x.id === id)?.logo_url ?? null

  const real = fixtures.filter(f => !f.is_bye && f.home_team_id && f.away_team_id)
    .sort((a, b) => {
      const da = dates[a.id], db = dates[b.id]
      if (da && db) return new Date(da).getTime() - new Date(db).getTime()
      if (da) return -1
      if (db) return 1
      return a.matchday - b.matchday
    })

  async function onChange(fixtureId: string, value: string) {
    const iso = value ? new Date(value).toISOString() : null
    setDates(prev => ({ ...prev, [fixtureId]: iso }))
    setSaving(fixtureId)
    await updateFixtureSchedule(fixtureId, tournamentId, iso)
    setSaving(null)
  }

  const fmt = (iso: string | null) => iso
    ? new Date(iso).toLocaleString(lang === 'kz' ? 'kk-KZ' : lang === 'en' ? 'en-US' : 'ru-RU', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : t.tbd

  if (real.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <CalendarDays className="mx-auto mb-3 text-gray-300" size={40} />
        <p className="font-bold text-gray-600">{t.empty}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500 font-medium mb-1">{t.title}</p>
      {real.map(f => (
        <div key={f.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 shrink-0">{t.round} {f.matchday}</span>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: dates[f.id] ? '#059669' : '#9ca3af' }}>
              <Clock size={12} /> {fmt(dates[f.id])}
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex items-center gap-2 min-w-0 justify-end">
              <span className="font-bold text-sm text-gray-900 truncate text-right">{teamName(f.home_team_id)}</span>
              <TeamAvatar name={teamName(f.home_team_id)} logoUrl={teamLogo(f.home_team_id)} size={26} />
            </div>
            <span className="text-xs font-black text-gray-400 px-1">
              {f.played ? `${f.home_score} : ${f.away_score}` : 'vs'}
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <TeamAvatar name={teamName(f.away_team_id)} logoUrl={teamLogo(f.away_team_id)} size={26} />
              <span className="font-bold text-sm text-gray-900 truncate">{teamName(f.away_team_id)}</span>
            </div>
          </div>
          {isOwner && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <input
                type="datetime-local"
                value={toLocalInput(dates[f.id] ?? null)}
                onChange={e => onChange(f.id, e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-[var(--sp)] outline-none text-sm"
              />
              {saving === f.id && <span className="text-xs text-gray-400">…</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
