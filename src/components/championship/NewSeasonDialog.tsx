'use client'

// The single way to start a new season.
//
// Adding a season used to drop the owner back into the 4-step creation wizard,
// where they re-confirmed the teams and every match rule the championship already
// stores. A championship is configured once; the only decision a new season really
// carries is "same format or another one", so that is all this dialog asks. Teams
// come from the championship's persistent roster and are edited in its settings,
// not re-entered per season.

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Check, Users } from 'lucide-react'
import { addSeasonQuick, getSeasonDraft, type ChampFormat, type SeasonDraft } from '@/app/actions/leagues'
import { FORMAT_LABELS, FORMAT_DESCS } from '@/lib/formats'

export type Lang = 'ru' | 'kz' | 'en'

const FORMAT_CHOICES: ChampFormat[] = ['round_robin', 'league_playoff', 'groups_playoff', 'playoff', 'double_elim', 'swiss', 'leaderboard']

const T = {
  ru: {
    title: 'Новый сезон',
    nameLbl: 'Название', formatLbl: 'Формат', same: 'как сейчас', changeFormat: 'Выбрать другой формат',
    keepFormat: 'Оставить текущий формат',
    teamsNote: (n: number) => `${n} команд чемпионата перейдут в новый сезон`,
    teamsEdit: 'Изменить состав команд',
    create: 'Создать сезон', cancel: 'Отмена', errName: 'Введите название сезона',
  },
  kz: {
    title: 'Жаңа маусым',
    nameLbl: 'Атауы', formatLbl: 'Формат', same: 'қазіргідей', changeFormat: 'Басқа форматты таңдау',
    keepFormat: 'Ағымдағы форматты қалдыру',
    teamsNote: (n: number) => `Чемпионаттың ${n} командасы жаңа маусымға көшеді`,
    teamsEdit: 'Командалар құрамын өзгерту',
    create: 'Маусым құру', cancel: 'Бас тарту', errName: 'Маусым атауын енгізіңіз',
  },
  en: {
    title: 'New season',
    nameLbl: 'Name', formatLbl: 'Format', same: 'as now', changeFormat: 'Pick a different format',
    keepFormat: 'Keep the current format',
    teamsNote: (n: number) => `${n} championship teams carry over to the new season`,
    teamsEdit: 'Edit the team list',
    create: 'Create season', cancel: 'Cancel', errName: 'Enter a season name',
  },
} as const

/** Loads the draft for a championship. Returns null (and toasts) on failure. */
export async function loadSeasonDraft(leagueId: string, lang: Lang): Promise<SeasonDraft | null> {
  const d = await getSeasonDraft(leagueId, lang)
  if (d.error) { toast.error(d.error); return null }
  return d
}

export default function NewSeasonDialog({ leagueId, draft, brand, lang = 'ru', onClose, onCreating }: {
  leagueId: string
  draft: SeasonDraft
  brand: string
  lang?: Lang
  onClose: () => void
  /** Fires when the request starts / finishes, so the opener can show a spinner. */
  onCreating?: (busy: boolean) => void
}) {
  const tx = T[lang]
  const router = useRouter()
  const [name, setName] = useState(draft.suggestedName)
  const [format, setFormat] = useState<ChampFormat>(draft.currentFormat)
  const [formatOpen, setFormatOpen] = useState(false)

  async function create() {
    if (!name.trim()) { toast.error(tx.errName); return }
    // Round counts only carry over while the format does; a count cloned across
    // formats would silently misbuild the season.
    const keepRounds = format === draft.currentFormat ? draft.numRounds : undefined
    onClose()
    onCreating?.(true)
    const res = await addSeasonQuick(leagueId, lang, { name: name.trim(), format, numRounds: keepRounds })
    onCreating?.(false)
    if (res.error) { toast.error(res.error); return }
    if (res.tournamentId) router.push(`/dashboard/tournament/${res.tournamentId}?tab=standings`)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 p-6 text-gray-900 max-h-[92vh] overflow-y-auto">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${brand}18` }}>
          <Plus size={22} style={{ color: brand }} />
        </div>
        <h3 className="text-lg font-black mb-4">{tx.title}</h3>

        {/* Name — prefilled with the logical continuation of the last season */}
        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5">{tx.nameLbl}</label>
        <input value={name} onChange={e => setName(e.target.value)} maxLength={40}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-gray-400 outline-none text-sm font-bold mb-5" />

        {/* Format — current one preselected; the list opens only on request */}
        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5">{tx.formatLbl}</label>
        {!formatOpen ? (
          <div className="mb-5">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
              <span className="flex-1 text-sm font-bold truncate">{FORMAT_LABELS[format][lang]}</span>
              {format === draft.currentFormat && (
                <span className="text-[10px] font-black uppercase text-gray-400 shrink-0">{tx.same}</span>
              )}
            </div>
            <button onClick={() => setFormatOpen(true)}
              className="mt-2 text-xs font-bold hover:opacity-80 transition-opacity" style={{ color: brand }}>
              {tx.changeFormat}
            </button>
          </div>
        ) : (
          <div className="mb-5 space-y-1.5">
            {FORMAT_CHOICES.map(f => {
              const active = format === f
              return (
                <button key={f} onClick={() => setFormat(f)}
                  style={active ? { borderColor: brand, background: `${brand}0f` } : undefined}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${active ? '' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-sm font-bold truncate">{FORMAT_LABELS[f][lang]}</span>
                    {f === draft.currentFormat && <span className="text-[10px] font-black uppercase text-gray-400 shrink-0">{tx.same}</span>}
                    {active && <Check size={14} className="shrink-0" style={{ color: brand }} />}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{FORMAT_DESCS[f][lang]}</p>
                </button>
              )
            })}
            <button onClick={() => { setFormat(draft.currentFormat); setFormatOpen(false) }}
              className="w-full text-xs font-bold text-gray-400 hover:text-gray-600 py-1.5 transition-colors">
              {tx.keepFormat}
            </button>
          </div>
        )}

        {/* Teams live on the championship, not on the season */}
        <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5 mb-5">
          <Users size={14} className="shrink-0 mt-0.5 text-gray-400" />
          <div className="min-w-0">
            <p>{tx.teamsNote(draft.teams.length)}</p>
            <Link href={`/dashboard/leagues/${leagueId}/settings`} onClick={onClose}
              className="font-bold hover:opacity-80 transition-opacity" style={{ color: brand }}>
              {tx.teamsEdit}
            </Link>
          </div>
        </div>

        <button onClick={create}
          className="w-full text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: brand }}>
          {tx.create}
        </button>
        <button onClick={onClose}
          className="w-full text-sm font-medium text-gray-400 hover:text-gray-600 py-2 mt-1 transition-colors">
          {tx.cancel}
        </button>
      </div>
    </div>
  )
}
