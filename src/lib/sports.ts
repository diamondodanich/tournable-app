// ─────────────────────────────────────────────────────────────────────────────
// Central sport taxonomy: categories → subtypes, colour themes, match defaults
// and the tournament formats actually practised in each sport.
//
// `subtype.value` is what gets stored in tournaments.sport (text column).
// ─────────────────────────────────────────────────────────────────────────────

import type { ElementType } from 'react'
import { Goal, CircleDot, Volleyball, Swords, HelpCircle } from 'lucide-react'

export type Format = 'round_robin' | 'playoff' | 'groups_playoff' | 'league_playoff'
export type Lang = 'ru' | 'kz' | 'en'

export interface SportTheme {
  primary: string      // main accent (buttons, active state)
  primaryDark: string  // gradient end / hover
  light: string        // light tint background (selected card)
  ringRgba: string     // soft ring / glow colour
  gradient: string     // header / hero gradient (vivid)
  heroDark: string     // deep dark gradient for the champion banner
}

export interface SportSubtype {
  value: string
  label: Record<Lang, string>
  desc: Record<Lang, string>
  periods: number
  periodOptions: number[]
  duration: number
  periodLabel: Record<Lang, string>
  durationLabel: Record<Lang, string>
  extraTime: boolean
  pts: { win: number; draw: number; loss: number }
  noDraw?: boolean
  scoreNote?: Record<Lang, string>   // shown in settings (e.g. sets / maps)
  hideDuration?: boolean             // for set/map-based sports
  recommendedFormat: Format
  formats: Format[]                  // ordered, practised in this sport
}

export interface SportCategory {
  id: string
  label: Record<Lang, string>
  tagline: Record<Lang, string>
  abbr: string
  icon: ElementType                  // Lucide icon component
  proOnly: boolean                   // football is free; the rest are Pro
  theme: SportTheme
  subtypes: SportSubtype[]
}

// ── Colour themes ────────────────────────────────────────────────────────────
const THEME = {
  green:  { primary: '#059669', primaryDark: '#047857', light: '#ecfdf5', ringRgba: 'rgba(5,150,105,.30)',  gradient: 'linear-gradient(135deg,#047857 0%,#10b981 100%)', heroDark: 'linear-gradient(135deg,#0b3b2e 0%,#0f5132 45%,#064e3b 100%)' },
  orange: { primary: '#ea580c', primaryDark: '#c2410c', light: '#fff7ed', ringRgba: 'rgba(234,88,12,.30)',  gradient: 'linear-gradient(135deg,#c2410c 0%,#f97316 100%)', heroDark: 'linear-gradient(135deg,#3b160a 0%,#7c2d12 45%,#431407 100%)' },
  blue:   { primary: '#2563eb', primaryDark: '#1d4ed8', light: '#eff6ff', ringRgba: 'rgba(37,99,235,.30)',  gradient: 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)', heroDark: 'linear-gradient(135deg,#0b1f4d 0%,#1e3a8a 45%,#172554 100%)' },
  cyan:   { primary: '#0891b2', primaryDark: '#0e7490', light: '#ecfeff', ringRgba: 'rgba(8,145,178,.30)',  gradient: 'linear-gradient(135deg,#0e7490 0%,#06b6d4 100%)', heroDark: 'linear-gradient(135deg,#062f37 0%,#0e7490 45%,#083344 100%)' },
  violet: { primary: '#7c3aed', primaryDark: '#6d28d9', light: '#f5f3ff', ringRgba: 'rgba(124,58,237,.30)', gradient: 'linear-gradient(135deg,#6d28d9 0%,#8b5cf6 100%)', heroDark: 'linear-gradient(135deg,#2a1259 0%,#5b21b6 45%,#3b0764 100%)' },
  gray:   { primary: '#4b5563', primaryDark: '#374151', light: '#f9fafb', ringRgba: 'rgba(75,85,99,.30)',   gradient: 'linear-gradient(135deg,#374151 0%,#6b7280 100%)', heroDark: 'linear-gradient(135deg,#111827 0%,#374151 45%,#0b0f17 100%)' },
} satisfies Record<string, SportTheme>

const ALL_FORMATS: Format[] = ['round_robin', 'playoff', 'groups_playoff', 'league_playoff']

// ── Categories ───────────────────────────────────────────────────────────────
export const SPORT_CATEGORIES: SportCategory[] = [
  {
    id: 'football', abbr: 'F', icon: Goal, proOnly: false, theme: THEME.green,
    label:   { ru: 'Футбол',  kz: 'Футбол',  en: 'Football' },
    tagline: { ru: 'Классика, мини-футбол и киберфутбол', kz: 'Классика, мини-футбол және киберфутбол', en: 'Classic, futsal & e-football' },
    subtypes: [
      {
        value: 'football',
        label: { ru: 'Классический 11×11', kz: 'Классикалық 11×11', en: 'Classic 11v11' },
        desc:  { ru: 'Большое поле, 2 тайма по 45 минут.', kz: 'Үлкен алаң, 45 минуттан 2 тайм.', en: 'Full pitch, two 45-minute halves.' },
        periods: 2, periodOptions: [1, 2], duration: 45, extraTime: false, pts: { win: 3, draw: 1, loss: 0 },
        periodLabel: { ru: 'Таймы', kz: 'Таймдар', en: 'Halves' }, durationLabel: { ru: 'Длительность тайма', kz: 'Тайм ұзақтығы', en: 'Half duration' },
        recommendedFormat: 'round_robin', formats: ['round_robin', 'league_playoff', 'groups_playoff', 'playoff'],
      },
      {
        value: 'futsal',
        label: { ru: 'Мини-футбол 5×5', kz: 'Мини-футбол 5×5', en: 'Futsal 5v5' },
        desc:  { ru: 'Зал, 2 тайма по 20 минут.', kz: 'Зал, 20 минуттан 2 тайм.', en: 'Indoor, two 20-minute halves.' },
        periods: 2, periodOptions: [1, 2], duration: 20, extraTime: false, pts: { win: 3, draw: 1, loss: 0 },
        periodLabel: { ru: 'Таймы', kz: 'Таймдар', en: 'Halves' }, durationLabel: { ru: 'Длительность тайма', kz: 'Тайм ұзақтығы', en: 'Half duration' },
        recommendedFormat: 'round_robin', formats: ['round_robin', 'groups_playoff', 'playoff', 'league_playoff'],
      },
      {
        value: 'efootball',
        label: { ru: 'Киберфутбол', kz: 'Киберфутбол', en: 'E-football' },
        desc:  { ru: 'FIFA / eFootball. Счёт — голы в партии.', kz: 'FIFA / eFootball. Есеп — партиядағы голдар.', en: 'FIFA / eFootball. Score = goals per game.' },
        periods: 1, periodOptions: [1], duration: 6, extraTime: false, pts: { win: 3, draw: 1, loss: 0 },
        periodLabel: { ru: 'Матчи', kz: 'Матчтар', en: 'Games' }, durationLabel: { ru: 'Длительность матча', kz: 'Матч ұзақтығы', en: 'Match length' },
        recommendedFormat: 'playoff', formats: ['playoff', 'groups_playoff', 'round_robin', 'league_playoff'],
      },
    ],
  },
  {
    id: 'basketball', abbr: 'B', icon: CircleDot, proOnly: true, theme: THEME.orange,
    label:   { ru: 'Баскетбол', kz: 'Баскетбол', en: 'Basketball' },
    tagline: { ru: '5×5, стритбол 3×3 и кибербаскетбол', kz: '5×5, стритбол 3×3 және кибербаскетбол', en: '5v5, streetball 3v3 & e-ball' },
    subtypes: [
      {
        value: 'basketball',
        label: { ru: 'Классический 5×5', kz: 'Классикалық 5×5', en: 'Classic 5v5' },
        desc:  { ru: '4 четверти по 10 минут. Без ничьих.', kz: '10 минуттан 4 ширек. Теңсіз.', en: 'Four 10-minute quarters. No draws.' },
        periods: 4, periodOptions: [2, 4], duration: 10, extraTime: false, pts: { win: 2, draw: 0, loss: 0 }, noDraw: true,
        periodLabel: { ru: 'Четверти', kz: 'Ширектер', en: 'Quarters' }, durationLabel: { ru: 'Длительность четверти', kz: 'Ширек ұзақтығы', en: 'Quarter duration' },
        recommendedFormat: 'league_playoff', formats: ['league_playoff', 'round_robin', 'groups_playoff', 'playoff'],
      },
      {
        value: 'streetball',
        label: { ru: 'Стритбол 3×3', kz: 'Стритбол 3×3', en: 'Streetball 3v3' },
        desc:  { ru: 'Одна корзина, до 21 очка. Без ничьих.', kz: 'Бір себет, 21 ұпайға дейін. Теңсіз.', en: 'Half court, first to 21. No draws.' },
        periods: 1, periodOptions: [1, 2], duration: 10, extraTime: false, pts: { win: 2, draw: 0, loss: 0 }, noDraw: true,
        periodLabel: { ru: 'Периоды', kz: 'Кезеңдер', en: 'Periods' }, durationLabel: { ru: 'Длительность периода', kz: 'Кезең ұзақтығы', en: 'Period duration' },
        recommendedFormat: 'groups_playoff', formats: ['groups_playoff', 'playoff', 'round_robin', 'league_playoff'],
      },
      {
        value: 'ebasketball',
        label: { ru: 'Кибербаскетбол', kz: 'Кибербаскетбол', en: 'E-basketball' },
        desc:  { ru: 'NBA 2K. Счёт — очки в матче. Без ничьих.', kz: 'NBA 2K. Есеп — матчтағы ұпайлар. Теңсіз.', en: 'NBA 2K. Score = points per match. No draws.' },
        periods: 4, periodOptions: [4], duration: 5, extraTime: false, pts: { win: 2, draw: 0, loss: 0 }, noDraw: true,
        periodLabel: { ru: 'Четверти', kz: 'Ширектер', en: 'Quarters' }, durationLabel: { ru: 'Длительность четверти', kz: 'Ширек ұзақтығы', en: 'Quarter duration' },
        recommendedFormat: 'playoff', formats: ['playoff', 'groups_playoff', 'round_robin', 'league_playoff'],
      },
    ],
  },
  {
    id: 'volleyball', abbr: 'V', icon: Volleyball, proOnly: true, theme: THEME.blue,
    label:   { ru: 'Волейбол', kz: 'Волейбол', en: 'Volleyball' },
    tagline: { ru: 'Классический и пляжный', kz: 'Классикалық және жағажай', en: 'Indoor & beach' },
    subtypes: [
      {
        value: 'volleyball',
        label: { ru: 'Классический 6×6', kz: 'Классикалық 6×6', en: 'Indoor 6v6' },
        desc:  { ru: 'До 5 партий. Счёт матча — выигранные сеты.', kz: '5 партияға дейін. Есеп — ұтылған сеттер.', en: 'Best of 5 sets. Score = sets won.' },
        periods: 3, periodOptions: [3, 5], duration: 25, extraTime: false, pts: { win: 3, draw: 0, loss: 0 }, noDraw: true, hideDuration: true,
        periodLabel: { ru: 'Сеты', kz: 'Сеттер', en: 'Sets' }, durationLabel: { ru: 'Длительность сета', kz: 'Сет ұзақтығы', en: 'Set length' },
        scoreNote: { ru: 'Счёт матча — количество выигранных сетов (например 3:1). Ничьих нет.', kz: 'Матч есебі — ұтылған сеттер саны (мысалы 3:1). Теңсіз.', en: 'Match score = sets won (e.g. 3:1). No draws.' },
        recommendedFormat: 'round_robin', formats: ['round_robin', 'groups_playoff', 'playoff', 'league_playoff'],
      },
      {
        value: 'beach_volleyball',
        label: { ru: 'Пляжный 2×2', kz: 'Жағажай 2×2', en: 'Beach 2v2' },
        desc:  { ru: 'Песок, до 3 партий. Без ничьих.', kz: 'Құм, 3 партияға дейін. Теңсіз.', en: 'Sand, best of 3 sets. No draws.' },
        periods: 2, periodOptions: [1, 3], duration: 21, extraTime: false, pts: { win: 1, draw: 0, loss: 0 }, noDraw: true, hideDuration: true,
        periodLabel: { ru: 'Сеты', kz: 'Сеттер', en: 'Sets' }, durationLabel: { ru: 'Длительность сета', kz: 'Сет ұзақтығы', en: 'Set length' },
        scoreNote: { ru: 'Счёт матча — количество выигранных сетов (например 2:1). Ничьих нет.', kz: 'Матч есебі — ұтылған сеттер саны. Теңсіз.', en: 'Match score = sets won. No draws.' },
        recommendedFormat: 'groups_playoff', formats: ['groups_playoff', 'playoff', 'round_robin', 'league_playoff'],
      },
    ],
  },
  {
    id: 'hockey', abbr: 'H', icon: Swords, proOnly: true, theme: THEME.cyan,
    label:   { ru: 'Хоккей', kz: 'Хоккей', en: 'Hockey' },
    tagline: { ru: 'Хоккей с шайбой', kz: 'Шайбалы хоккей', en: 'Ice hockey' },
    subtypes: [
      {
        value: 'hockey',
        label: { ru: 'Хоккей 5×5', kz: 'Хоккей 5×5', en: 'Ice hockey 5v5' },
        desc:  { ru: '3 периода по 20 минут, есть овертайм.', kz: '20 минуттан 3 кезең, овертайм бар.', en: 'Three 20-minute periods, overtime on.' },
        periods: 3, periodOptions: [2, 3], duration: 20, extraTime: true, pts: { win: 3, draw: 1, loss: 0 },
        periodLabel: { ru: 'Периоды', kz: 'Кезеңдер', en: 'Periods' }, durationLabel: { ru: 'Длительность периода', kz: 'Кезең ұзақтығы', en: 'Period duration' },
        recommendedFormat: 'league_playoff', formats: ['league_playoff', 'round_robin', 'playoff', 'groups_playoff'],
      },
    ],
  },
  {
    id: 'other', abbr: '•', icon: HelpCircle, proOnly: true, theme: THEME.gray,
    label:   { ru: 'Другое', kz: 'Басқа', en: 'Other' },
    tagline: { ru: 'Свой вид спорта и правила', kz: 'Өз спорт түрі мен ережелер', en: 'Custom sport & rules' },
    subtypes: [
      {
        value: 'other',
        label: { ru: 'Свои правила', kz: 'Өз ережелер', en: 'Custom rules' },
        desc:  { ru: 'Настройте таймы, длительность и очки под себя.', kz: 'Таймдар, ұзақтық пен ұпайларды өзіңізге баптаңыз.', en: 'Configure periods, duration and points yourself.' },
        periods: 2, periodOptions: [1, 2, 3, 4], duration: 45, extraTime: false, pts: { win: 3, draw: 1, loss: 0 },
        periodLabel: { ru: 'Периоды', kz: 'Кезеңдер', en: 'Periods' }, durationLabel: { ru: 'Длительность периода', kz: 'Кезең ұзақтығы', en: 'Period duration' },
        recommendedFormat: 'round_robin', formats: ALL_FORMATS,
      },
    ],
  },
]

// ── Lookups ──────────────────────────────────────────────────────────────────
const SUBTYPE_INDEX: Record<string, { category: SportCategory; subtype: SportSubtype }> = {}
for (const category of SPORT_CATEGORIES) {
  for (const subtype of category.subtypes) {
    SUBTYPE_INDEX[subtype.value] = { category, subtype }
  }
}

export function getSubtype(value: string): SportSubtype | undefined {
  return SUBTYPE_INDEX[value]?.subtype
}

export function getCategoryForSport(value: string): SportCategory | undefined {
  return SUBTYPE_INDEX[value]?.category
}

export function getSportTheme(value: string | null | undefined): SportTheme {
  if (!value) return THEME.green
  return SUBTYPE_INDEX[value]?.category.theme ?? THEME.green
}
