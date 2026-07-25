// ─────────────────────────────────────────────────────────────────────────────
// Per-discipline copy for the public /sports/<slug> landing pages.
//
// The slug is a separate, latin, keyword-shaped identifier — `tournaments.sport`
// values like `beach_volleyball` or `cs` make poor URLs. Everything else (formats,
// periods, scoring, trackable events) is derived from `lib/sports.ts`, so a page
// states what the product actually does for that discipline rather than filler.
//
// Russian needs the dative form after «по» ("турнир по мини-футболу"), which no
// rule derives from the nominative label — hence the explicit `by` phrase.
// Kazakh uses the postposition «бойынша», which takes the plain nominative, and
// English just prefixes the label; both are built from the label at render time.
// ─────────────────────────────────────────────────────────────────────────────

import { SPORT_CATEGORIES, getSubtype, getCategoryForSport, type Lang } from '@/lib/sports'

export interface SportSeoEntry {
  /** URL segment: /sports/<slug> */
  slug: string
  /** `tournaments.sport` value this page is about. */
  sport: string
  /** Display name used in headings, per language. */
  name: Record<Lang, string>
  /** Russian «по …» phrase (dative), e.g. «по мини-футболу». */
  by: string
  /** Extra search wording worth carrying in the description. */
  also?: Record<Lang, string>
}

export const SPORT_SEO: SportSeoEntry[] = [
  { slug: 'football',          sport: 'football',          by: 'по футболу',                name: { ru: 'Футбол',            kz: 'Футбол',            en: 'Football' },          also: { ru: 'дворовый и корпоративный чемпионат, школьная лига', kz: 'аулалық және корпоративтік чемпионат', en: 'amateur, corporate and school leagues' } },
  { slug: 'futsal',            sport: 'futsal',            by: 'по мини-футболу',           name: { ru: 'Мини-футбол',       kz: 'Мини-футбол',       en: 'Futsal' },            also: { ru: 'футзал 5×5, зальный турнир', kz: 'футзал 5×5', en: 'futsal 5v5, indoor' } },
  { slug: 'efootball',         sport: 'efootball',         by: 'по киберфутболу',           name: { ru: 'Киберфутбол',       kz: 'Киберфутбол',       en: 'E-football' } },
  { slug: 'basketball',        sport: 'basketball',        by: 'по баскетболу',             name: { ru: 'Баскетбол',         kz: 'Баскетбол',         en: 'Basketball' } },
  { slug: 'streetball',        sport: 'streetball',        by: 'по стритболу',              name: { ru: 'Стритбол 3×3',      kz: 'Стритбол 3×3',      en: 'Streetball 3v3' } },
  { slug: 'ebasketball',       sport: 'ebasketball',       by: 'по кибербаскетболу',        name: { ru: 'Кибербаскетбол',    kz: 'Кибербаскетбол',    en: 'E-basketball' } },
  { slug: 'volleyball',        sport: 'volleyball',        by: 'по волейболу',              name: { ru: 'Волейбол',          kz: 'Волейбол',          en: 'Volleyball' } },
  { slug: 'beach-volleyball',  sport: 'beach_volleyball',  by: 'по пляжному волейболу',     name: { ru: 'Пляжный волейбол',  kz: 'Жағажай волейболы', en: 'Beach volleyball' } },
  { slug: 'hockey',            sport: 'hockey',            by: 'по хоккею',                 name: { ru: 'Хоккей',            kz: 'Хоккей',            en: 'Ice hockey' } },
  { slug: 'tennis',            sport: 'tennis',            by: 'по теннису',                name: { ru: 'Теннис',            kz: 'Теннис',            en: 'Tennis' } },
  { slug: 'table-tennis',      sport: 'table_tennis',      by: 'по настольному теннису',    name: { ru: 'Настольный теннис', kz: 'Үстел теннисі',     en: 'Table tennis' },      also: { ru: 'пинг-понг', kz: 'пинг-понг', en: 'ping pong' } },
  { slug: 'badminton',         sport: 'badminton',         by: 'по бадминтону',             name: { ru: 'Бадминтон',         kz: 'Бадминтон',         en: 'Badminton' } },
  { slug: 'squash',            sport: 'squash',            by: 'по сквошу',                 name: { ru: 'Сквош',             kz: 'Сквош',             en: 'Squash' } },
  { slug: 'padel',             sport: 'padel',             by: 'по паделу',                 name: { ru: 'Падел',             kz: 'Падел',             en: 'Padel' } },
  { slug: 'ea-fc',             sport: 'eafc',              by: 'по EA FC',                  name: { ru: 'EA FC (FIFA)',      kz: 'EA FC (FIFA)',      en: 'EA FC (FIFA)' } },
  { slug: 'counter-strike',    sport: 'cs',                by: 'по Counter-Strike',         name: { ru: 'Counter-Strike',    kz: 'Counter-Strike',    en: 'Counter-Strike' },    also: { ru: 'CS2, CS:GO', kz: 'CS2, CS:GO', en: 'CS2, CS:GO' } },
  { slug: 'dota-2',            sport: 'dota',              by: 'по Dota 2',                 name: { ru: 'Dota 2',            kz: 'Dota 2',            en: 'Dota 2' } },
  { slug: 'fighting-games',    sport: 'fighting',          by: 'по файтингам',              name: { ru: 'Файтинги',          kz: 'Файтингтер',        en: 'Fighting games' },    also: { ru: 'Tekken, Mortal Kombat, Street Fighter', kz: 'Tekken, Mortal Kombat', en: 'Tekken, Mortal Kombat, Street Fighter' } },
  { slug: 'pubg',              sport: 'pubg',              by: 'по PUBG',                   name: { ru: 'PUBG',              kz: 'PUBG',              en: 'PUBG' } },
  { slug: 'fortnite',          sport: 'fortnite',          by: 'по Fortnite',               name: { ru: 'Fortnite',          kz: 'Fortnite',          en: 'Fortnite' } },
  { slug: 'chess',             sport: 'chess',             by: 'по шахматам',               name: { ru: 'Шахматы',           kz: 'Шахмат',            en: 'Chess' } },
  { slug: 'checkers',          sport: 'checkers',          by: 'по шашкам',                 name: { ru: 'Шашки',             kz: 'Дойбы',             en: 'Checkers' } },
  { slug: 'mma',               sport: 'mma',               by: 'по MMA',                    name: { ru: 'MMA',               kz: 'MMA',               en: 'MMA' },               also: { ru: 'смешанные единоборства', kz: 'аралас жекпе-жек', en: 'mixed martial arts' } },
  { slug: 'boxing',            sport: 'boxing',            by: 'по боксу',                  name: { ru: 'Бокс',              kz: 'Бокс',              en: 'Boxing' } },
  { slug: 'wrestling',         sport: 'wrestling',         by: 'по борьбе',                 name: { ru: 'Борьба',            kz: 'Күрес',             en: 'Wrestling' } },
  { slug: 'kokpar',            sport: 'kokpar',            by: 'по кокпару',                name: { ru: 'Көкпар',            kz: 'Көкпар',            en: 'Kokpar' } },
  { slug: 'kazakh-kures',      sport: 'kazaksha_kures',    by: 'по қазақ күресі',           name: { ru: 'Қазақ күресі',      kz: 'Қазақ күресі',      en: 'Kazakh kuresi' } },
  { slug: 'audaryspak',        sport: 'audaryspak',        by: 'по аударыспаку',            name: { ru: 'Аударыспақ',        kz: 'Аударыспақ',        en: 'Audaryspak' } },
  { slug: 'togyzkumalak',      sport: 'togyzkumalak',      by: 'по тоғызқұмалақ',           name: { ru: 'Тоғызқұмалақ',      kz: 'Тоғызқұмалақ',      en: 'Togyzkumalak' } },
  { slug: 'asyk-atu',          sport: 'asyk_atu',          by: 'по асық ату',               name: { ru: 'Асық ату',          kz: 'Асық ату',          en: 'Asyk atu' } },
  { slug: 'american-football', sport: 'american_football', by: 'по американскому футболу',  name: { ru: 'Американский футбол', kz: 'Америкалық футбол', en: 'American football' } },
  { slug: 'baseball',          sport: 'baseball',          by: 'по бейсболу',               name: { ru: 'Бейсбол',           kz: 'Бейсбол',           en: 'Baseball' } },
]

const BY_SLUG = new Map(SPORT_SEO.map(e => [e.slug, e]))
const BY_SPORT = new Map(SPORT_SEO.map(e => [e.sport, e]))

export function sportSeoBySlug(slug: string): SportSeoEntry | undefined {
  return BY_SLUG.get(slug)
}

/** Landing-page path for a stored `tournaments.sport` value, if one exists. */
export function sportPathFor(sport: string | null | undefined, lang: Lang = 'ru'): string | null {
  if (!sport) return null
  const entry = BY_SPORT.get(sport)
  if (!entry) return null
  return `${langPrefix(lang)}/sports/${entry.slug}`
}

/**
 * Russian «по …» phrase for a stored sport value — "по мини-футболу".
 * Subtype labels are nominative and often qualified ("Классический 11×11"), so
 * they cannot be dropped into a sentence directly.
 */
export function sportByPhrase(sport: string | null | undefined): string | null {
  if (!sport) return null
  return BY_SPORT.get(sport)?.by ?? null
}

/** Plain discipline name for headings: "Мини-футбол" rather than "Мини-футбол 5×5". */
export function sportDisplayName(sport: string | null | undefined, lang: Lang): string | null {
  if (!sport) return null
  return BY_SPORT.get(sport)?.name[lang] ?? null
}

export function langPrefix(lang: Lang): '' | '/en' | '/kz' {
  return lang === 'en' ? '/en' : lang === 'kz' ? '/kz' : ''
}

/** "по футболу" / "Футбол бойынша" / "football" — the phrase that follows «турнир». */
export function sportPhrase(entry: SportSeoEntry, lang: Lang): string {
  if (lang === 'ru') return entry.by
  if (lang === 'kz') return `${entry.name.kz} бойынша`
  // Ordinary words read better lowercase mid-sentence ("a football tournament"),
  // but brands and acronyms must keep their casing ("an MMA tournament").
  const name = entry.name.en
  return /^[A-Z][a-z]+(?: [a-z]+)*$/.test(name) ? name.toLowerCase() : name
}

// Letters whose English name begins with a vowel sound — "an MMA", "an EA FC".
const VOWEL_SOUND_LETTERS = new Set(['A', 'E', 'F', 'H', 'I', 'L', 'M', 'N', 'O', 'R', 'S', 'X'])

/** Indefinite article for an English sport phrase. */
export function enArticle(phrase: string): 'a' | 'an' {
  const first = phrase[0] ?? ''
  const isAcronym = /^[A-Z0-9]{2,}/.test(phrase)
  if (isAcronym) return VOWEL_SOUND_LETTERS.has(first.toUpperCase()) ? 'an' : 'a'
  return /^[aeiou]/i.test(first) ? 'an' : 'a'
}

// ── Page copy ────────────────────────────────────────────────────────────────

export interface SportPageCopy {
  h1: string
  title: string
  description: string
  intro: string
  formatsHeading: string
  rulesHeading: string
  rulesLead: string
  featuresHeading: string
  features: { title: string; text: string }[]
  stepsHeading: string
  steps: { title: string; text: string }[]
  liveHeading: string
  liveEmpty: string
  faqHeading: string
  faq: { q: string; a: string }[]
  otherHeading: string
  ctaPrimary: string
  ctaSecondary: string
  recommended: string
  breadcrumbSports: string
}

const UI = {
  ru: {
    createTournament: (phrase: string) => `Создать турнир ${phrase} онлайн`,
    formatsHeading: (phrase: string) => `Форматы турнира ${phrase}`,
    rulesHeading: (phrase: string) => `Настройки матча ${phrase}`,
    featuresHeading: 'Что входит',
    stepsHeading: (phrase: string) => `Как создать турнир ${phrase} за 4 шага`,
    liveHeading: (phrase: string) => `Турниры ${phrase} на Tournable`,
    liveEmpty: 'Публичных турниров пока нет — ваш может стать первым.',
    faqHeading: 'Частые вопросы',
    otherHeading: 'Турниры по другим видам спорта',
    ctaPrimary: 'Создать турнир бесплатно',
    ctaSecondary: 'Смотреть все турниры',
    recommended: 'Рекомендуем',
    breadcrumbSports: 'Виды спорта',
  },
  kz: {
    createTournament: (phrase: string) => `${phrase} онлайн турнир құру`,
    formatsHeading: (phrase: string) => `${phrase} турнир форматтары`,
    rulesHeading: (phrase: string) => `${phrase} матч параметрлері`,
    featuresHeading: 'Не кіреді',
    stepsHeading: (phrase: string) => `${phrase} турнирді 4 қадаммен қалай құруға болады`,
    liveHeading: (phrase: string) => `Tournable-дегі ${phrase} турнирлер`,
    liveEmpty: 'Әзірге ашық турнирлер жоқ — сіздікі бірінші болуы мүмкін.',
    faqHeading: 'Жиі қойылатын сұрақтар',
    otherHeading: 'Басқа спорт түрлері бойынша турнирлер',
    ctaPrimary: 'Тегін турнир құру',
    ctaSecondary: 'Барлық турнирлерді көру',
    recommended: 'Ұсынамыз',
    breadcrumbSports: 'Спорт түрлері',
  },
  en: {
    createTournament: (phrase: string) => `Create a ${phrase} tournament online`,
    formatsHeading: (phrase: string) => `${phrase} tournament formats`,
    rulesHeading: (phrase: string) => `Match settings for ${phrase}`,
    featuresHeading: 'What you get',
    stepsHeading: (phrase: string) => `How to create a ${phrase} tournament in 4 steps`,
    liveHeading: (phrase: string) => `${phrase} tournaments on Tournable`,
    liveEmpty: 'No public tournaments yet — yours can be the first.',
    faqHeading: 'Frequently asked questions',
    otherHeading: 'Tournaments in other sports',
    ctaPrimary: 'Create a tournament for free',
    ctaSecondary: 'Browse all tournaments',
    recommended: 'Recommended',
    breadcrumbSports: 'Sports',
  },
} as const

/** Builds every string on the page from the discipline's real configuration. */
export function sportPageCopy(entry: SportSeoEntry, lang: Lang, formatNames: string[], statNames: string[]): SportPageCopy {
  const t = UI[lang]
  const phrase = sportPhrase(entry, lang)
  const name = entry.name[lang]
  const subtype = getSubtype(entry.sport)
  const category = getCategoryForSport(entry.sport)
  const individual = !!category?.individual
  const formats = formatNames.join(', ').toLowerCase()
  // Disciplines scored by result only (chess, draughts) declare no per-match
  // events, so every sentence about statistics needs a non-event wording.
  const stats = statNames.length ? statNames.join(', ') : null

  if (lang === 'kz') {
    const unit = individual ? 'қатысушылар' : 'командалар'
    return {
      h1: t.createTournament(phrase),
      title: `${phrase} турнир: кесте, тор және турнир кестесі`,
      description: `${phrase} онлайн турнир құрыңыз: автоматты матч кестесі, ${formats}, турнир кестесі, ${stats ? `${stats} статистикасы` : 'нәтижелер статистикасы'} және таблосы. Тегін, сілтеме арқылы бөлісіңіз.`,
      intro: `Tournable — ${phrase} турнирлер мен чемпионаттар өткізуге арналған конструктор. ${unit} тізімін енгізіңіз, форматты таңдаңыз — кесте, тор және кесте автоматты құрылады. Көрермендерге тіркелу қажет емес: жалпыға ортақ сілтеме нәтижелерді нақты уақытта көрсетеді.`,
      formatsHeading: t.formatsHeading(phrase),
      rulesHeading: t.rulesHeading(phrase),
      rulesLead: `${name} үшін әдепкі параметрлер — реттеуге болады.`,
      featuresHeading: t.featuresHeading,
      features: kzFeatures(stats, individual),
      stepsHeading: t.stepsHeading(phrase),
      steps: kzSteps(phrase, unit),
      liveHeading: t.liveHeading(phrase),
      liveEmpty: t.liveEmpty,
      faqHeading: t.faqHeading,
      faq: kzFaq(phrase, name, unit, individual ? 'қатысушы' : 'команда', formats),
      otherHeading: t.otherHeading,
      ctaPrimary: t.ctaPrimary,
      ctaSecondary: t.ctaSecondary,
      recommended: t.recommended,
      breadcrumbSports: t.breadcrumbSports,
    }
  }

  if (lang === 'en') {
    const unit = individual ? 'participants' : 'teams'
    const art = enArticle(phrase)
    return {
      h1: `Create ${art} ${phrase} tournament online`,
      title: `${name} tournament maker: bracket, fixtures and league table`,
      description: `Run ${art} ${phrase} tournament online: automatic fixtures, ${formats}, league table, ${stats ? `${stats} statistics` : 'result statistics'} and a scoreboard. Free to start, share by link.`,
      intro: `Tournable is a tournament and league builder for ${phrase}. Add your ${unit}, pick a format — fixtures, bracket and standings are generated for you. Spectators need no account: a public link shows results as they are entered.`,
      formatsHeading: t.formatsHeading(name),
      rulesHeading: t.rulesHeading(phrase),
      rulesLead: `Defaults for ${name} — every value stays editable.`,
      featuresHeading: t.featuresHeading,
      features: enFeatures(stats, individual),
      stepsHeading: `How to create ${art} ${phrase} tournament in 4 steps`,
      steps: enSteps(phrase, unit),
      liveHeading: t.liveHeading(name),
      liveEmpty: t.liveEmpty,
      faqHeading: t.faqHeading,
      faq: enFaq(phrase, art, unit, formats),
      otherHeading: t.otherHeading,
      ctaPrimary: t.ctaPrimary,
      ctaSecondary: t.ctaSecondary,
      recommended: t.recommended,
      breadcrumbSports: t.breadcrumbSports,
    }
  }

  const unit = individual ? 'участников' : 'команд'
  const unitNom = individual ? 'участники' : 'команды'
  return {
    h1: t.createTournament(phrase),
    title: `Турнир ${phrase}: сетка, расписание и турнирная таблица онлайн`,
    description: `Создайте турнир ${phrase} онлайн за минуту: автоматическое расписание матчей, ${formats}, турнирная таблица, ${stats ? `статистика (${stats})` : 'статистика результатов'} и табло. Бесплатно, результаты — по публичной ссылке.${entry.also ? ` Подходит для: ${entry.also.ru}.` : ''}`,
    intro: `Tournable — конструктор турниров и чемпионатов ${phrase}. Внесите ${unit}, выберите формат — расписание, сетка и таблица построятся сами. Зрителям не нужна регистрация: публичная ссылка показывает результаты по мере их внесения.`,
    formatsHeading: t.formatsHeading(phrase),
    rulesHeading: t.rulesHeading(phrase),
    rulesLead: `Значения по умолчанию для дисциплины «${name}» — любое из них можно изменить.`,
    featuresHeading: t.featuresHeading,
    features: ruFeatures(stats, individual),
    stepsHeading: t.stepsHeading(phrase),
    steps: ruSteps(phrase, unit, unitNom),
    liveHeading: t.liveHeading(phrase),
    liveEmpty: t.liveEmpty,
    faqHeading: t.faqHeading,
    faq: ruFaq(phrase, unit, formats, subtype?.pts.win ?? 3, subtype?.pts.draw ?? 1),
    otherHeading: t.otherHeading,
    ctaPrimary: t.ctaPrimary,
    ctaSecondary: t.ctaSecondary,
    recommended: t.recommended,
    breadcrumbSports: t.breadcrumbSports,
  }
}

// ── Section bodies ───────────────────────────────────────────────────────────

function ruFeatures(stats: string | null, individual: boolean) {
  return [
    { title: 'Расписание матчей', text: `Календарь строится автоматически по числу ${individual ? 'участников' : 'команд'} и выбранному формату. Даты и время матчей проставляются вручную или пакетом.` },
    { title: 'Турнирная таблица', text: 'Очки, разница и места пересчитываются сразу после внесения результата. Правила начисления очков настраиваются.' },
    { title: 'Сетка плей-офф', text: 'Победители переходят в следующий раунд автоматически, включая нижнюю сетку при двойном выбывании.' },
    { title: 'Статистика', text: stats
      ? `Учёт событий матча: ${stats}. Личные страницы игроков со статистикой по сезонам.`
      : 'Учёт результатов каждой встречи и личные страницы участников со статистикой по сезонам.' },
    { title: 'Табло матча', text: 'Отдельный экран со счётом в реальном времени — для проектора, экрана в зале или трансляции.' },
    { title: 'Публичная ссылка', text: 'Страница турнира открыта без регистрации: делитесь ссылкой в WhatsApp или Telegram, результаты обновляются у всех.' },
  ]
}

function ruSteps(phrase: string, unit: string, unitNom: string) {
  return [
    { title: 'Выберите вид спорта', text: `Укажите дисциплину — параметры матча ${phrase} подставятся по умолчанию.` },
    { title: 'Внесите список', text: `Добавьте ${unit} вручную или вставьте списком. Логотипы и составы — по желанию.` },
    { title: 'Выберите формат', text: 'Круговой, плей-офф, группы с выходом в сетку, лига с плей-офф, швейцарская система или рейтинг.' },
    { title: 'Поделитесь ссылкой', text: `Расписание готово — вносите счёт после каждого матча, ${unitNom} и зрители видят таблицу онлайн.` },
  ]
}

function ruFaq(phrase: string, unit: string, formats: string, win: number, draw: number) {
  return [
    { q: `Как создать турнир ${phrase} онлайн?`, a: `Зарегистрируйтесь на Tournable, выберите вид спорта, внесите ${unit}, выберите формат и нажмите «Создать». Расписание и турнирная таблица построятся автоматически — останется вносить счёт после матчей.` },
    { q: `Сколько стоит проведение турнира ${phrase}?`, a: `Базовый тариф бесплатный: один активный турнир и до 16 ${unit}, все виды спорта и форматы. Тариф Pro — 4 990 ₸ в месяц или 44 990 ₸ в год: неограниченное число турниров и ${unit}, брендированные отчёты и со-редакторы.` },
    { q: `Какие форматы доступны ${phrase}?`, a: `Доступны: ${formats}. Формат выбирается при создании и определяет, как строятся расписание и сетка.` },
    { q: 'Нужна ли регистрация зрителям?', a: 'Нет. Страница турнира открывается по публичной ссылке без аккаунта: таблица, расписание, результаты и статистика видны всем, кому вы отправили ссылку.' },
    { q: 'Можно ли изменить правила начисления очков?', a: `Да. По умолчанию для этой дисциплины — ${win} очка за победу и ${draw} за ничью; значения, число периодов и длительность матча меняются в настройках турнира.` },
    { q: 'Можно ли вести чемпионат из нескольких сезонов?', a: 'Да. Чемпионат объединяет сезоны, хранит постоянные страницы команд и игроков и показывает статистику за всю историю, а не только за текущий сезон.' },
  ]
}

function kzFeatures(stats: string | null, individual: boolean) {
  return [
    { title: 'Матч кестесі', text: `Күнтізбе ${individual ? 'қатысушылар' : 'командалар'} саны мен таңдалған формат бойынша автоматты құрылады.` },
    { title: 'Турнир кестесі', text: 'Ұпайлар мен орындар нәтиже енгізілген бойда қайта есептеледі. Ұпай беру ережелері реттеледі.' },
    { title: 'Плей-офф торы', text: 'Жеңімпаздар келесі раундқа автоматты өтеді, қос шығарудағы төменгі тор да қоса.' },
    { title: 'Статистика', text: stats
      ? `Матч оқиғалары: ${stats}. Ойыншылардың жеке беттері маусымдар бойынша статистикамен.`
      : 'Әр кездесудің нәтижесі есепке алынады, қатысушылардың жеке беттері маусымдар бойынша статистикамен.' },
    { title: 'Матч таблосы', text: 'Нақты уақыттағы есеп экраны — проектор немесе залдағы экран үшін.' },
    { title: 'Ашық сілтеме', text: 'Турнир беті тіркеусіз ашылады: сілтемені WhatsApp немесе Telegram арқылы бөлісіңіз.' },
  ]
}

function kzSteps(phrase: string, unit: string) {
  return [
    { title: 'Спорт түрін таңдаңыз', text: `Пәнді көрсетіңіз — ${phrase} матч параметрлері әдепкі бойынша қойылады.` },
    { title: 'Тізімді енгізіңіз', text: `${unit} қолмен қосыңыз немесе тізіммен қойыңыз. Логотиптер мен құрамдар — қалауыңыз бойынша.` },
    { title: 'Форматты таңдаңыз', text: 'Айналмалы, плей-офф, топтар, лига + плей-офф, швейцариялық жүйе немесе рейтинг.' },
    { title: 'Сілтемемен бөлісіңіз', text: 'Кесте дайын — әр матчтан кейін есепті енгізіңіз, кесте бәріне онлайн көрінеді.' },
  ]
}

function kzFaq(phrase: string, name: string, unit: string, unitSg: string, formats: string) {
  return [
    { q: `${phrase} онлайн турнирді қалай құруға болады?`, a: `Tournable-де тіркеліңіз, спорт түрін таңдаңыз, ${unit} енгізіңіз, форматты таңдап «Құру» түймесін басыңыз. Кесте мен турнир кестесі автоматты құрылады.` },
    { q: `${phrase} турнир өткізу қанша тұрады?`, a: `Базалық тариф тегін: бір белсенді турнир және 16-ға дейін ${unitSg}, барлық спорт түрлері мен форматтар. Pro тарифі — айына 4 990 ₸ немесе жылына 44 990 ₸: шектеусіз турнирлер мен ${unit}, брендтелген есептер және қосалқы редакторлар.` },
    { q: `${name} үшін қандай форматтар бар?`, a: `Қолжетімді: ${formats}. Формат құру кезінде таңдалады.` },
    { q: 'Көрермендерге тіркелу керек пе?', a: 'Жоқ. Турнир беті ашық сілтеме арқылы аккаунтсыз ашылады: кесте, матчтар, нәтижелер мен статистика көрінеді.' },
    { q: 'Бірнеше маусымнан тұратын чемпионат жүргізуге бола ма?', a: 'Иә. Чемпионат маусымдарды біріктіреді, командалар мен ойыншылардың тұрақты беттерін сақтайды және бүкіл тарих бойынша статистиканы көрсетеді.' },
  ]
}

function enFeatures(stats: string | null, individual: boolean) {
  return [
    { title: 'Fixtures', text: `The calendar is generated from the number of ${individual ? 'participants' : 'teams'} and the format you pick. Dates and kick-off times can be set per match or in bulk.` },
    { title: 'League table', text: 'Points, difference and positions recalculate the moment a result is entered. Points-per-win rules are configurable.' },
    { title: 'Playoff bracket', text: 'Winners advance automatically, including the lower bracket in double elimination.' },
    { title: 'Statistics', text: stats
      ? `Match events are tracked: ${stats}. Every player gets a profile with season-by-season numbers.`
      : 'Every result is recorded, and each participant gets a profile with season-by-season numbers.' },
    { title: 'Scoreboard', text: 'A separate live-score screen for a projector, a venue display or a stream overlay.' },
    { title: 'Public link', text: 'The tournament page opens without an account — share the link and everyone sees the same live table.' },
  ]
}

function enSteps(phrase: string, unit: string) {
  return [
    { title: 'Pick the sport', text: `Choose the discipline and the match settings for ${phrase} are filled in for you.` },
    { title: 'Add the field', text: `Enter ${unit} one by one or paste a list. Logos and squads are optional.` },
    { title: 'Choose a format', text: 'Round-robin, playoff, groups into a bracket, league plus playoff, Swiss system or a points leaderboard.' },
    { title: 'Share the link', text: 'Fixtures are ready — enter scores as matches finish and everyone follows the table online.' },
  ]
}

function enFaq(phrase: string, art: 'a' | 'an', unit: string, formats: string) {
  return [
    { q: `How do I create ${art} ${phrase} tournament online?`, a: `Sign up for Tournable, pick the sport, add your ${unit}, choose a format and hit create. Fixtures and the league table are generated automatically — you only enter scores.` },
    { q: `How much does running ${art} ${phrase} tournament cost?`, a: `The free plan covers one active tournament with up to 16 ${unit}, all sports and all formats. Pro is 4,990 KZT per month or 44,990 KZT per year and removes the limits, adds branded reports and co-editors.` },
    { q: `Which formats are available for ${phrase}?`, a: `You can run: ${formats}. The format is chosen at creation and defines how fixtures and the bracket are built.` },
    { q: 'Do spectators need an account?', a: 'No. The tournament page is a public link — table, fixtures, results and statistics are visible to anyone you send it to.' },
    { q: 'Can I run a multi-season championship?', a: 'Yes. A championship groups seasons together, keeps permanent team and player pages and shows all-time statistics rather than just the current season.' },
  ]
}

/**
 * Canonical + hreflang cluster for a page that exists at `/x`, `/kz/x` and `/en/x`.
 * `path` is the Russian (prefix-less) path, e.g. `/sports/football`.
 */
export function trilingualAlternates(path: string, lang: Lang) {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://tournable.app').replace(/\/+$/, '')
  return {
    canonical: `${langPrefix(lang)}${path}`,
    languages: {
      ru: `${base}${path}`,
      kk: `${base}/kz${path}`,
      en: `${base}/en${path}`,
      'x-default': `${base}${path}`,
    },
  }
}

/** Every sport page except the current one, for the cross-link block. */
export function otherSports(currentSlug: string, lang: Lang) {
  return SPORT_SEO
    .filter(e => e.slug !== currentSlug)
    .map(e => ({ slug: e.slug, name: e.name[lang], path: `${langPrefix(lang)}/sports/${e.slug}` }))
}

/** Sport pages grouped by the discipline category, for the /sports index. */
export function sportsByCategory(lang: Lang) {
  return SPORT_CATEGORIES.map(cat => ({
    id: cat.id,
    label: cat.label[lang],
    tagline: cat.tagline[lang],
    items: cat.subtypes
      .map(st => BY_SPORT.get(st.value))
      .filter((e): e is SportSeoEntry => !!e)
      .map(e => ({ slug: e.slug, name: e.name[lang], path: `${langPrefix(lang)}/sports/${e.slug}` })),
  })).filter(c => c.items.length > 0)
}
