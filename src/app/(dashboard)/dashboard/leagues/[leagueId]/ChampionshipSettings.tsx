'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Save, Trash2, Settings as SettingsIcon, Layers, AlertTriangle, LayoutTemplate, Image as ImageIcon, Globe, CalendarRange } from 'lucide-react'
import { updateLeague, deleteLeague, setCalendarEnabled } from '@/app/actions/leagues'
import SeasonsTab from './SeasonsTab'
import TournamentLogoUpload from '@/components/tournament/TournamentLogoUpload'
import TournamentCoverPicker from '@/components/tournament/TournamentCoverPicker'
import TournamentCoverBanner from '@/components/tournament/TournamentCoverBanner'
import { getSportTheme } from '@/lib/sports'
import { SEASON_PERIOD_OPTIONS, type SeasonPeriod } from '@/lib/seasons'
import type { League, Season } from '@/types'
import { confirmDialog } from '@/components/ui/confirm'

type Lang = 'ru' | 'kz' | 'en'
type SubTab = 'general' | 'seasons' | 'danger'

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
    tabs: { general: 'Основное', seasons: 'Сезоны', danger: 'Удаление' },
    brandingTitle: 'Логотип и название',
    logoHint: 'Квадратное изображение до 1 МБ. Показывается в шапке чемпионата, в сезонах и на публичной странице.',
    nameLabel: 'Название', sportLabel: 'Вид спорта', notSpecified: 'Не указан', cityLabel: 'Город',
    coverLabel: 'Обложка чемпионата',
    coverHint: 'Баннер в шапке публичной страницы. Загрузите своё изображение или выберите готовую тему.',
    aboutTitle: 'Описание и SEO',
    descriptionLabel: 'Описание',
    descriptionHint: 'Короткий текст о чемпионате — виден на публичной странице и в поиске.',
    metaTitlePlaceholder: 'Meta title (по умолчанию = название чемпионата)',
    metaDescriptionPlaceholder: 'Meta description',
    periodTitle: 'Периодичность сезонов',
    periodHint: 'Названия новых сезонов создаются автоматически и продолжают этот порядок.',
    visibilityTitle: 'Доступ и функции',
    publicLabel: 'Публичная страница', publicHint: 'Виден в поиске и по прямой ссылке',
    calendarLabel: 'Календарь матчей', calendarHint: 'Даты и время матчей, отдельная вкладка «Календарь»',
    save: 'Сохранить', saved: 'Сохранено', enterName: 'Введите название',
    dangerTitle: 'Удалить чемпионат', dangerHint: 'Все сезоны, команды и статистика будут удалены безвозвратно.',
    delete: 'Удалить чемпионат',
    confirmDelete: (n: string) => `Удалить чемпионат "${n}"? Это действие необратимо.`,
  },
  kz: {
    back: 'Чемпионатқа', title: 'Чемпионат баптаулары',
    tabs: { general: 'Негізгі', seasons: 'Маусымдар', danger: 'Жою' },
    brandingTitle: 'Логотип және атауы',
    logoHint: '1 МБ дейінгі шаршы сурет. Чемпионат шапкасында, маусымдарда және ашық бетте көрінеді.',
    nameLabel: 'Атауы', sportLabel: 'Спорт түрі', notSpecified: 'Көрсетілмеген', cityLabel: 'Қала',
    coverLabel: 'Чемпионат мұқабасы',
    coverHint: 'Ашық беттің шапкасындағы баннер. Өз суретіңізді жүктеңіз немесе дайын тақырыпты таңдаңыз.',
    aboutTitle: 'Сипаттама және SEO',
    descriptionLabel: 'Сипаттама',
    descriptionHint: 'Чемпионат туралы қысқа мәтін — ашық бетте және іздеуде көрінеді.',
    metaTitlePlaceholder: 'Meta title (әдепкі = чемпионат атауы)',
    metaDescriptionPlaceholder: 'Meta description',
    periodTitle: 'Маусым кезеңділігі',
    periodHint: 'Жаңа маусым атаулары автоматты жасалып, осы ретпен жалғасады.',
    visibilityTitle: 'Қолжетімділік және функциялар',
    publicLabel: 'Ашық бет', publicHint: 'Іздеуден және тікелей сілтемеден көрінеді',
    calendarLabel: 'Матч күнтізбесі', calendarHint: 'Матч күні мен уақыты, бөлек «Күнтізбе» қойындысы',
    save: 'Сақтау', saved: 'Сақталды', enterName: 'Атауын енгізіңіз',
    dangerTitle: 'Чемпионатты жою', dangerHint: 'Барлық маусымдар, командалар және статистика қайтарымсыз жойылады.',
    delete: 'Чемпионатты жою',
    confirmDelete: (n: string) => `"${n}" чемпионатын жою керек пе? Бұл әрекетті қайтару мүмкін емес.`,
  },
  en: {
    back: 'To championship', title: 'Championship settings',
    tabs: { general: 'General', seasons: 'Seasons', danger: 'Delete' },
    brandingTitle: 'Logo and name',
    logoHint: 'Square image up to 1 MB. Shown in the championship header, in seasons and on the public page.',
    nameLabel: 'Name', sportLabel: 'Sport', notSpecified: 'Not specified', cityLabel: 'City',
    coverLabel: 'Championship cover',
    coverHint: 'Banner at the top of the public page. Upload your own image or pick a ready-made theme.',
    aboutTitle: 'Description and SEO',
    descriptionLabel: 'Description',
    descriptionHint: 'A short text about the championship — shown on the public page and in search.',
    metaTitlePlaceholder: 'Meta title (defaults to championship name)',
    metaDescriptionPlaceholder: 'Meta description',
    periodTitle: 'Season periodicity',
    periodHint: 'New season names are generated automatically and continue this sequence.',
    visibilityTitle: 'Access and features',
    publicLabel: 'Public page', publicHint: 'Discoverable in search and via direct link',
    calendarLabel: 'Match calendar', calendarHint: 'Match dates and times, a separate "Calendar" tab',
    save: 'Save', saved: 'Saved', enterName: 'Enter a name',
    dangerTitle: 'Delete championship', dangerHint: 'All seasons, teams and statistics will be permanently deleted.',
    delete: 'Delete championship',
    confirmDelete: (n: string) => `Delete championship "${n}"? This action cannot be undone.`,
  },
} as const

const INPUT_CLASS = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-violet-400 outline-none text-sm'

export default function ChampionshipSettings({ league, seasons, lang = 'ru' }: {
  league: League
  seasons: Season[]
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
  const [description, setDescription] = useState(league.description ?? '')
  const [metaTitle, setMetaTitle] = useState(league.meta_title ?? '')
  const [metaDescription, setMetaDescription] = useState(league.meta_description ?? '')
  const [period, setPeriod] = useState<SeasonPeriod>((league.season_period as SeasonPeriod) ?? 'seasonal')
  const [isPublic, setIsPublic] = useState(league.is_public)
  const [calendarOn, setCalendarOn] = useState<boolean>(Boolean(league.calendar_enabled))
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function toggleCalendar(v: boolean) {
    setCalendarOn(v)
    startTransition(() => setCalendarEnabled(league.id, v))
  }

  function handleSave() {
    if (!name.trim()) { setError(tx.enterName); return }
    setError('')
    startTransition(async () => {
      const res = await updateLeague(league.id, {
        name: name.trim(),
        sport: sport || null,
        city: city.trim() || null,
        description: description.trim() || null,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        season_period: period,
        is_public: isPublic,
      })
      if (res?.error) { setError(res.error); return }
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    })
  }

  async function handleDelete() {
    if (!(await confirmDialog({ title: tx.confirmDelete(league.name), tone: 'danger', lang }))) return
    startTransition(() => deleteLeague(league.id))
  }

  const TABS: { id: SubTab; label: string; icon: typeof SettingsIcon }[] = [
    { id: 'general', label: tx.tabs.general, icon: SettingsIcon },
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
        <div className="space-y-4 max-w-lg">
          {/* Logo + name + sport + city */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
            <div className="flex items-center gap-2">
              <ImageIcon size={15} className="text-gray-400" />
              <p className="text-sm font-bold text-gray-700">{tx.brandingTitle}</p>
            </div>

            <div className="flex items-start gap-4">
              <TournamentLogoUpload
                leagueId={league.id}
                name={league.name}
                logoUrl={league.logo_url}
                size={64}
                lang={lang}
              />
              <p className="text-xs text-gray-400 leading-relaxed pt-1">{tx.logoHint}</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">{tx.nameLabel}</label>
              <input value={name} onChange={e => setName(e.target.value)} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">{tx.sportLabel}</label>
              <select value={sport} onChange={e => setSport(e.target.value)} className={`${INPUT_CLASS} bg-white`}>
                <option value="">{tx.notSpecified}</option>
                {SPORTS[lang].map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">{tx.cityLabel}</label>
              <input value={city} onChange={e => setCity(e.target.value)} className={INPUT_CLASS} />
            </div>
          </div>

          {/* Cover */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <LayoutTemplate size={15} className="text-gray-400" />
              <p className="text-sm font-bold text-gray-700">{tx.coverLabel}</p>
            </div>
            {league.cover_url && (
              <div className="rounded-xl overflow-hidden h-28 sm:h-36">
                <TournamentCoverBanner coverUrl={league.cover_url} className="h-28 sm:h-36 w-full" />
              </div>
            )}
            <TournamentCoverPicker
              sport={league.sport}
              currentCoverUrl={league.cover_url}
              leagueId={league.id}
              title={tx.coverLabel}
              lang={lang}
            />
            {!league.cover_url && <p className="text-xs text-gray-400">{tx.coverHint}</p>}
          </div>

          {/* Description + SEO */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Globe size={15} className="text-gray-400" />
              <p className="text-sm font-bold text-gray-700">{tx.aboutTitle}</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">{tx.descriptionLabel}</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className={`${INPUT_CLASS} resize-none`}
              />
              <p className="text-xs text-gray-400 mt-1.5">{tx.descriptionHint}</p>
            </div>
            <input
              value={metaTitle}
              onChange={e => setMetaTitle(e.target.value)}
              placeholder={tx.metaTitlePlaceholder}
              className={INPUT_CLASS}
            />
            <input
              value={metaDescription}
              onChange={e => setMetaDescription(e.target.value)}
              placeholder={tx.metaDescriptionPlaceholder}
              className={INPUT_CLASS}
            />
          </div>

          {/* Season periodicity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CalendarRange size={15} className="text-gray-400" />
              <p className="text-sm font-bold text-gray-700">{tx.periodTitle}</p>
            </div>
            <p className="text-xs text-gray-400">{tx.periodHint}</p>
            <div className="grid grid-cols-2 gap-2">
              {SEASON_PERIOD_OPTIONS.map(opt => {
                const active = period === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPeriod(opt.value)}
                    className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                      active
                        ? 'border-violet-500 bg-violet-50 text-violet-700 font-bold'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="block text-sm">{opt.label[lang]}</span>
                    <span className="block text-[11px] text-gray-400 mt-0.5">{opt.example(lang)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Visibility + features */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-sm font-bold text-gray-700">{tx.visibilityTitle}</p>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-4 h-4 accent-violet-600" />
              <span>
                <span className="block text-sm font-bold text-gray-700">{tx.publicLabel}</span>
                <span className="block text-xs text-gray-400">{tx.publicHint}</span>
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={calendarOn} onChange={e => toggleCalendar(e.target.checked)} className="w-4 h-4 accent-violet-600" />
              <span>
                <span className="block text-sm font-bold text-gray-700">{tx.calendarLabel}</span>
                <span className="block text-xs text-gray-400">{tx.calendarHint}</span>
              </span>
            </label>
            <p className="text-xs text-gray-400 font-mono">/leagues/{league.slug}</p>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          <button onClick={handleSave} disabled={isPending}
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
            <Save size={14} /> {saved ? tx.saved : tx.save}
          </button>
        </div>
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
