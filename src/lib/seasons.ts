// Season naming engine for championships.
//
// A championship has a periodicity; each new season's name follows logically from
// the previous one. Names are derived deterministically from an anchor date
// (the championship's creation date) plus the season index, so they always
// continue the sequence regardless of when a season is actually created.

export type Lang = 'ru' | 'kz' | 'en'

export type SeasonPeriod =
  | 'daily_index'   // День 1, День 2 …
  | 'daily_date'    // 1 сентября 2025, 2 сентября 2025 …
  | 'weekly'        // Неделя 1, Неделя 2 …
  | 'monthly'       // Январь 2026, Февраль 2026 …
  | 'quarterly'     // I квартал 2026, II квартал 2026 …
  | 'yearly'        // 2027, 2028 …
  | 'seasonal'      // 2023/2024, 2024/2025 …

const MONTHS_NOM: Record<Lang, string[]> = {
  ru: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
  kz: ['Қаңтар','Ақпан','Наурыз','Сәуір','Мамыр','Маусым','Шілде','Тамыз','Қыркүйек','Қазан','Қараша','Желтоқсан'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
}
const MONTHS_GEN: Record<Lang, string[]> = {
  ru: ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],
  kz: ['қаңтар','ақпан','наурыз','сәуір','мамыр','маусым','шілде','тамыз','қыркүйек','қазан','қараша','желтоқсан'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
}
const ROMAN = ['I', 'II', 'III', 'IV']
const DAY_WORD: Record<Lang, string> = { ru: 'День', kz: 'Күн', en: 'Day' }
const WEEK_WORD: Record<Lang, string> = { ru: 'Неделя', kz: 'Апта', en: 'Week' }
const QUARTER_WORD: Record<Lang, string> = { ru: 'квартал', kz: 'тоқсан', en: 'quarter' }

function addDays(d: Date, n: number): Date {
  const r = new Date(d.getTime())
  r.setDate(r.getDate() + n)
  return r
}
function addMonths(d: Date, n: number): Date {
  const r = new Date(d.getTime())
  const day = r.getDate()
  r.setDate(1)
  r.setMonth(r.getMonth() + n)
  // Clamp to end of month if overflow (e.g. Jan 31 + 1mo)
  const lastDay = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate()
  r.setDate(Math.min(day, lastDay))
  return r
}

/** Name for season `index` (0-based) of a championship anchored at `anchorISO`. */
export function seasonName(period: SeasonPeriod, anchorISO: string, index: number, lang: Lang): string {
  const base = new Date(anchorISO)
  const safeBase = isNaN(base.getTime()) ? new Date() : base
  switch (period) {
    case 'daily_index': return `${DAY_WORD[lang]} ${index + 1}`
    case 'weekly':      return `${WEEK_WORD[lang]} ${index + 1}`
    case 'daily_date': {
      const d = addDays(safeBase, index)
      return `${d.getDate()} ${MONTHS_GEN[lang][d.getMonth()]} ${d.getFullYear()}`
    }
    case 'monthly': {
      const d = addMonths(safeBase, index)
      return `${MONTHS_NOM[lang][d.getMonth()]} ${d.getFullYear()}`
    }
    case 'quarterly': {
      const d = addMonths(safeBase, index * 3)
      const q = Math.floor(d.getMonth() / 3)
      return `${ROMAN[q]} ${QUARTER_WORD[lang]} ${d.getFullYear()}`
    }
    case 'yearly': {
      const y = safeBase.getFullYear() + index
      return String(y)
    }
    case 'seasonal': {
      const y = safeBase.getFullYear() + index
      return `${y}/${y + 1}`
    }
  }
}

/** Options for the championship-creation periodicity picker. */
export const SEASON_PERIOD_OPTIONS: { value: SeasonPeriod; label: Record<Lang, string>; example: (lang: Lang) => string }[] = [
  { value: 'seasonal',    label: { ru: 'Сезонная', kz: 'Маусымдық', en: 'Seasonal' },     example: () => '2025/2026' },
  { value: 'yearly',      label: { ru: 'Ежегодная', kz: 'Жылдық', en: 'Yearly' },          example: () => '2026' },
  { value: 'monthly',     label: { ru: 'Ежемесячная', kz: 'Айлық', en: 'Monthly' },        example: l => `${MONTHS_NOM[l][0]} 2026` },
  { value: 'quarterly',   label: { ru: 'Квартальная', kz: 'Тоқсандық', en: 'Quarterly' },  example: l => `I ${QUARTER_WORD[l]} 2026` },
  { value: 'weekly',      label: { ru: 'Еженедельная', kz: 'Апталық', en: 'Weekly' },       example: l => `${WEEK_WORD[l]} 1` },
  { value: 'daily_index', label: { ru: 'Ежедневная (День N)', kz: 'Күнделікті (Күн N)', en: 'Daily (Day N)' }, example: l => `${DAY_WORD[l]} 1` },
  { value: 'daily_date',  label: { ru: 'Ежедневная (дата)', kz: 'Күнделікті (күн)', en: 'Daily (date)' }, example: l => `1 ${MONTHS_GEN[l][8]} 2025` },
]
