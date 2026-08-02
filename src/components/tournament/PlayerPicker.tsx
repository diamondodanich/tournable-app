'use client'

// Squad-bound player selection for match-event forms.
//
// Events are stored against a player *name*, and everything downstream — the
// player's profile page, all-time championship stats, the clickable links in the
// stats tables — matches on that exact string. A free-text field quietly produces
// events that belong to nobody, so the event forms pick from the team's squad and
// send the owner to the squad editor when there is nothing to pick from.

import type { RosterEntry } from '@/app/actions/lineups'

export type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: { empty: 'Сначала заполните состав команды — события записываются на игроков из состава.', fill: 'Заполнить состав' },
  kz: { empty: 'Алдымен команда құрамын толтырыңыз — оқиғалар құрамдағы ойыншыларға жазылады.', fill: 'Құрамды толтыру' },
  en: { empty: 'Fill the team squad first — events are recorded against squad players.', fill: 'Fill the squad' },
} as const

export function EmptyRosterNotice({ lang, onFillSquad }: { lang: Lang; onFillSquad?: () => void }) {
  return (
    <div className="rounded-md border border-dashed border-amber-300 bg-amber-50 px-2.5 py-2">
      <p className="text-[11px] text-amber-800 leading-snug">{T[lang].empty}</p>
      {onFillSquad && (
        <button onClick={onFillSquad} className="mt-1.5 text-[11px] font-bold text-amber-900 underline underline-offset-2">
          {T[lang].fill}
        </button>
      )}
    </div>
  )
}

export function RosterSelect({ roster, value, onChange, placeholder, exclude }: {
  roster: RosterEntry[]
  value: string
  onChange: (name: string) => void
  placeholder: string
  /** Name to hide — keeps a player from assisting their own goal. */
  exclude?: string
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-7 text-xs bg-white w-full rounded-md border border-gray-200 px-2 outline-none focus:border-gray-400"
    >
      <option value="">{placeholder}</option>
      {roster.filter(p => !exclude || p.name !== exclude).map(p => (
        <option key={p.name} value={p.name}>{p.number != null ? `${p.number}. ` : ''}{p.name}</option>
      ))}
    </select>
  )
}
