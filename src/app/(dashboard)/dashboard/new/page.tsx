'use client'

import { useRef, useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { createTournamentWithSetup } from '@/app/actions/tournaments'
import { createChampionshipWithSetup, addSeasonWithSetup, getChampionshipTeams } from '@/app/actions/leagues'
import { getUserPlanAndAdmin } from '@/app/actions/billing'
import { uploadTournamentLogo, uploadTeamLogo, uploadTournamentCover, setTournamentCoverTheme, uploadLeagueLogo } from '@/app/actions/logos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft, ArrowRight, Camera, Plus, Trophy, X, Zap,
  Check, Settings2, RotateCcw, Crown, Layers, Star, Lock, Loader2,
} from 'lucide-react'
import Link from 'next/link'
import UpgradePrompt from '@/components/billing/UpgradePrompt'
import { SPORT_CATEGORIES, getSubtype, getSportTheme, getCategoryForSport, type SportTheme } from '@/lib/sports'
import TournamentCoverPicker from '@/components/tournament/TournamentCoverPicker'
import { getCoverStyle, isCoverThemeUrl } from '@/lib/cover-themes'

// ─── i18n ────────────────────────────────────────────────────────────────────
type Lang = 'ru' | 'kz' | 'en'

function getLang(): Lang {
  if (typeof document === 'undefined') return 'ru'
  const m = document.cookie.match(/(?:^|;\s*)lang=([^;]+)/)
  const v = m?.[1]
  return v === 'kz' || v === 'en' ? v : 'ru'
}

type WizardMode = 'tournament' | 'championship'
function getMode(): WizardMode {
  if (typeof window === 'undefined') return 'tournament'
  return new URLSearchParams(window.location.search).get('type') === 'championship'
    ? 'championship' : 'tournament'
}
function getLeagueParam(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('league')
}

// Championship-mode label overrides (only the strings that say "турнир")
const CHAMP = {
  ru: { back: 'Дашборд', titleNew: 'Новый чемпионат', create: 'Создать чемпионат', creating: 'Создаём…',
    errName: 'Введите название чемпионата', namePh: 'например: Городская лига Астаны',
    seasonLbl: 'Название первого сезона', seasonPh: 'например: Сезон 2025/26', logoLbl: 'Логотип чемпионата',
    seasonTitle: 'Новый сезон', seasonNameLbl: 'Название сезона', seasonCreate: 'Создать сезон', errSeason: 'Введите название сезона' },
  kz: { back: 'Дашборд', titleNew: 'Жаңа чемпионат', create: 'Чемпионат құру', creating: 'Құрылуда…',
    errName: 'Чемпионат атауын енгізіңіз', namePh: 'мысалы: Астана қалалық лигасы',
    seasonLbl: 'Бірінші маусым атауы', seasonPh: 'мысалы: 2025/26 маусымы', logoLbl: 'Чемпионат логотипі',
    seasonTitle: 'Жаңа маусым', seasonNameLbl: 'Маусым атауы', seasonCreate: 'Маусым құру', errSeason: 'Маусым атауын енгізіңіз' },
  en: { back: 'Dashboard', titleNew: 'New championship', create: 'Create championship', creating: 'Creating…',
    errName: 'Enter a championship name', namePh: 'e.g. Astana City League',
    seasonLbl: 'First season name', seasonPh: 'e.g. Season 2025/26', logoLbl: 'Championship logo',
    seasonTitle: 'New season', seasonNameLbl: 'Season name', seasonCreate: 'Create season', errSeason: 'Enter a season name' },
} as const

const T = {
  ru: {
    back: 'Мои турниры',
    steps: ['Название', 'Команды', 'Настройки', 'Старт'],
    step1: { title: 'Новый турнир', sub: 'Шаг 1 из 4 — основная информация' },
    step2: { title: 'Команды', sub: 'Шаг 2 из 4 — добавьте участников и логотипы' },
    step3: { title: 'Настройки', sub: 'Шаг 3 из 4 — параметры формата и правила матча' },
    step4: { title: 'Всё готово!', sub: 'Шаг 4 из 4 — подтвердите и запустите' },
    nameLbl: 'Название', namePh: 'например: Кубок компании 2026',
    sportLbl: 'Вид спорта',
    formatLbl: 'Формат',
    roundsLbl: 'Количество кругов',
    groupsLbl: 'Количество групп',
    advanceLbl: 'Выходят из группы',
    logoLbl: 'Логотип турнира', logoHint: 'Нажмите на аватар для загрузки.\nJPG, PNG, WebP — до 1 МБ.',
    periodsLbl: 'Таймы',
    extraTimeLbl: 'Доп. время',
    durationLbl: 'Длительность тайма', durationUnit: 'минут',
    pointsLbl: 'Система очков',
    pointsWin: 'Победа', pointsDraw: 'Ничья', pointsLoss: 'Пораж.',
    teamPh: (i: number) => `Команда ${i + 1}`,
    addTeam: 'Добавить ещё команду',
    next: 'Далее', back2: 'Назад', create: 'Создать турнир', creating: 'Создаём…',
    errName: 'Введите название турнира',
    errTeams: 'Добавьте минимум 2 команды',
    errDuplicates: 'Уберите команды с одинаковыми названиями',
    errTeamsMin: (n: number) => `Для этого формата нужно минимум ${n} команд`,
    errRatings: 'Укажите силу для каждой команды',
    seedingLbl: 'Посев команд',
    seedingRandom: 'Случайный жребий',
    seedingRandomDesc: 'Команды распределяются случайно',
    seedingSeeded: 'По силе команды',
    seedingSeededDesc: 'Сильные команды попадают в разные части сетки',
    ratingLabel: 'Сила',
    matchesHint: (teams: number, matches: number) => `${teams} команд — ${matches} матч${matches === 1 ? '' : matches <= 4 ? 'а' : 'ей'}`,
    scheduleHint: (matches: number) => `Расписание из ${matches} матч${matches === 1 ? 'а' : 'ей'} сгенерируется автоматически`,
    summary: { format: 'Формат', teams: 'команд', periods: 'Таймы', pts: 'Очки' },
    planLimit: {
      title: 'Лимит бесплатного плана',
      desc: 'На бесплатном плане можно создать до 3 турниров. Перейдите на Про для безлимитных турниров и команд до 64.',
      cta: 'Перейти на Про', dismiss: 'Закрыть',
    },
    teamLimit: {
      title: 'Лимит команд',
      desc: 'Бесплатный план — до 16 команд. Перейдите на Про для турниров до 64 команд.',
      cta: 'Перейти на Про', dismiss: 'Закрыть',
    },
    rounds: ['1 круг', '2 круга', '3 круга', '4 круга'],
    groups: ['2 группы', '4 группы', '6 групп', '8 групп'],
    advance: ['1 выходит', '2 выходят', '3 выходят', '4 выходят'],
    groupLegsLbl: 'Встречи в группе',
    groupLegsOpts: ['1 матч', '2 матча'],
    leagueTourLbl: 'Количество туров',
    leagueTourHint: 'Рекомендуется N−1 туров (N — количество команд)',
    leagueTourSmartHint: (teams: number) => `Рекомендуется ${teams - 1} туров для ${teams} команд`,
    leagueAdvanceLbl: 'Выходят в плей-офф',
    leagueAdvance: ['2 команды', '4 команды', '8 команд', '16 команд'],
    leagueSettingsLbl: 'Этап лиги',
    leagueSettingsNote: 'Количество туров и выход в плей-офф настроите на следующем шаге',
    groupSettingsLbl: 'Групповой этап',
    groupAdvanceNote: 'Выход из групп и количество матчей настроите на следующем шаге',
    groupsCompositionHint: (groups: number, perGroup: number) => `${groups} групп × до ${perGroup} команд в каждой`,
    playoffHint: (teams: number) => `${teams} команд — сетка на выбывание`,
    groupsHint: (teams: number, groups: number) => {
      const n = groups % 10
      const form = (n >= 2 && n <= 4) ? 'группы' : 'групп'
      return `${teams} команд — ${groups} ${form}`
    },
    leagueHint: (teams: number) => `${teams} команд — Лига + Плей-офф`,
  },
  kz: {
    back: 'Менің турнирларым',
    steps: ['Атауы', 'Командалар', 'Параметрлер', 'Старт'],
    step1: { title: 'Жаңа турнир', sub: '4-тен 1-қадам — негізгі ақпарат' },
    step2: { title: 'Командалар', sub: '4-тен 2-қадам — қатысушылар мен логотиптер' },
    step3: { title: 'Параметрлер', sub: '4-тен 3-қадам — формат параметрлері және матч ережелері' },
    step4: { title: 'Дайын!', sub: '4-тен 4-қадам — растаңыз және іске қосыңыз' },
    nameLbl: 'Атауы', namePh: 'мысалы: Компания кубогы 2026',
    sportLbl: 'Спорт түрі',
    formatLbl: 'Формат',
    roundsLbl: 'Айналым саны',
    groupsLbl: 'Топтар саны',
    advanceLbl: 'Топтан шығатындар',
    logoLbl: 'Турнир логотипі', logoHint: 'Аватарды басып жүктеңіз.\nJPG, PNG, WebP — 1 МБ дейін.',
    periodsLbl: 'Таймдар',
    extraTimeLbl: 'Қосымша уақыт',
    durationLbl: 'Тайм ұзақтығы', durationUnit: 'минут',
    pointsLbl: 'Ұпай жүйесі',
    pointsWin: 'Жеңіс', pointsDraw: 'Тең', pointsLoss: 'Жеңіліс',
    teamPh: (i: number) => `Команда ${i + 1}`,
    addTeam: 'Тағы команда қосу',
    next: 'Келесі', back2: 'Артқа', create: 'Турнир жасау', creating: 'Жасалуда…',
    errName: 'Турнир атауын енгізіңіз',
    errTeams: 'Кемінде 2 команда қосыңыз',
    errDuplicates: 'Бірдей атаулы командаларды алып тастаңыз',
    errTeamsMin: (n: number) => `Бұл формат үшін кемінде ${n} команда қажет`,
    errRatings: 'Әр команданың күшін көрсетіңіз',
    seedingLbl: 'Командаларды бөлу',
    seedingRandom: 'Кездейсоқ жеребе',
    seedingRandomDesc: 'Командалар кездейсоқ бөлінеді',
    seedingSeeded: 'Команда күші бойынша',
    seedingSeededDesc: 'Күшті командалар торлар/топтар бойынша бөлінеді',
    ratingLabel: 'Күш',
    matchesHint: (teams: number, matches: number) => `${teams} команда — ${matches} матч`,
    scheduleHint: (matches: number) => `${matches} матчтан тұратын кесте автоматты жасалады`,
    summary: { format: 'Формат', teams: 'команда', periods: 'Таймдар', pts: 'Ұпайлар' },
    planLimit: {
      title: 'Тегін жоспар шегі',
      desc: 'Тегін жоспарда 3 турнирге дейін жасауға болады. Про-ға өтіп, шексіз турнирлер мен 64 командаға дейін пайдаланыңыз.',
      cta: 'Про-ға өту', dismiss: 'Жабу',
    },
    teamLimit: {
      title: 'Команда шегі',
      desc: 'Тегін жоспар — 16 командаға дейін. Про-ға өтіп, 64 командаға дейін ойнаңыз.',
      cta: 'Про-ға өту', dismiss: 'Жабу',
    },
    rounds: ['1 айналым', '2 айналым', '3 айналым', '4 айналым'],
    groups: ['2 топ', '4 топ', '6 топ', '8 топ'],
    advance: ['1 шығады', '2 шығады', '3 шығады', '4 шығады'],
    groupLegsLbl: 'Топ ішіндегі кездесулер',
    groupLegsOpts: ['1 матч', '2 матч'],
    leagueTourLbl: 'Айналым саны',
    leagueTourHint: 'N−1 айналым ұсынылады (N — команда саны)',
    leagueTourSmartHint: (teams: number) => `${teams} команда үшін ${teams - 1} айналым ұсынылады`,
    leagueAdvanceLbl: 'Плей-оффқа шығатындар',
    leagueAdvance: ['2 команда', '4 команда', '8 команда', '16 команда'],
    leagueSettingsLbl: 'Лига кезеңі',
    leagueSettingsNote: 'Айналым саны мен плей-офф шығуын келесі қадамда баптайсыз',
    groupSettingsLbl: 'Топтық кезең',
    groupAdvanceNote: 'Топтан шығу және матч саны келесі қадамда баптайды',
    groupsCompositionHint: (groups: number, perGroup: number) => `${groups} топ × ${perGroup} командаға дейін`,
    playoffHint: (teams: number) => `${teams} команда — жою сеткасы`,
    groupsHint: (teams: number, groups: number) => `${teams} команда — ${groups} топ`,

    leagueHint: (teams: number) => `${teams} команда — Лига + Плей-офф`,
  },
  en: {
    back: 'My Tournaments',
    steps: ['Name', 'Teams', 'Settings', 'Launch'],
    step1: { title: 'New Tournament', sub: 'Step 1 of 4 — basic info' },
    step2: { title: 'Teams', sub: 'Step 2 of 4 — add participants and logos' },
    step3: { title: 'Settings', sub: 'Step 3 of 4 — format settings and match rules' },
    step4: { title: 'Ready!', sub: 'Step 4 of 4 — confirm and launch' },
    nameLbl: 'Name', namePh: 'e.g. Company Cup 2026',
    sportLbl: 'Sport type',
    formatLbl: 'Format',
    roundsLbl: 'Number of rounds',
    groupsLbl: 'Number of groups',
    advanceLbl: 'Teams advancing per group',
    logoLbl: 'Tournament logo', logoHint: 'Tap the avatar to upload.\nJPG, PNG, WebP — up to 1 MB.',
    periodsLbl: 'Periods',
    extraTimeLbl: 'Extra time',
    durationLbl: 'Period duration', durationUnit: 'min',
    pointsLbl: 'Points system',
    pointsWin: 'Win', pointsDraw: 'Draw', pointsLoss: 'Loss',
    teamPh: (i: number) => `Team ${i + 1}`,
    addTeam: 'Add another team',
    next: 'Next', back2: 'Back', create: 'Create tournament', creating: 'Creating…',
    errName: 'Enter a tournament name',
    errTeams: 'Add at least 2 teams',
    errDuplicates: 'Remove teams with duplicate names',
    errTeamsMin: (n: number) => `This format requires at least ${n} teams`,
    errRatings: 'Set the strength rating for every team',
    seedingLbl: 'Team seeding',
    seedingRandom: 'Random draw',
    seedingRandomDesc: 'Teams are distributed randomly',
    seedingSeeded: 'By team strength',
    seedingSeededDesc: 'Stronger teams are placed in different brackets or groups',
    ratingLabel: 'Strength',
    matchesHint: (teams: number, matches: number) => `${teams} teams — ${matches} match${matches === 1 ? '' : 'es'}`,
    scheduleHint: (matches: number) => `Schedule of ${matches} match${matches === 1 ? '' : 'es'} will generate automatically`,
    summary: { format: 'Format', teams: 'teams', periods: 'Periods', pts: 'Points' },
    planLimit: {
      title: 'Free plan limit',
      desc: 'The free plan allows up to 3 tournaments. Upgrade to Pro for unlimited tournaments and up to 64 teams.',
      cta: 'Upgrade to Pro', dismiss: 'Dismiss',
    },
    teamLimit: {
      title: 'Team limit',
      desc: 'Free plan allows up to 16 teams. Upgrade to Pro for tournaments with up to 64 teams.',
      cta: 'Upgrade to Pro', dismiss: 'Dismiss',
    },
    rounds: ['1 round', '2 rounds', '3 rounds', '4 rounds'],
    groups: ['2 groups', '4 groups', '6 groups', '8 groups'],
    advance: ['1 advances', '2 advance', '3 advance', '4 advance'],
    groupLegsLbl: 'Group legs',
    groupLegsOpts: ['1 match', '2 matches'],
    leagueTourLbl: 'Matchdays',
    leagueTourHint: 'Recommended: N−1 matchdays (N = number of teams)',
    leagueTourSmartHint: (teams: number) => `Recommended: ${teams - 1} matchdays for ${teams} teams`,
    leagueAdvanceLbl: 'Teams to playoff',
    leagueAdvance: ['2 teams', '4 teams', '8 teams', '16 teams'],
    leagueSettingsLbl: 'League stage',
    leagueSettingsNote: 'Matchdays and playoff advancement — configure in the next step',
    groupSettingsLbl: 'Group stage',
    groupAdvanceNote: 'Advancement and group legs — configure in the next step',
    groupsCompositionHint: (groups: number, perGroup: number) => `${groups} groups × up to ${perGroup} teams each`,
    playoffHint: (teams: number) => `${teams} teams — elimination bracket`,
    groupsHint: (teams: number, groups: number) => `${teams} teams — ${groups} groups`,
    leagueHint: (teams: number) => `${teams} teams — league table + playoff`,
  },
}

type Format = 'round_robin' | 'playoff' | 'groups_playoff' | 'league_playoff'

const FORMATS: { value: Format; icon: React.ElementType }[] = [
  { value: 'round_robin',    icon: RotateCcw },
  { value: 'playoff',        icon: Trophy    },
  { value: 'groups_playoff', icon: Layers    },
  { value: 'league_playoff', icon: Crown     },
]

const FORMAT_LABELS: Record<string, Record<Lang, string>> = {
  round_robin:    { ru: 'Круговой',              kz: 'Айналмалы',               en: 'Round-robin' },
  playoff:        { ru: 'Плей-офф',              kz: 'Плей-офф',                en: 'Playoff' },
  groups_playoff: { ru: 'Групповой + Плей-офф',  kz: 'Топтар + Плей-офф',       en: 'Groups + Playoff' },
  league_playoff: { ru: 'Лига + Плей-офф',       kz: 'Лига + Плей-офф',         en: 'League + Playoff' },
}

const FORMAT_DESCS: Record<string, Record<Lang, string>> = {
  round_robin:    { ru: 'Каждая команда играет с каждой. Идеально для лиг и чемпионатов.',           kz: 'Барлығы барлығымен ойнайды. Лигалар мен чемпионаттарға өте қолайлы.',   en: 'Every team plays each other. Ideal for leagues and championships.' },
  playoff:        { ru: 'Сетка на выбывание. Идеально для кубков и разовых турниров.',               kz: 'Жою сеткасы. Кубоктар мен бір реттік турнирлерге өте қолайлы.',         en: 'Elimination bracket. Perfect for cups and single-event tournaments.' },
  groups_playoff: { ru: 'Командки делятся на группы, потом лучшие встречаются в плей-офф.',          kz: 'Командалар топтарға бөлінеді, содан кейін үздіктер плей-оффта кездеседі.', en: 'Teams split into groups, then the best meet in a playoff bracket.' },
  league_playoff: { ru: 'Все играют в единой таблице, топ команды выходят в плей-офф.',             kz: 'Барлығы бір кестеде ойнайды, үздік командалар плей-оффқа шығады.',      en: 'All teams play in one table, top teams advance to playoff bracket.' },
}

// ─── Image helpers ────────────────────────────────────────────────────────────
function resizeToDataUrl(file: File, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size; canvas.height = size
      const ctx = canvas.getContext('2d')!
      const side = Math.min(img.width, img.height)
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/webp', 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}

function AvatarPicker({ dataUrl, name, size, onPick, onRemove }: {
  dataUrl: string | null; name: string; size: number
  onPick: (dataUrl: string) => void; onRemove?: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const initials = name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'
  const fontSize = Math.max(8, Math.floor(size * 0.38))

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    onPick(await resizeToDataUrl(file, 200))
  }

  return (
    <div className="relative inline-block flex-shrink-0">
      <button type="button" onClick={() => inputRef.current?.click()}
        className="block rounded-full overflow-hidden border-2 border-dashed border-gray-300 hover:border-emerald-400 transition-colors">
        {dataUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={dataUrl} alt={name} style={{ width: size, height: size }} className="object-cover" />
          : <span className="rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center select-none"
              style={{ width: size, height: size, fontSize }}>{initials}</span>}
      </button>
      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center shadow pointer-events-none">
        <Camera size={10} className="text-white" />
      </span>
      {dataUrl && onRemove && (
        <button type="button" onClick={e => { e.stopPropagation(); onRemove() }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 shadow">
          <X size={8} className="text-white" />
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
    </div>
  )
}

// ─── StepBar ─────────────────────────────────────────────────────────────────
function StepBar({ step, labels, accent }: { step: number; labels: readonly string[]; accent: string }) {
  return (
    <div className="mb-8">
      {/* circles + connectors — single row, perfectly centred */}
      <div className="flex items-center">
        {labels.map((_, i) => {
          const done = step > i + 1
          const current = step === i + 1
          return (
            <Fragment key={i}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 transition-all ${done || current ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                style={done || current
                  ? { background: accent, boxShadow: current ? `0 0 0 4px ${accent}22` : undefined }
                  : undefined}
              >
                {done ? <Check size={14} /> : i + 1}
              </div>
              {i < labels.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 transition-colors" style={{ background: done ? accent : '#e5e7eb' }} />
              )}
            </Fragment>
          )
        })}
      </div>
      {/* labels — separate row, visible sm+ only */}
      <div className="hidden sm:flex mt-2">
        {labels.map((label, i) => {
          const current = step === i + 1
          return (
            <Fragment key={i}>
              <div className="w-8 flex justify-center">
                <span className="text-xs font-bold whitespace-nowrap" style={current ? { color: accent } : { color: '#9ca3af' }}>
                  {label}
                </span>
              </div>
              {i < labels.length - 1 && <div className="flex-1 mx-1" />}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

// ─── Plan limit modal ─────────────────────────────────────────────────────────
function PlanLimitModal({ type, tx, onClose }: {
  type: 'tournament' | 'team'
  tx: typeof T['ru']
  onClose: () => void
}) {
  const info = type === 'tournament' ? tx.planLimit : tx.teamLimit
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
          <Star className="w-6 h-6 text-amber-500" fill="currentColor" />
        </div>
        <div>
          <h3 className="font-black text-gray-900 text-lg mb-1">{info.title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{info.desc}</p>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            {info.dismiss}
          </button>
          <a href="/checkout"
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors text-center">
            {info.cta}
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NewTournamentPage() {
  const router = useRouter()
  const lang = getLang()
  const tx = T[lang]
  const [mode] = useState<WizardMode>(getMode)
  const [leagueId] = useState<string | null>(getLeagueParam)
  const isChampionship = mode === 'championship'
  const isAddSeason = isChampionship && !!leagueId  // adding a season to an existing championship
  const champTx = CHAMP[lang]

  // Plan
  const [isPro, setIsPro] = useState(false)
  const [isEnterprise, setIsEnterprise] = useState(false)
  const [upgradeFor, setUpgradeFor] = useState<string | null>(null)
  useEffect(() => {
    getUserPlanAndAdmin().then(({ plan }) => {
      setIsPro(plan === 'pro' || plan === 'enterprise')
      setIsEnterprise(plan === 'enterprise')
    })
  }, [])

  // First-season name (championship mode only)
  const [seasonName, setSeasonName] = useState('Сезон 2025/26')

  // Step 1
  const [name, setName]           = useState('')
  const [sport, setSport]         = useState<string>('football')
  const [format, setFormat]       = useState<Format>('round_robin')
  const [numRounds, setNumRounds] = useState(2)   // round_robin: circles | league_playoff: matchdays | groups_playoff: legs
  const [groupsCount, setGroupsCount] = useState(4)
  const [teamsAdvance, setTeamsAdvance] = useState(2)  // groups_playoff: per-group | league_playoff: total
  const [sheetFormat, setSheetFormat] = useState<Format | null>(null)  // open format bottom-sheet
  const [sportSheet, setSportSheet]   = useState<string | null>(null)  // open subtype sheet (category id)

  function changeFormat(newFormat: Format) {
    setFormat(newFormat)
    // Seeding is meaningless in a full round-robin — reset to random draw.
    if (newFormat === 'round_robin') setSeedingMode('random')
    if (newFormat === 'round_robin')    { setNumRounds(2); setTeamsAdvance(2) }
    if (newFormat === 'league_playoff') { setNumRounds(5); setTeamsAdvance(8) }
    if (newFormat === 'groups_playoff') { setNumRounds(1); setTeamsAdvance(2); setGroupsCount(4) }
    if (newFormat === 'playoff')        { setNumRounds(1) }
  }

  // Pick a sport subtype: store its value, apply match defaults and the sport's
  // recommended format (formats adapt to the chosen sport).
  function selectSubtype(value: string) {
    const st = getSubtype(value)
    if (!st) return
    setSport(value)
    setMatchPeriods(st.periods)
    setDurationMins(st.duration)
    setExtraTime(st.extraTime)
    setPointsWin(st.pts.win)
    setPointsDraw(st.pts.draw)
    setPointsLoss(st.pts.loss)
    changeFormat(st.recommendedFormat)
  }

  // Step 2
  const [teamNames, setTeamNames] = useState<string[]>(['', ''])
  const [teamLogos, setTeamLogos] = useState<(string | null)[]>([null, null])
  const [seedingMode, setSeedingMode] = useState<'random' | 'seeded'>('random')
  const [teamRatings, setTeamRatings] = useState<(number | null)[]>([null, null])
  const lastInputRef = useRef<HTMLInputElement>(null)

  // Step 3
  const [tournamentLogo, setTournamentLogo] = useState<string | null>(null)
  const [coverValue, setCoverValue] = useState<string | null>(null)
  const [matchPeriods, setMatchPeriods]     = useState(2)
  const [extraTime, setExtraTime]           = useState(false)
  const [durationMins, setDurationMins]     = useState(45)
  const [pointsWin, setPointsWin]           = useState(3)
  const [pointsDraw, setPointsDraw]         = useState(1)
  const [pointsLoss, setPointsLoss]         = useState(0)

  const [step, setStep]         = useState(1)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [planLimit, setPlanLimit] = useState<'tournament' | 'team' | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  // Add-season mode: prefill teams from the championship's persistent roster
  useEffect(() => {
    if (!isAddSeason || !leagueId) return
    getChampionshipTeams(leagueId).then(teams => {
      if (teams.length >= 2) {
        setTeamNames(teams.map(t => t.name))
        setTeamLogos(teams.map(t => t.logo_url))
        setTeamRatings(teams.map(() => null))
      }
    })
  }, [isAddSeason, leagueId])

  // ── Derived sport config + colour theme ──────────────────────────────────────
  const subtype = getSubtype(sport)
  const theme: SportTheme = getSportTheme(sport)
  // CSS variables let us tint Tailwind-styled elements with the sport colour.
  const themeVars = {
    ['--sp' as string]:  theme.primary,
    ['--spd' as string]: theme.primaryDark,
    ['--spl' as string]: theme.light,
    ['--spr' as string]: theme.ringRgba,
  } as React.CSSProperties
  // Formats ordered & filtered to those practised in the chosen sport.
  const sportFormats: Format[] = subtype?.formats ?? ['round_robin', 'playoff', 'groups_playoff', 'league_playoff']
  // Settings labels driven by the chosen subtype.
  const periodLabelTxt   = subtype?.periodLabel[lang]   ?? tx.periodsLbl
  const durationLabelTxt = subtype?.durationLabel[lang] ?? tx.durationLbl
  const periodOptions    = subtype?.periodOptions ?? [1, 2]
  const isSetBased       = subtype?.hideDuration ?? false   // sets/maps based → hide duration & extra time
  const scoreNoteTxt     = subtype?.scoreNote?.[lang]

  // ── Min-teams per format ────────────────────────────────────────────────────
  function minTeamsRequired(): number {
    if (format === 'playoff') return 4
    if (format === 'groups_playoff') return groupsCount * 3
    return 2 // round_robin, league_playoff
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  function goToStep2() {
    if (!name.trim()) { setError(isChampionship ? champTx.errName : tx.errName); return }
    setError(null); setStep(2)
  }
  // Confirm format choice from the bottom sheet, then advance
  function confirmFormatSheet() {
    setSheetFormat(null)
    if (!name.trim()) { setError(isChampionship ? champTx.errName : tx.errName); return }
    setError(null); setStep(2)
  }
  function goToStep3() {
    if (hasDuplicates) { setError(tx.errDuplicates); return }
    const min = minTeamsRequired()
    if (filledTeams.length < min) {
      setError(min === 2 ? tx.errTeams : tx.errTeamsMin(min))
      return
    }
    if (seedingMode === 'seeded') {
      const missingRating = teamNames.some((n, i) => n.trim() && teamRatings[i] === null)
      if (missingRating) { setError(tx.errRatings); return }
    }
    // Smart default: for league_playoff set N-1 matchdays based on actual team count
    if (format === 'league_playoff' && numRounds === 5 && filledTeams.length >= 2) {
      setNumRounds(filledTeams.length - 1)
    }
    // Bug fix: teamsAdvance must be less than total teams
    if (format === 'league_playoff' && teamsAdvance >= filledTeams.length) {
      const validOpts = [2, 4, 8, 16].filter(v => v < filledTeams.length)
      setTeamsAdvance(validOpts.length > 0 ? validOpts[validOpts.length - 1] : 2)
    }
    setError(null); setStep(3)
  }
  function goToStep4() { setError(null); setStep(4) }

  // ── Team helpers ───────────────────────────────────────────────────────────
  const updateTeam = (i: number, val: string) => setTeamNames(prev => prev.map((n, j) => j === i ? val : n))
  function addTeamField() {
    setTeamNames(prev => [...prev, ''])
    setTeamLogos(prev => [...prev, null])
    setTeamRatings(prev => [...prev, null])
    setTimeout(() => lastInputRef.current?.focus(), 50)
  }
  function removeTeam(i: number) {
    setTeamNames(prev => prev.filter((_, j) => j !== i))
    setTeamLogos(prev => prev.filter((_, j) => j !== i))
    setTeamRatings(prev => prev.filter((_, j) => j !== i))
  }
  const setTeamLogo = (i: number, dataUrl: string | null) =>
    setTeamLogos(prev => prev.map((l, j) => j === i ? dataUrl : l))
  const setTeamRating = (i: number, rating: number) =>
    setTeamRatings(prev => prev.map((r, j) => j === i ? rating : r))

  const filledTeams = teamNames.filter(n => n.trim())

  // Duplicate detection: find indices with non-unique names (case-insensitive)
  const nameCounts = new Map<string, number[]>()
  teamNames.forEach((n, i) => {
    if (!n.trim()) return
    const key = n.trim().toLowerCase()
    if (!nameCounts.has(key)) nameCounts.set(key, [])
    nameCounts.get(key)!.push(i)
  })
  const duplicateIndices = new Set<number>()
  nameCounts.forEach(indices => { if (indices.length > 1) indices.forEach(i => duplicateIndices.add(i)) })
  const hasDuplicates = duplicateIndices.size > 0

  const matchCount = format === 'round_robin' && filledTeams.length >= 2
    ? Math.floor(filledTeams.length * (filledTeams.length - 1) / 2) * numRounds
    : 0

  const teamsHint = (() => {
    if (!filledTeams.length) return ''
    if (format === 'round_robin')    return tx.matchesHint(filledTeams.length, matchCount)
    if (format === 'playoff')        return tx.playoffHint(filledTeams.length)
    if (format === 'groups_playoff') return tx.groupsHint(filledTeams.length, groupsCount)
    if (format === 'league_playoff') return tx.leagueHint(filledTeams.length)
    return tx.matchesHint(filledTeams.length, matchCount)
  })()

  // ── Create ─────────────────────────────────────────────────────────────────
  async function handleCreate() {
    setLoading(true); setError(null)

    // If seeded mode: sort teams by rating desc so strong teams go into separate
    // groups/brackets during schedule generation
    let orderedNames = teamNames
    let orderedLogos = teamLogos
    if (seedingMode === 'seeded') {
      const indexed = teamNames.map((n, i) => ({ name: n, logo: teamLogos[i], rating: teamRatings[i] ?? 0 }))
      indexed.sort((a, b) => b.rating - a.rating)
      orderedNames = indexed.map(x => x.name)
      orderedLogos = indexed.map(x => x.logo)
    }

    const settings = {
      matchPeriods, extraTime, matchDurationMins: durationMins,
      pointsWin, pointsDraw, pointsLoss,
      groupsCount, teamsAdvance, sport,
    }

    // Add-season mode: create a new season (tournament) inside an existing championship
    if (isAddSeason && leagueId) {
      const res = await addSeasonWithSetup(leagueId, format, numRounds, orderedNames, name, settings)
      if (res.error) { setError(res.error); setLoading(false); return }
      const tournamentId = res.tournamentId!
      const teamIds = res.teamIds ?? []
      const uploads: Promise<unknown>[] = []
      orderedNames.map((n, i) => ({ name: n.trim(), origIdx: i }))
        .filter(({ name }) => !!name)
        .forEach(({ origIdx }, teamIdx) => {
          const logoDataUrl = orderedLogos[origIdx]
          const teamId = teamIds[teamIdx]
          // Only upload freshly-picked images; prefilled logos are existing URLs
          if (logoDataUrl?.startsWith('data:') && teamId) uploads.push(uploadTeamLogo(teamId, tournamentId, logoDataUrl))
        })
      if (uploads.length > 0) { try { await Promise.all(uploads) } catch {} }
      router.push(`/dashboard/leagues/${leagueId}`)
      return
    }

    // Championship mode: create league + first season, then go to the championship page
    if (isChampionship) {
      const res = await createChampionshipWithSetup(name, format, numRounds, orderedNames, seasonName, settings)
      if (res.error) { setError(res.error); setLoading(false); return }
      const newLeagueId = res.leagueId!
      const tournamentId = res.tournamentId!
      const teamIds = res.teamIds ?? []

      const uploads: Promise<unknown>[] = []
      if (tournamentLogo) {
        uploads.push(uploadLeagueLogo(newLeagueId, tournamentLogo))
        uploads.push(uploadTournamentLogo(tournamentId, tournamentLogo))
      }
      orderedNames.map((n, i) => ({ name: n.trim(), origIdx: i }))
        .filter(({ name }) => !!name)
        .forEach(({ origIdx }, teamIdx) => {
          const logoDataUrl = orderedLogos[origIdx]
          const teamId = teamIds[teamIdx]
          if (logoDataUrl && teamId) uploads.push(uploadTeamLogo(teamId, tournamentId, logoDataUrl))
        })
      if (uploads.length > 0) { try { await Promise.all(uploads) } catch {} }
      router.push(`/dashboard/leagues/${newLeagueId}`)
      return
    }

    const result = await createTournamentWithSetup(name, format, numRounds, orderedNames, settings)

    if (result.error === 'PLAN_LIMIT_TOURNAMENTS') { setPlanLimit('tournament'); setLoading(false); return }
    if (result.error === 'PLAN_LIMIT_TEAMS')        { setPlanLimit('team');       setLoading(false); return }
    if (result.error) { setError(result.error); setLoading(false); return }

    const tournamentId = result.id!
    const teamIds = result.teamIds ?? []

    const uploads: Promise<unknown>[] = []
    if (tournamentLogo) uploads.push(uploadTournamentLogo(tournamentId, tournamentLogo))
    if (coverValue) {
      if (isCoverThemeUrl(coverValue)) {
        uploads.push(setTournamentCoverTheme(tournamentId, coverValue.slice(6)))
      } else {
        uploads.push(uploadTournamentCover(tournamentId, coverValue))
      }
    }

    orderedNames.map((n, i) => ({ name: n.trim(), origIdx: i }))
      .filter(({ name }) => !!name)
      .forEach(({ origIdx }, teamIdx) => {
        const logoDataUrl = orderedLogos[origIdx]
        const teamId = teamIds[teamIdx]
        if (logoDataUrl && teamId) uploads.push(uploadTeamLogo(teamId, tournamentId, logoDataUrl))
      })

    // Await logo uploads before navigating so the tournament page shows logos on first load.
    // Uploads are fast (small images); errors are silently ignored — tournament already exists.
    if (uploads.length > 0) {
      try { await Promise.all(uploads) } catch {}
    }
    router.push(`/dashboard/tournament/${tournamentId}`)
  }

  const fmtLabel = (v: Format) => FORMAT_LABELS[v][lang]
  const fmtDesc  = (v: Format) => FORMAT_DESCS[v][lang]

  const ROUNDS_OPTS = tx.rounds.map((label, i) => ({ value: i + 1, label }))
  const GROUPS_OPTS = [2, 4, 6, 8].map((v, i) => ({ value: v, label: tx.groups[i] }))
  const ADVANCE_OPTS = [1, 2, 3, 4].map((v, i) => ({ value: v, label: tx.advance[i] }))
  const LEAGUE_ADVANCE_OPTS = [2, 4, 8, 16].map((v, i) => ({ value: v, label: tx.leagueAdvance[i] }))

  return (
    <div className="max-w-lg mx-auto" style={themeVars}>
      {/* Sport-themed buttons: background driven by CSS vars set above */}
      <style>{`.sport-btn{background:var(--sp)}.sport-btn:hover{background:var(--spd)}@keyframes sheet-up{0%{transform:translateY(100%)}100%{transform:translateY(0)}}@keyframes sheet-fade{0%{opacity:0}100%{opacity:1}}`}</style>
      {planLimit && <PlanLimitModal type={planLimit} tx={tx} onClose={() => setPlanLimit(null)} />}
      {upgradeFor && <UpgradePrompt featureName={`Формат "${upgradeFor}"`} onClose={() => setUpgradeFor(null)} />}

      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
        <ArrowLeft size={15} /> {isChampionship ? champTx.back : tx.back}
      </Link>

      <StepBar step={step} labels={tx.steps} accent={theme.primary} />

      {/* ── Step 1: Name & Format ──────────────────────────────────────── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <h1 className="text-xl font-black text-gray-900">{isAddSeason ? champTx.seasonTitle : isChampionship ? champTx.titleNew : tx.step1.title}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{tx.step1.sub}</p>
          </div>

          {/* ── Sport category (premium · two-level → subtype sheet) ── */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">{tx.sportLbl}</label>
            <div className="grid grid-cols-2 gap-2">
              {SPORT_CATEGORIES.map(cat => {
                const active = getCategoryForSport(sport)?.id === cat.id
                const locked = cat.proOnly && !isPro
                const chosen = active ? getSubtype(sport) : undefined
                return (
                  <button key={cat.id} type="button"
                    onClick={() => {
                      if (locked) { setUpgradeFor(cat.label[lang]); return }
                      setSportSheet(cat.id)
                    }}
                    style={active ? { borderColor: cat.theme.primary, background: cat.theme.light } : undefined}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                      active ? '' : locked ? 'border-gray-200 bg-gray-50 opacity-70 hover:opacity-90' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                    {/* icon + PRO badge stacked vertically */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center text-white shadow-sm p-1.5"
                        style={{ background: cat.theme.gradient }}>
                        <cat.icon size={18} className="w-full h-full" />
                      </div>
                      {locked && (
                        <span className="flex items-center gap-0.5 text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded-full whitespace-nowrap">
                          <Lock size={8} /> PRO
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold leading-tight" style={active ? { color: cat.theme.primary } : undefined}>{cat.label[lang]}</p>
                      <p className="text-[11px] text-gray-400 leading-snug line-clamp-2 mt-0.5">{chosen ? chosen.label[lang] : cat.tagline[lang]}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 pt-0.5">Выберите вид спорта — правила и форматы подстроятся автоматически</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">{isAddSeason ? champTx.seasonNameLbl : tx.nameLbl}</label>
            <Input value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && goToStep2()}
              placeholder={isAddSeason ? champTx.seasonPh : isChampionship ? champTx.namePh : tx.namePh} maxLength={40} className="text-base" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">{tx.formatLbl}</label>
            <div className="grid grid-cols-2 gap-2">
              {sportFormats.map(value => {
                const Icon = FORMATS.find(f => f.value === value)!.icon
                const active = format === value
                const isProOnly = value === 'groups_playoff' || value === 'league_playoff'
                const locked = isProOnly && !isPro
                return (
                  <button key={value} type="button"
                    onClick={() => {
                      if (locked) { setUpgradeFor(fmtLabel(value)); return }
                      changeFormat(value)
                      setSheetFormat(value)   // open details bottom-sheet
                    }}
                    style={active ? { borderColor: theme.primary, background: theme.light } : undefined}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                      active ? ''
                      : locked ? 'border-gray-200 bg-gray-50 opacity-70 hover:opacity-90'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                    {/* icon + optional PRO badge */}
                    <div className="flex flex-col items-start gap-1 mb-2">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${active ? '' : locked ? 'bg-gray-200' : 'bg-gray-100'}`}
                        style={active ? { background: theme.primary } : undefined}>
                        <Icon size={17} className={active ? 'text-white' : locked ? 'text-gray-400' : 'text-gray-500'} />
                      </div>
                      {locked && (
                        <span className="flex items-center gap-0.5 text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                          <Lock size={8} /> PRO
                        </span>
                      )}
                    </div>
                    {/* name */}
                    <p className="text-sm font-bold leading-tight"
                      style={active ? { color: theme.primary } : undefined}>
                      <span className={locked ? 'text-gray-400' : ''}>{fmtLabel(value)}</span>
                    </p>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 pt-0.5">Нажмите на формат, чтобы увидеть описание и продолжить</p>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
          <Button onClick={goToStep2} className="sport-btn w-full h-11 text-base font-bold text-white">
            {tx.next} <ArrowRight size={16} className="ml-2" />
          </Button>

          {/* ── Format details bottom-sheet ─────────────────────────────── */}
          {sheetFormat && (() => {
            const SheetIcon = FORMATS.find(f => f.value === sheetFormat)!.icon
            return (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                <style>{`@keyframes sheet-up{0%{transform:translateY(100%)}100%{transform:translateY(0)}}@keyframes sheet-fade{0%{opacity:0}100%{opacity:1}}`}</style>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" style={{ animation: 'sheet-fade .2s ease-out' }} onClick={() => setSheetFormat(null)} />
                <div
                  className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border-t border-gray-100 p-6 pb-8 max-h-[88vh] overflow-y-auto"
                  style={{ animation: 'sheet-up .3s cubic-bezier(.2,.8,.2,1)' }}
                >
                  {/* Drag handle (mobile) */}
                  <div className="sm:hidden flex justify-center -mt-2 mb-4"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>

                  {/* Close */}
                  <button onClick={() => setSheetFormat(null)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                    <X size={15} />
                  </button>

                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: theme.gradient }}>
                      <SheetIcon size={22} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.primary }}>{tx.formatLbl}</p>
                      <h3 className="text-lg font-black text-gray-900 leading-tight">{fmtLabel(sheetFormat)}</h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-500 leading-relaxed mb-5">{fmtDesc(sheetFormat)}</p>

                  {/* Format-specific options */}
                  {sheetFormat === 'round_robin' && (
                    <div className="space-y-1.5 mb-5">
                      <label className="text-sm font-bold text-gray-700">{tx.roundsLbl}</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ROUNDS_OPTS.map(opt => (
                          <button key={opt.value} type="button" onClick={() => setNumRounds(opt.value)}
                            style={numRounds === opt.value ? { borderColor: theme.primary, background: theme.light, color: theme.primary } : undefined}
                            className={`py-2.5 px-3 rounded-xl border text-left text-sm transition-all ${
                              numRounds === opt.value ? 'font-bold' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {sheetFormat === 'league_playoff' && (
                    <div className="rounded-xl px-4 py-3 text-xs flex items-center gap-2 mb-5" style={{ background: theme.light, color: theme.primaryDark }}>
                      <Settings2 size={13} className="shrink-0 opacity-70" />
                      <span>{tx.leagueSettingsNote}</span>
                    </div>
                  )}

                  {sheetFormat === 'groups_playoff' && (
                    <div className="space-y-3 mb-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700">{tx.groupsLbl}</label>
                        <div className="flex flex-wrap gap-1.5">
                          {GROUPS_OPTS.map(opt => (
                            <button key={opt.value} type="button" onClick={() => setGroupsCount(opt.value)}
                              style={groupsCount === opt.value ? { borderColor: theme.primary, background: theme.light, color: theme.primary } : undefined}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                groupsCount === opt.value ? '' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl px-4 py-3 text-xs flex items-center gap-2" style={{ background: theme.light, color: theme.primaryDark }}>
                        <Settings2 size={13} className="shrink-0 opacity-70" />
                        <span>{tx.groupAdvanceNote}</span>
                      </div>
                    </div>
                  )}

                  {/* Continue */}
                  <Button onClick={confirmFormatSheet} className="sport-btn w-full h-12 text-base font-bold text-white">
                    {tx.next} <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </div>
            )
          })()}

          {/* ── Sport subtype bottom-sheet ─────────────────────────────── */}
          {sportSheet && (() => {
            const cat = SPORT_CATEGORIES.find(c => c.id === sportSheet)!
            return (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" style={{ animation: 'sheet-fade .2s ease-out' }} onClick={() => setSportSheet(null)} />
                <div
                  className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border-t border-gray-100 p-6 pb-8 max-h-[88vh] overflow-y-auto"
                  style={{ animation: 'sheet-up .3s cubic-bezier(.2,.8,.2,1)' }}
                >
                  <div className="sm:hidden flex justify-center -mt-2 mb-4"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
                  <button onClick={() => setSportSheet(null)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                    <X size={15} />
                  </button>

                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 shadow-sm text-white p-2" style={{ background: cat.theme.gradient }}>
                      <cat.icon size={22} className="w-full h-full" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: cat.theme.primary }}>{tx.sportLbl}</p>
                      <h3 className="text-lg font-black text-gray-900 leading-tight">{cat.label[lang]}</h3>
                    </div>
                  </div>

                  {/* Subtypes */}
                  <div className="space-y-2">
                    {cat.subtypes.map(st => {
                      const active = sport === st.value
                      return (
                        <button key={st.value} type="button"
                          onClick={() => { selectSubtype(st.value); setSportSheet(null) }}
                          style={active ? { borderColor: cat.theme.primary, background: cat.theme.light } : undefined}
                          className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${active ? '' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                          <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: active ? cat.theme.primary : '#d1d5db' }} />
                          <div className="min-w-0">
                            <p className="text-sm font-bold leading-tight" style={{ color: active ? cat.theme.primary : '#1f2937' }}>{st.label[lang]}</p>
                            <p className="text-xs text-gray-400 leading-snug mt-0.5">{st.desc[lang]}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Step 2: Teams ─────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <h1 className="text-xl font-black text-gray-900">{tx.step2.title}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{tx.step2.sub}</p>
          </div>

          {/* ── Seeding mode toggle ───────────────────────────────────── */}
          {/* Hidden for round-robin: there everyone plays everyone, so seeding
              changes only the order of matchdays — not who meets whom. It matters
              only for bracket/group draws (playoff, groups, league). */}
          {format !== 'round_robin' && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-gray-700">{tx.seedingLbl}</p>
              <div className="grid grid-cols-2 gap-2">
                {(['random', 'seeded'] as const).map(mode => {
                  const active = seedingMode === mode
                  const label = mode === 'random' ? tx.seedingRandom : tx.seedingSeeded
                  const desc  = mode === 'random' ? tx.seedingRandomDesc : tx.seedingSeededDesc
                  return (
                    <button key={mode} type="button" onClick={() => setSeedingMode(mode)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        active ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                      <p className={`text-sm font-bold ${active ? 'text-emerald-700' : 'text-gray-800'}`}>{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-snug">{desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Team list ─────────────────────────────────────────────── */}
          <div className="space-y-2">
            {teamNames.map((val, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-center text-xs font-black text-gray-400 shrink-0 select-none">{i + 1}</span>
                <AvatarPicker dataUrl={teamLogos[i]} name={val || tx.teamPh(i)} size={36}
                  onPick={dataUrl => setTeamLogo(i, dataUrl)} onRemove={() => setTeamLogo(i, null)} />
                <Input ref={i === teamNames.length - 1 ? lastInputRef : undefined}
                  value={val} onChange={e => updateTeam(i, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addTeamField() }}
                  placeholder={tx.teamPh(i)} maxLength={30}
                  className={`flex-1 ${duplicateIndices.has(i) ? 'border-red-400 focus:border-red-400 bg-red-50' : ''}`} />
                {/* Rating picker (visible only in seeded mode) */}
                {seedingMode === 'seeded' && (
                  <div className={`flex items-center gap-0.5 shrink-0 rounded p-0.5 transition-all ${
                    teamRatings[i] === null && val.trim()
                      ? 'ring-1 ring-amber-400 ring-dashed'
                      : ''
                  }`}>
                    {([
                      { active: 'bg-red-500 text-white',    inactive: 'bg-gray-100 text-gray-400 hover:bg-red-100'    },
                      { active: 'bg-orange-500 text-white', inactive: 'bg-gray-100 text-gray-400 hover:bg-orange-100' },
                      { active: 'bg-amber-400 text-white',  inactive: 'bg-gray-100 text-gray-400 hover:bg-amber-100'  },
                      { active: 'bg-lime-500 text-white',   inactive: 'bg-gray-100 text-gray-400 hover:bg-lime-100'   },
                      { active: 'bg-emerald-500 text-white',inactive: 'bg-gray-100 text-gray-400 hover:bg-emerald-100'},
                    ] as const).map((colors, idx) => {
                      const star = idx + 1
                      const rating = teamRatings[i]
                      return (
                        <button key={star} type="button" onClick={() => setTeamRating(i, star)}
                          className={`w-5 h-5 rounded text-[10px] font-black transition-colors ${
                            rating !== null && rating >= star ? colors.active : colors.inactive
                          }`}>
                          {star}
                        </button>
                      )
                    })}
                  </div>
                )}
                {teamNames.length > 2 && (
                  <button onClick={() => removeTeam(i)} className="text-gray-300 hover:text-red-400 transition-colors p-1 shrink-0">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addTeamField}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-600 transition-colors py-1 ml-11">
              <Plus size={14} /> {tx.addTeam}
            </button>
          </div>

          {filledTeams.length >= minTeamsRequired() && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
              <Zap size={14} className="shrink-0" />
              <span className="font-medium">{teamsHint}</span>
            </div>
          )}
          {filledTeams.length < minTeamsRequired() && filledTeams.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
              <Zap size={14} className="shrink-0 opacity-70" />
              <span className="font-medium">{tx.errTeamsMin(minTeamsRequired())}</span>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setError(null); setStep(1) }} className="flex-1 h-11 whitespace-nowrap">
              <ArrowLeft size={15} className="mr-1.5" /> {tx.back2}
            </Button>
            <Button onClick={goToStep3} className="sport-btn flex-1 h-11 text-white font-bold whitespace-nowrap">
              {tx.next} <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Settings ──────────────────────────────────────────── */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Settings2 size={20} className="text-emerald-600" /> {tx.step3.title}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{tx.step3.sub}</p>
          </div>

          {/* Format-specific settings (moved here so team count is known) */}
          {format === 'league_playoff' && (
            <div className="space-y-4 border-b border-gray-100 pb-5">
              <p className="text-sm font-black text-gray-800">{tx.leagueSettingsLbl}</p>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">{tx.leagueTourLbl}</label>
                <p className="text-xs text-emerald-600 font-medium">
                  {filledTeams.length >= 2
                    ? tx.leagueTourSmartHint(filledTeams.length)
                    : tx.leagueTourHint}
                </p>
                <Input type="number" min={1} value={numRounds}
                  onChange={e => setNumRounds(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 text-center font-mono font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">{tx.leagueAdvanceLbl}</label>
                <div className="flex flex-wrap gap-1.5">
                  {LEAGUE_ADVANCE_OPTS.filter(opt => opt.value < filledTeams.length).map(opt => (
                    <button key={opt.value} type="button" onClick={() => setTeamsAdvance(opt.value)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        teamsAdvance === opt.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                  {LEAGUE_ADVANCE_OPTS.filter(opt => opt.value < filledTeams.length).length === 0 && (
                    <p className="text-xs text-amber-600">Добавьте больше команд для настройки плей-офф</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {format === 'groups_playoff' && (
            <div className="space-y-4 border-b border-gray-100 pb-5">
              <p className="text-sm font-black text-gray-800">{tx.groupSettingsLbl}</p>
              {filledTeams.length >= groupsCount && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 text-sm text-emerald-700 font-medium">
                  {tx.groupsCompositionHint(groupsCount, Math.ceil(filledTeams.length / groupsCount))}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">{tx.advanceLbl}</label>
                <div className="flex flex-wrap gap-1.5">
                  {ADVANCE_OPTS.map(opt => (
                    <button key={opt.value} type="button" onClick={() => setTeamsAdvance(opt.value)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        teamsAdvance === opt.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">{tx.groupLegsLbl}</label>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2].map((legs, i) => (
                    <button key={legs} type="button" onClick={() => setNumRounds(legs)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        numRounds === legs
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {tx.groupLegsOpts[i]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Championship: first season name (not in add-season mode — there the name field is the season) */}
          {isChampionship && !isAddSeason && (
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700">{champTx.seasonLbl}</label>
              <Input value={seasonName} onChange={e => setSeasonName(e.target.value)}
                placeholder={champTx.seasonPh} maxLength={40} className="text-base" />
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-bold text-gray-700">{isChampionship ? champTx.logoLbl : tx.logoLbl}</p>
            <div className="flex items-center gap-4">
              <AvatarPicker dataUrl={tournamentLogo} name={name} size={64}
                onPick={setTournamentLogo} onRemove={() => setTournamentLogo(null)} />
              <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line">{tx.logoHint}</p>
            </div>
          </div>

          {/* Cover / banner — tournament only */}
          {!isChampionship && (
          <div className="space-y-2">
            <p className="text-sm font-bold text-gray-700">Обложка турнира</p>
            {coverValue && (
              <div className="rounded-xl overflow-hidden h-20">
                {(() => {
                  const style = getCoverStyle(coverValue)
                  if (style) return <div className="w-full h-full" style={style} />
                  // eslint-disable-next-line @next/next/no-img-element
                  return <img src={coverValue} alt="" className="w-full h-full object-cover" />
                })()}
              </div>
            )}
            <TournamentCoverPicker
              sport={sport}
              currentCoverUrl={coverValue}
              onChange={setCoverValue}
            />
            <p className="text-xs text-gray-400">Баннер в шапке страницы турнира — необязательно</p>
          </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-bold text-gray-700">{periodLabelTxt}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
                {periodOptions.map(n => (
                  <button key={n} type="button" onClick={() => setMatchPeriods(n)}
                    style={matchPeriods === n ? { color: theme.primary } : undefined}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                      matchPeriods === n ? 'bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
              {!isSetBased && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div onClick={() => setExtraTime(v => !v)}
                    className="relative rounded-full transition-colors cursor-pointer"
                    style={{ width: 40, height: 22, background: extraTime ? theme.primary : '#e5e7eb' }}>
                    <span className="absolute top-0.5 bg-white rounded-full shadow transition-transform"
                      style={{ left: 2, width: 18, height: 18, transform: extraTime ? 'translateX(18px)' : 'translateX(0)' }} />
                  </div>
                  <span className="text-sm text-gray-600">{tx.extraTimeLbl}</span>
                </label>
              )}
            </div>
            {isSetBased && scoreNoteTxt && (
              <div className="rounded-xl px-4 py-2.5 text-xs leading-relaxed" style={{ background: theme.light, color: theme.primaryDark }}>
                {scoreNoteTxt}
              </div>
            )}
          </div>

          {!isSetBased && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-gray-700">{durationLabelTxt}</p>
              <div className="flex items-center gap-2">
                <Input type="number" min={1} max={90} value={durationMins}
                  onChange={e => setDurationMins(parseInt(e.target.value) || 45)}
                  className="w-20 h-8 text-sm text-center font-mono" />
                <span className="text-sm text-gray-500">{tx.durationUnit}</span>
              </div>
            </div>
          )}

          {(format === 'round_robin' || format === 'groups_playoff' || format === 'league_playoff') && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-gray-700">{tx.pointsLbl}</p>
              <div className="flex items-center gap-4">
                {([
                  { label: tx.pointsWin,  value: pointsWin,  setter: setPointsWin  as (v: number) => void },
                  { label: tx.pointsDraw, value: pointsDraw, setter: setPointsDraw as (v: number) => void },
                  { label: tx.pointsLoss, value: pointsLoss, setter: setPointsLoss as (v: number) => void },
                ]).map(({ label, value, setter }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-400">{label}</span>
                    <Input type="number" min={0} max={9} value={value}
                      onChange={e => setter(parseInt(e.target.value) || 0)}
                      className="w-14 h-8 text-center font-mono font-bold text-sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setError(null); setStep(2) }} className="flex-1 h-11 whitespace-nowrap">
              <ArrowLeft size={15} className="mr-1.5" /> {tx.back2}
            </Button>
            <Button onClick={goToStep4} className="sport-btn flex-1 h-11 text-white font-bold whitespace-nowrap">
              {tx.next} <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 4: Confirm ───────────────────────────────────────────── */}
      {step === 4 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <h1 className="text-xl font-black text-gray-900">{tx.step4.title}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{tx.step4.sub}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-emerald-600 flex items-center justify-center shrink-0">
                {tournamentLogo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={tournamentLogo} alt={name} className="w-full h-full object-cover" />
                  : <Trophy size={20} className="text-white" />}
              </div>
              <div>
                <p className="font-black text-gray-900 text-lg leading-tight">{name}</p>
                <p className="text-sm text-gray-500">
                  {fmtLabel(format)}
                  {format === 'round_robin' && (
                    <span> · {ROUNDS_OPTS[numRounds - 1]?.label ?? ''}</span>
                  )}
                  {format === 'league_playoff' && (
                    <span> · {numRounds} {tx.leagueTourLbl.toLowerCase()} · {tx.leagueAdvanceLbl}: {teamsAdvance}</span>
                  )}
                  {format === 'groups_playoff' && (
                    <span> · {GROUPS_OPTS.find(o => o.value === groupsCount)?.label ?? ''} · {tx.groupLegsOpts[(numRounds - 1) as 0 | 1] ?? tx.groupLegsOpts[0]}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="border-t border-emerald-100 pt-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{filledTeams.length} {tx.summary.teams}</p>
              <div className="flex flex-wrap gap-2">
                {teamNames.map((t, i) => {
                  if (!t.trim()) return null
                  return (
                    <div key={i} className="flex items-center gap-1.5 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                      {teamLogos[i] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={teamLogos[i]!} alt={t} className="w-4 h-4 rounded-full object-cover" />
                      )}
                      {t}
                    </div>
                  )
                })}
              </div>
            </div>

            {format === 'round_robin' && matchCount > 0 && (
              <div className="border-t border-emerald-100 pt-3 flex items-center gap-2 text-sm text-emerald-700 font-medium">
                <Zap size={14} />
                {tx.scheduleHint(matchCount)}
              </div>
            )}

            <div className="border-t border-emerald-100 pt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
              <span><span className="font-medium text-gray-700">{periodLabelTxt}:</span> {matchPeriods}{!isSetBased ? `×${durationMins} ${tx.durationUnit}` : ` ${lang === 'ru' ? 'сет' : lang === 'kz' ? 'сет' : 'sets'}`}</span>
              {extraTime && <span className="text-emerald-600 font-medium">{tx.extraTimeLbl}</span>}
              {format !== 'playoff' && (
                <span><span className="font-medium text-gray-700">{tx.summary.pts}:</span> {pointsWin}/{pointsDraw}/{pointsLoss}</span>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setError(null); setStep(3) }} className="flex-1 h-11 whitespace-nowrap">
              <ArrowLeft size={15} className="mr-1.5" /> {tx.back2}
            </Button>
            <Button onClick={handleCreate} disabled={loading}
              className="sport-btn flex-1 h-11 text-white font-bold whitespace-nowrap">
              {loading
                ? <Loader2 size={15} className="mr-1.5 animate-spin" />
                : <Zap size={15} className="mr-1.5" />}
              {loading ? (isChampionship ? champTx.creating : tx.creating) : (isAddSeason ? champTx.seasonCreate : isChampionship ? champTx.create : tx.create)}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
