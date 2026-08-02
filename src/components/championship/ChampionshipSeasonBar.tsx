'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ChevronLeft, ChevronDown, Check, CalendarDays, Settings, Plus, LayoutGrid, Loader2, Share2, Users,
} from 'lucide-react'
import TeamAvatar from '@/components/tournament/TeamAvatar'
import { getSportTheme, type Format } from '@/lib/sports'
import { addSeasonQuick, getSeasonDraft, type ChampFormat, type SeasonDraft } from '@/app/actions/leagues'
import { FORMAT_LABELS, FORMAT_DESCS } from '@/lib/formats'
import ChampionshipShare from './ChampionshipShare'

type Lang = 'ru' | 'kz' | 'en'

type SeasonLite = { id: string; name: string; status: string; tournament_id: string | null; format: string | null }

const FORMAT_CHOICES: ChampFormat[] = ['round_robin', 'league_playoff', 'groups_playoff', 'playoff', 'double_elim', 'swiss', 'leaderboard']

const T = {
  ru: {
    back: 'Все турниры', allSeasons: 'Все сезоны', addSeason: 'Добавить сезон',
    active: 'Активный', settings: 'Настройки', adding: 'Создаём сезон…', switch: 'Сменить сезон', share: 'Поделиться',
    confirmTitle: 'Новый сезон',
    nameLbl: 'Название', formatLbl: 'Формат', same: 'как сейчас', changeFormat: 'Выбрать другой формат',
    keepFormat: 'Оставить текущий формат',
    teamsNote: (n: number) => `${n} команд чемпионата перейдут в новый сезон`,
    teamsEdit: 'Изменить состав команд',
    create: 'Создать сезон', cancel: 'Отмена', errName: 'Введите название сезона',
  },
  kz: {
    back: 'Барлық турнирлер', allSeasons: 'Барлық маусымдар', addSeason: 'Маусым қосу',
    active: 'Белсенді', settings: 'Баптаулар', adding: 'Маусым жасалуда…', switch: 'Маусымды ауыстыру', share: 'Бөлісу',
    confirmTitle: 'Жаңа маусым',
    nameLbl: 'Атауы', formatLbl: 'Формат', same: 'қазіргідей', changeFormat: 'Басқа форматты таңдау',
    keepFormat: 'Ағымдағы форматты қалдыру',
    teamsNote: (n: number) => `Чемпионаттың ${n} командасы жаңа маусымға көшеді`,
    teamsEdit: 'Командалар құрамын өзгерту',
    create: 'Маусым құру', cancel: 'Бас тарту', errName: 'Маусым атауын енгізіңіз',
  },
  en: {
    back: 'All tournaments', allSeasons: 'All seasons', addSeason: 'Add season',
    active: 'Active', settings: 'Settings', adding: 'Creating season…', switch: 'Switch season', share: 'Share',
    confirmTitle: 'New season',
    nameLbl: 'Name', formatLbl: 'Format', same: 'as now', changeFormat: 'Pick a different format',
    keepFormat: 'Keep the current format',
    teamsNote: (n: number) => `${n} championship teams carry over to the new season`,
    teamsEdit: 'Edit the team list',
    create: 'Create season', cancel: 'Cancel', errName: 'Enter a season name',
  },
} as const

function tableTab(format: string | null): string {
  if (format === 'groups_playoff') return 'group-standings'
  if (format === 'playoff') return 'playoff'
  return 'standings'
}

export default function ChampionshipSeasonBar({ league, seasons, currentSeasonId, lang = 'ru', isOwner = false }: {
  league: { id: string; name: string; slug: string; sport: string | null; logo_url: string | null }
  seasons: SeasonLite[]
  currentSeasonId: string | null
  lang?: Lang
  isOwner?: boolean
}) {
  const tx = T[lang]
  const router = useRouter()
  const theme = getSportTheme(league.sport)
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  // New-season dialog state. The dialog is self-contained on purpose: a new season
  // reuses the championship's teams and rules, so pushing the owner back through the
  // 4-step creation wizard just to reconfirm them was pure friction. The only real
  // decision left is "same format or another one".
  const [draft, setDraft] = useState<SeasonDraft | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftFormat, setDraftFormat] = useState<ChampFormat>('round_robin')
  const [formatOpen, setFormatOpen] = useState(false)

  // currentSeasonId === null → "All seasons" mode (championship overview page).
  const allSeasonsMode = currentSeasonId === null
  const current = seasons.find(s => s.id === currentSeasonId)
  const buttonLabel = allSeasonsMode ? tx.allSeasons : current?.name

  function goToSeason(s: SeasonLite) {
    setOpen(false)
    if (s.id === currentSeasonId || !s.tournament_id) return
    router.push(`/dashboard/tournament/${s.tournament_id}?tab=${tableTab(s.format)}`)
  }

  async function openAddDialog() {
    setOpen(false)
    setAdding(true)
    const d = await getSeasonDraft(league.id, lang)
    setAdding(false)
    if (d.error) { toast.error(d.error); return }
    setDraft(d)
    setDraftName(d.suggestedName)
    setDraftFormat(d.currentFormat)
    setFormatOpen(false)
  }

  function closeAddDialog() {
    setDraft(null)
    setFormatOpen(false)
  }

  async function handleCreateSeason() {
    if (!draftName.trim()) { toast.error(tx.errName); return }
    const keepRounds = draft?.currentFormat === draftFormat ? draft?.numRounds : undefined
    setDraft(null)
    setAdding(true)
    const res = await addSeasonQuick(league.id, lang, { name: draftName.trim(), format: draftFormat, numRounds: keepRounds })
    setAdding(false)
    if (res.error) { toast.error(res.error); return }
    if (res.tournamentId) router.push(`/dashboard/tournament/${res.tournamentId}?tab=standings`)
  }

  return (
    <div className="relative rounded-2xl text-white shadow-sm px-5 py-4"
      style={{ background: `linear-gradient(135deg, ${theme.primaryDark} 0%, ${theme.primary} 100%)` }}>

      <Link href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors mb-3">
        <ChevronLeft size={14} /> {tx.back}
      </Link>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 rounded-xl ring-2 ring-white/30 overflow-hidden bg-white/10">
            <TeamAvatar name={league.name} logoUrl={league.logo_url} size={48} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-black leading-tight truncate">{league.name}</h1>

            {/* Season selector — Flashscore-style, not clipped */}
            <div className="relative mt-1.5 inline-block">
              <button
                onClick={() => setOpen(v => !v)}
                disabled={adding}
                title={tx.switch}
                className="inline-flex items-center gap-1.5 text-sm font-bold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {adding ? <Loader2 size={13} className="animate-spin" /> : <CalendarDays size={13} />}
                <span className="truncate max-w-[180px]">{adding ? tx.adding : buttonLabel}</span>
                {!adding && <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />}
              </button>

              {open && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                  <div className="absolute z-50 mt-1.5 left-0 min-w-[240px] bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 text-gray-900 max-h-80 overflow-auto">
                    {seasons.map(s => (
                      <button key={s.id} onClick={() => goToSeason(s)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left">
                        <span className="flex-1 text-sm font-bold truncate">{s.name}</span>
                        {s.status === 'active' && (
                          <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{tx.active}</span>
                        )}
                        {s.id === currentSeasonId && <Check size={14} className="shrink-0" style={{ color: theme.primary }} />}
                      </button>
                    ))}

                    <div className="border-t border-gray-100 my-1" />

                    <Link href={`/dashboard/leagues/${league.id}?view=all`} onClick={() => setOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                      <LayoutGrid size={15} className="text-gray-400" />
                      <span className="flex-1">{tx.allSeasons}</span>
                      {allSeasonsMode && <Check size={14} className="shrink-0" style={{ color: theme.primary }} />}
                    </Link>

                    {isOwner && (
                      <button onClick={openAddDialog}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-sm font-bold"
                        style={{ color: theme.primary }}>
                        <Plus size={15} /> {tx.addSeason}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShareOpen(true)}
            title={tx.share}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-bold bg-white/15 hover:bg-white/25 transition-colors">
            <Share2 size={15} />
            <span className="hidden sm:inline">{tx.share}</span>
          </button>
          {isOwner && (
            <Link href={`/dashboard/leagues/${league.id}/settings`}
              title={tx.settings}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-bold bg-white/15 hover:bg-white/25 transition-colors">
              <Settings size={15} />
              <span className="hidden sm:inline">{tx.settings}</span>
            </Link>
          )}
        </div>
      </div>

      {shareOpen && (
        <ChampionshipShare
          leagueId={league.id}
          slug={league.slug}
          name={league.name}
          brand={theme.primary}
          lang={lang}
          isOwner={isOwner}
          onClose={() => setShareOpen(false)}
        />
      )}

      {draft && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={closeAddDialog} />
          <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 p-6 text-gray-900 max-h-[92vh] overflow-y-auto">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${theme.primary}18` }}>
              <Plus size={22} style={{ color: theme.primary }} />
            </div>
            <h3 className="text-lg font-black mb-4">{tx.confirmTitle}</h3>

            {/* Name — prefilled with the logical continuation of the last season */}
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5">{tx.nameLbl}</label>
            <input value={draftName} onChange={e => setDraftName(e.target.value)} maxLength={40}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-gray-400 outline-none text-sm font-bold mb-5" />

            {/* Format — current one preselected; the list opens only on request */}
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5">{tx.formatLbl}</label>
            {!formatOpen ? (
              <div className="mb-5">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
                  <span className="flex-1 text-sm font-bold truncate">{FORMAT_LABELS[draftFormat as Format][lang]}</span>
                  {draftFormat === draft.currentFormat && (
                    <span className="text-[10px] font-black uppercase text-gray-400 shrink-0">{tx.same}</span>
                  )}
                </div>
                <button onClick={() => setFormatOpen(true)}
                  className="mt-2 text-xs font-bold hover:opacity-80 transition-opacity" style={{ color: theme.primary }}>
                  {tx.changeFormat}
                </button>
              </div>
            ) : (
              <div className="mb-5 space-y-1.5">
                {FORMAT_CHOICES.map(f => {
                  const active = draftFormat === f
                  return (
                    <button key={f} onClick={() => setDraftFormat(f)}
                      style={active ? { borderColor: theme.primary, background: `${theme.primary}0f` } : undefined}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${active ? '' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-sm font-bold truncate">{FORMAT_LABELS[f as Format][lang]}</span>
                        {f === draft.currentFormat && <span className="text-[10px] font-black uppercase text-gray-400 shrink-0">{tx.same}</span>}
                        {active && <Check size={14} className="shrink-0" style={{ color: theme.primary }} />}
                      </div>
                      <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{FORMAT_DESCS[f as Format][lang]}</p>
                    </button>
                  )
                })}
                <button onClick={() => { setDraftFormat(draft.currentFormat); setFormatOpen(false) }}
                  className="w-full text-xs font-bold text-gray-400 hover:text-gray-600 py-1.5 transition-colors">
                  {tx.keepFormat}
                </button>
              </div>
            )}

            {/* Teams are the championship's persistent roster — edited in settings,
                never re-entered per season. */}
            <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5 mb-5">
              <Users size={14} className="shrink-0 mt-0.5 text-gray-400" />
              <div className="min-w-0">
                <p>{tx.teamsNote(draft.teams.length)}</p>
                <Link href={`/dashboard/leagues/${league.id}/settings`} onClick={closeAddDialog}
                  className="font-bold hover:opacity-80 transition-opacity" style={{ color: theme.primary }}>
                  {tx.teamsEdit}
                </Link>
              </div>
            </div>

            <button onClick={handleCreateSeason}
              className="w-full text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
              style={{ background: theme.primary }}>
              {tx.create}
            </button>
            <button onClick={closeAddDialog}
              className="w-full text-sm font-medium text-gray-400 hover:text-gray-600 py-2 mt-1 transition-colors">
              {tx.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
