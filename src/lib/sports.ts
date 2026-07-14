// ─────────────────────────────────────────────────────────────────────────────
// Central sport taxonomy: categories → subtypes, colour themes, match defaults
// and the tournament formats actually practised in each sport.
//
// `subtype.value` is what gets stored in tournaments.sport (text column).
// ─────────────────────────────────────────────────────────────────────────────

import type { ElementType } from 'react'
import { Volleyball, HelpCircle, Gamepad2 } from 'lucide-react'
import { SoccerBall, BasketballBall, HockeyPuck, MmaGlove, TennisRacket, ChessPawn, Yurt, AmericanFootball } from '@/components/icons/sport-icons'

export type Format = 'round_robin' | 'playoff' | 'groups_playoff' | 'league_playoff' | 'swiss' | 'leaderboard' | 'double_elim'
export type Lang = 'ru' | 'kz' | 'en'

export interface SportTheme {
  primary: string      // main accent (buttons, active state)
  primaryDark: string  // gradient end / hover
  light: string        // light tint background (selected card)
  ringRgba: string     // soft ring / glow colour
  gradient: string     // header / hero gradient (vivid)
  heroDark: string     // deep dark gradient for the champion banner
}

// ── Match events ───────────────────────────────────────────────────────────────
// Every discipline declares which in-match events can be logged. This replaces the
// hard-coded football set (goal/assist/cards) so each sport shows relevant actions.
//
// `icon` maps to a shared renderer (FixturesTab/StatsTab); `countsForTeam` means the
// event adds a point to its own team's score, `countsForOpponent` adds to the rival
// (own-goal). `stat` means the event gets a top-list in the Stats tab.
export type EventIcon =
  | 'ball' | 'assist' | 'yellow' | 'red' | 'warn'
  | 'ko' | 'submission' | 'ace' | 'block' | 'foul'
  | 'three' | 'touchdown' | 'run' | 'strike' | 'star'

export interface EventDef {
  type: string                   // stored verbatim in match_events.type (text column)
  label: Record<Lang, string>
  icon: EventIcon
  countsForTeam?: boolean        // increments own team score (goal-like)
  countsForOpponent?: boolean    // increments opponent score (own-goal-like)
  hasAssist?: boolean            // offers an optional assist sub-field in the editor
  stat?: boolean                 // shown as a leaderboard in the Stats tab
}

// score derived from countsFor* events (football/hockey) vs manual score inputs
export type ScoreMode = 'count' | 'manual'

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
  events?: EventDef[]                // per-subtype override of category events
  scoreMode?: ScoreMode              // per-subtype override of category scoreMode
  participantKind?: ParticipantKind  // per-subtype override (mixed categories, e.g. nomad)
}

// How to refer to a competitor in the UI (nouns, placeholders, seeding labels).
export type ParticipantKind = 'team' | 'participant' | 'fighter'

export interface SportCategory {
  id: string
  label: Record<Lang, string>
  tagline: Record<Lang, string>
  abbr: string
  icon: ElementType                  // Lucide icon component
  proOnly: boolean                   // football is free; the rest are Pro
  theme: SportTheme
  subtypes: SportSubtype[]
  individual?: boolean               // 1v1 disciplines → "участник" instead of "команда"
  participantKind?: ParticipantKind  // explicit competitor noun (defaults from `individual`)
  scoreMode?: ScoreMode              // 'count' = score from events, 'manual' = score inputs
  events?: EventDef[]                // in-match events offered for this discipline
}

// ── Colour themes ────────────────────────────────────────────────────────────
const THEME = {
  green:  { primary: '#059669', primaryDark: '#047857', light: '#ecfdf5', ringRgba: 'rgba(5,150,105,.30)',  gradient: 'linear-gradient(135deg,#047857 0%,#10b981 100%)', heroDark: 'linear-gradient(135deg,#0b3b2e 0%,#0f5132 45%,#064e3b 100%)' },
  orange: { primary: '#ea580c', primaryDark: '#c2410c', light: '#fff7ed', ringRgba: 'rgba(234,88,12,.30)',  gradient: 'linear-gradient(135deg,#c2410c 0%,#f97316 100%)', heroDark: 'linear-gradient(135deg,#3b160a 0%,#7c2d12 45%,#431407 100%)' },
  blue:   { primary: '#2563eb', primaryDark: '#1d4ed8', light: '#eff6ff', ringRgba: 'rgba(37,99,235,.30)',  gradient: 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)', heroDark: 'linear-gradient(135deg,#0b1f4d 0%,#1e3a8a 45%,#172554 100%)' },
  cyan:   { primary: '#0891b2', primaryDark: '#0e7490', light: '#ecfeff', ringRgba: 'rgba(8,145,178,.30)',  gradient: 'linear-gradient(135deg,#0e7490 0%,#06b6d4 100%)', heroDark: 'linear-gradient(135deg,#062f37 0%,#0e7490 45%,#083344 100%)' },
  violet: { primary: '#7c3aed', primaryDark: '#6d28d9', light: '#f5f3ff', ringRgba: 'rgba(124,58,237,.30)', gradient: 'linear-gradient(135deg,#6d28d9 0%,#8b5cf6 100%)', heroDark: 'linear-gradient(135deg,#2a1259 0%,#5b21b6 45%,#3b0764 100%)' },
  gray:   { primary: '#4b5563', primaryDark: '#374151', light: '#f9fafb', ringRgba: 'rgba(75,85,99,.30)',   gradient: 'linear-gradient(135deg,#374151 0%,#6b7280 100%)', heroDark: 'linear-gradient(135deg,#111827 0%,#374151 45%,#0b0f17 100%)' },
  red:    { primary: '#dc2626', primaryDark: '#b91c1c', light: '#fef2f2', ringRgba: 'rgba(220,38,38,.30)',  gradient: 'linear-gradient(135deg,#b91c1c 0%,#ef4444 100%)', heroDark: 'linear-gradient(135deg,#3b0a0a 0%,#7f1d1d 45%,#450a0a 100%)' },
  indigo: { primary: '#4f46e5', primaryDark: '#4338ca', light: '#eef2ff', ringRgba: 'rgba(79,70,229,.30)',  gradient: 'linear-gradient(135deg,#4338ca 0%,#6366f1 100%)', heroDark: 'linear-gradient(135deg,#1e1b4b 0%,#3730a3 45%,#1e1b4b 100%)' },
  teal:   { primary: '#0d9488', primaryDark: '#0f766e', light: '#f0fdfa', ringRgba: 'rgba(13,148,136,.30)',  gradient: 'linear-gradient(135deg,#0f766e 0%,#14b8a6 100%)', heroDark: 'linear-gradient(135deg,#042f2e 0%,#115e59 45%,#042f2e 100%)' },
  black:  { primary: '#1f2937', primaryDark: '#0b0f17', light: '#f3f4f6', ringRgba: 'rgba(17,24,39,.30)',   gradient: 'linear-gradient(135deg,#0b0f17 0%,#374151 100%)', heroDark: 'linear-gradient(135deg,#000000 0%,#111827 45%,#000000 100%)' },
  amber:  { primary: '#b45309', primaryDark: '#92400e', light: '#fffbeb', ringRgba: 'rgba(180,83,9,.30)',   gradient: 'linear-gradient(135deg,#92400e 0%,#d97706 100%)', heroDark: 'linear-gradient(135deg,#3b2410 0%,#78350f 45%,#451a03 100%)' },
  navy:   { primary: '#1e3a8a', primaryDark: '#172554', light: '#eff6ff', ringRgba: 'rgba(30,58,138,.30)',  gradient: 'linear-gradient(135deg,#172554 0%,#2563eb 100%)', heroDark: 'linear-gradient(135deg,#0a1024 0%,#172554 45%,#0a1024 100%)' },
} satisfies Record<string, SportTheme>

// ── Shared event catalogs ──────────────────────────────────────────────────────
const EV = {
  goal:       { type: 'goal',        icon: 'ball' as const,       countsForTeam: true, hasAssist: true, stat: true, label: { ru: 'Гол',        kz: 'Гол',       en: 'Goal' } },
  ownGoal:    { type: 'own_goal',    icon: 'ball' as const,       countsForOpponent: true,                          label: { ru: 'Автогол',    kz: 'Автогол',   en: 'Own goal' } },
  assist:     { type: 'assist',      icon: 'assist' as const,     stat: true,                                       label: { ru: 'Ассист',     kz: 'Ассист',    en: 'Assist' } },
  yellow:     { type: 'yellow_card', icon: 'yellow' as const,     stat: true,                                       label: { ru: 'ЖК',         kz: 'СК',        en: 'YC' } },
  red:        { type: 'red_card',    icon: 'red' as const,        stat: true,                                       label: { ru: 'КК',         kz: 'ҚК',        en: 'RC' } },
  penalty:    { type: 'penalty',     icon: 'warn' as const,       stat: true,                                       label: { ru: 'Удаление',   kz: 'Айып',      en: 'Penalty' } },
  threePt:    { type: 'three_pointer', icon: 'three' as const,    stat: true,                                       label: { ru: '3-очковый',  kz: '3 ұпай',    en: '3-pointer' } },
  foul:       { type: 'foul',        icon: 'foul' as const,       stat: true,                                       label: { ru: 'Фол',        kz: 'Фол',       en: 'Foul' } },
  ace:        { type: 'ace',         icon: 'ace' as const,        stat: true,                                       label: { ru: 'Эйс',        kz: 'Эйс',       en: 'Ace' } },
  block:      { type: 'block',       icon: 'block' as const,      stat: true,                                       label: { ru: 'Блок',       kz: 'Блок',      en: 'Block' } },
  knockdown:  { type: 'knockdown',   icon: 'ko' as const,         stat: true,                                       label: { ru: 'Нокдаун',    kz: 'Нокдаун',   en: 'Knockdown' } },
  submission: { type: 'submission',  icon: 'submission' as const, stat: true,                                       label: { ru: 'Сабмишн',    kz: 'Сабмишн',   en: 'Submission' } },
  warning:    { type: 'warning',     icon: 'warn' as const,       stat: true,                                       label: { ru: 'Предупр.',   kz: 'Ескерту',   en: 'Warning' } },
  touchdown:  { type: 'touchdown',   icon: 'touchdown' as const,  stat: true,                                       label: { ru: 'Тачдаун',    kz: 'Тачдаун',   en: 'Touchdown' } },
  fieldGoal:  { type: 'field_goal',  icon: 'star' as const,       stat: true,                                       label: { ru: 'Филд-гол',   kz: 'Филд-гол',  en: 'Field goal' } },
  run:        { type: 'run',         icon: 'run' as const,        stat: true,                                       label: { ru: 'Ран',        kz: 'Ран',       en: 'Run' } },
  homeRun:    { type: 'home_run',    icon: 'star' as const,       stat: true,                                       label: { ru: 'Хоумран',    kz: 'Хоумран',   en: 'Home run' } },
  strikeout:  { type: 'strikeout',   icon: 'strike' as const,     stat: true,                                       label: { ru: 'Страйкаут',  kz: 'Страйкаут', en: 'Strikeout' } },
  kokparGoal: { type: 'goal',        icon: 'ball' as const,       countsForTeam: true, stat: true,                  label: { ru: 'Гол',        kz: 'Гол',       en: 'Goal' } },
} satisfies Record<string, EventDef>

const EVENTS = {
  football:   [EV.goal, EV.ownGoal, EV.assist, EV.yellow, EV.red],
  hockey:     [EV.goal, EV.ownGoal, EV.assist, EV.penalty],
  basketball: [EV.threePt, EV.foul],
  volleyball: [EV.ace, EV.block],
  racket:     [EV.ace],
  combat:     [EV.knockdown, EV.submission, EV.warning],
  americanFb: [EV.touchdown, EV.fieldGoal],
  baseball:   [EV.homeRun, EV.run, EV.strikeout],
  kokpar:     [EV.kokparGoal, EV.ownGoal, EV.warning],
  none:       [] as EventDef[],
} satisfies Record<string, EventDef[]>

const ALL_FORMATS: Format[] = ['round_robin', 'playoff', 'groups_playoff', 'league_playoff']

// ── Categories ───────────────────────────────────────────────────────────────
export const SPORT_CATEGORIES: SportCategory[] = [
  {
    id: 'football', abbr: 'F', icon: SoccerBall, proOnly: false, theme: THEME.green,
    participantKind: 'team', scoreMode: 'count', events: EVENTS.football,
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
    id: 'basketball', abbr: 'B', icon: BasketballBall, proOnly: true, theme: THEME.orange,
    participantKind: 'team', scoreMode: 'manual', events: EVENTS.basketball,
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
    participantKind: 'team', scoreMode: 'manual', events: EVENTS.volleyball,
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
    id: 'hockey', abbr: 'H', icon: HockeyPuck, proOnly: true, theme: THEME.cyan,
    participantKind: 'team', scoreMode: 'count', events: EVENTS.hockey,
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
    id: 'racket', abbr: 'R', icon: TennisRacket, proOnly: true, theme: THEME.teal, individual: true,
    participantKind: 'participant', scoreMode: 'manual', events: EVENTS.racket,
    label:   { ru: 'Ракеточные виды', kz: 'Ракетка ойындары', en: 'Racket sports' },
    tagline: { ru: 'Теннис, наст. теннис, бадминтон, сквош, падел', kz: 'Теннис, үстел теннисі, бадминтон, сквош, падел', en: 'Tennis, table tennis, badminton, squash, padel' },
    subtypes: [
      {
        value: 'tennis',
        label: { ru: 'Теннис', kz: 'Теннис', en: 'Tennis' },
        desc:  { ru: 'Счёт матча — выигранные сеты (обычно до 2 из 3).', kz: 'Матч есебі — ұтылған сеттер (әдетте 3-тен 2).', en: 'Match score = sets won (usually best of 3).' },
        periods: 3, periodOptions: [3, 5], duration: 0, extraTime: false, pts: { win: 3, draw: 0, loss: 0 }, noDraw: true, hideDuration: true,
        periodLabel: { ru: 'Сеты', kz: 'Сеттер', en: 'Sets' }, durationLabel: { ru: 'Сеты', kz: 'Сеттер', en: 'Sets' },
        scoreNote: { ru: 'Счёт матча — количество выигранных сетов (например 2:1). Ничьих нет.', kz: 'Матч есебі — ұтылған сеттер саны. Теңсіз.', en: 'Match score = sets won (e.g. 2:1). No draws.' },
        recommendedFormat: 'playoff', formats: ['playoff', 'groups_playoff', 'round_robin', 'swiss'],
      },
      {
        value: 'table_tennis',
        label: { ru: 'Настольный теннис', kz: 'Үстел теннисі', en: 'Table tennis' },
        desc:  { ru: 'Партии до 11 очков, до 3 из 5. Счёт — выигранные партии.', kz: 'Партиялар 11 ұпайға, 5-тен 3. Есеп — ұтылған партиялар.', en: 'Games to 11, best of 5. Score = games won.' },
        periods: 5, periodOptions: [3, 5, 7], duration: 0, extraTime: false, pts: { win: 3, draw: 0, loss: 0 }, noDraw: true, hideDuration: true,
        periodLabel: { ru: 'Партии', kz: 'Партиялар', en: 'Games' }, durationLabel: { ru: 'Партии', kz: 'Партиялар', en: 'Games' },
        scoreNote: { ru: 'Счёт матча — количество выигранных партий (например 3:2). Ничьих нет.', kz: 'Матч есебі — ұтылған партиялар саны. Теңсіз.', en: 'Match score = games won (e.g. 3:2). No draws.' },
        recommendedFormat: 'groups_playoff', formats: ['groups_playoff', 'playoff', 'round_robin', 'swiss'],
      },
      {
        value: 'badminton',
        label: { ru: 'Бадминтон', kz: 'Бадминтон', en: 'Badminton' },
        desc:  { ru: 'Партии до 21 очка, до 2 из 3. Счёт — выигранные партии.', kz: 'Партиялар 21 ұпайға, 3-тен 2. Есеп — ұтылған партиялар.', en: 'Games to 21, best of 3. Score = games won.' },
        periods: 3, periodOptions: [3], duration: 0, extraTime: false, pts: { win: 3, draw: 0, loss: 0 }, noDraw: true, hideDuration: true,
        periodLabel: { ru: 'Партии', kz: 'Партиялар', en: 'Games' }, durationLabel: { ru: 'Партии', kz: 'Партиялар', en: 'Games' },
        scoreNote: { ru: 'Счёт матча — количество выигранных партий (например 2:1). Ничьих нет.', kz: 'Матч есебі — ұтылған партиялар саны. Теңсіз.', en: 'Match score = games won (e.g. 2:1). No draws.' },
        recommendedFormat: 'playoff', formats: ['playoff', 'groups_playoff', 'round_robin', 'swiss'],
      },
      {
        value: 'squash',
        label: { ru: 'Сквош', kz: 'Сквош', en: 'Squash' },
        desc:  { ru: 'Партии до 11 очков, до 3 из 5. Счёт — выигранные партии.', kz: 'Партиялар 11 ұпайға, 5-тен 3. Есеп — ұтылған партиялар.', en: 'Games to 11, best of 5. Score = games won.' },
        periods: 5, periodOptions: [3, 5], duration: 0, extraTime: false, pts: { win: 3, draw: 0, loss: 0 }, noDraw: true, hideDuration: true,
        periodLabel: { ru: 'Партии', kz: 'Партиялар', en: 'Games' }, durationLabel: { ru: 'Партии', kz: 'Партиялар', en: 'Games' },
        scoreNote: { ru: 'Счёт матча — количество выигранных партий (например 3:1). Ничьих нет.', kz: 'Матч есебі — ұтылған партиялар саны. Теңсіз.', en: 'Match score = games won. No draws.' },
        recommendedFormat: 'playoff', formats: ['playoff', 'groups_playoff', 'round_robin', 'swiss'],
      },
      {
        value: 'padel',
        label: { ru: 'Падел', kz: 'Падел', en: 'Padel' },
        desc:  { ru: 'Пара 2×2. Счёт матча — выигранные сеты (до 2 из 3).', kz: 'Жұп 2×2. Матч есебі — ұтылған сеттер (3-тен 2).', en: 'Doubles 2v2. Match score = sets won (best of 3).' },
        periods: 3, periodOptions: [3], duration: 0, extraTime: false, pts: { win: 3, draw: 0, loss: 0 }, noDraw: true, hideDuration: true,
        periodLabel: { ru: 'Сеты', kz: 'Сеттер', en: 'Sets' }, durationLabel: { ru: 'Сеты', kz: 'Сеттер', en: 'Sets' },
        scoreNote: { ru: 'Счёт матча — количество выигранных сетов (например 2:1). Ничьих нет.', kz: 'Матч есебі — ұтылған сеттер саны. Теңсіз.', en: 'Match score = sets won (e.g. 2:1). No draws.' },
        recommendedFormat: 'groups_playoff', formats: ['groups_playoff', 'playoff', 'round_robin', 'swiss'],
      },
    ],
  },
  {
    id: 'esports', abbr: 'E', icon: Gamepad2, proOnly: true, theme: THEME.violet,
    participantKind: 'team', scoreMode: 'manual', events: EVENTS.none,
    label:   { ru: 'Киберспорт', kz: 'Киберспорт', en: 'Esports' },
    tagline: { ru: 'EA FC, CS, Dota 2, Valorant', kz: 'EA FC, CS, Dota 2, Valorant', en: 'EA FC, CS, Dota 2, Valorant' },
    subtypes: [
      {
        value: 'eafc',
        label: { ru: 'EA FC (FIFA)', kz: 'EA FC (FIFA)', en: 'EA FC (FIFA)' },
        desc:  { ru: 'Футбольный симулятор 1×1. Счёт — голы в матче.', kz: 'Футбол симуляторы 1×1. Есеп — матчтағы голдар.', en: 'Football sim 1v1. Score = goals per match.' },
        periods: 1, periodOptions: [1], duration: 6, extraTime: false, pts: { win: 3, draw: 1, loss: 0 },
        periodLabel: { ru: 'Матчи', kz: 'Матчтар', en: 'Games' }, durationLabel: { ru: 'Длительность тайма', kz: 'Тайм ұзақтығы', en: 'Half length' },
        recommendedFormat: 'playoff', formats: ['playoff', 'groups_playoff', 'round_robin', 'swiss'],
      },
      {
        value: 'cs',
        label: { ru: 'Counter-Strike', kz: 'Counter-Strike', en: 'Counter-Strike' },
        desc:  { ru: 'Командный шутер 5×5. Счёт — выигранные карты.', kz: 'Командалық атыс 5×5. Есеп — ұтылған карталар.', en: 'Team shooter 5v5. Score = maps won.' },
        periods: 1, periodOptions: [1], duration: 0, extraTime: false, pts: { win: 3, draw: 0, loss: 0 }, noDraw: true, hideDuration: true,
        periodLabel: { ru: 'Карты', kz: 'Карталар', en: 'Maps' }, durationLabel: { ru: 'Карты', kz: 'Карталар', en: 'Maps' },
        scoreNote: { ru: 'Счёт серии — количество выигранных карт (например 2:1). Обычно Bo1/Bo3/Bo5, ничьих нет.', kz: 'Серия есебі — ұтылған карталар саны. Bo1/Bo3/Bo5, теңсіз.', en: 'Series score = maps won (e.g. 2:1). Usually Bo1/Bo3/Bo5, no draws.' },
        recommendedFormat: 'playoff', formats: ['playoff', 'groups_playoff', 'swiss', 'round_robin'],
      },
      {
        value: 'dota',
        label: { ru: 'Dota 2', kz: 'Dota 2', en: 'Dota 2' },
        desc:  { ru: 'MOBA 5×5. Счёт — выигранные карты.', kz: 'MOBA 5×5. Есеп — ұтылған карталар.', en: 'MOBA 5v5. Score = maps won.' },
        periods: 1, periodOptions: [1], duration: 0, extraTime: false, pts: { win: 3, draw: 0, loss: 0 }, noDraw: true, hideDuration: true,
        periodLabel: { ru: 'Карты', kz: 'Карталар', en: 'Maps' }, durationLabel: { ru: 'Карты', kz: 'Карталар', en: 'Maps' },
        scoreNote: { ru: 'Счёт серии — количество выигранных карт (например 2:1). Обычно Bo3/Bo5, ничьих нет.', kz: 'Серия есебі — ұтылған карталар саны. Bo3/Bo5, теңсіз.', en: 'Series score = maps won (e.g. 2:1). Usually Bo3/Bo5, no draws.' },
        recommendedFormat: 'playoff', formats: ['playoff', 'groups_playoff', 'swiss', 'round_robin'],
      },
      {
        value: 'valorant',
        label: { ru: 'Valorant', kz: 'Valorant', en: 'Valorant' },
        desc:  { ru: 'Тактический шутер 5×5. Счёт — выигранные карты.', kz: 'Тактикалық атыс 5×5. Есеп — ұтылған карталар.', en: 'Tactical shooter 5v5. Score = maps won.' },
        periods: 1, periodOptions: [1], duration: 0, extraTime: false, pts: { win: 3, draw: 0, loss: 0 }, noDraw: true, hideDuration: true,
        periodLabel: { ru: 'Карты', kz: 'Карталар', en: 'Maps' }, durationLabel: { ru: 'Карты', kz: 'Карталар', en: 'Maps' },
        scoreNote: { ru: 'Счёт серии — количество выигранных карт (например 2:1). Обычно Bo3/Bo5, ничьих нет.', kz: 'Серия есебі — ұтылған карталар саны. Bo3/Bo5, теңсіз.', en: 'Series score = maps won (e.g. 2:1). Usually Bo3/Bo5, no draws.' },
        recommendedFormat: 'playoff', formats: ['playoff', 'groups_playoff', 'swiss', 'round_robin'],
      },
      {
        value: 'mobile_legends',
        label: { ru: 'Mobile Legends', kz: 'Mobile Legends', en: 'Mobile Legends' },
        desc:  { ru: 'Мобильная MOBA 5×5. Счёт — выигранные карты.', kz: 'Мобильді MOBA 5×5. Есеп — ұтылған карталар.', en: 'Mobile MOBA 5v5. Score = maps won.' },
        periods: 1, periodOptions: [1], duration: 0, extraTime: false, pts: { win: 3, draw: 0, loss: 0 }, noDraw: true, hideDuration: true,
        periodLabel: { ru: 'Карты', kz: 'Карталар', en: 'Maps' }, durationLabel: { ru: 'Карты', kz: 'Карталар', en: 'Maps' },
        scoreNote: { ru: 'Счёт серии — количество выигранных карт (например 2:1). Обычно Bo3/Bo5, ничьих нет.', kz: 'Серия есебі — ұтылған карталар саны. Bo3/Bo5, теңсіз.', en: 'Series score = maps won (e.g. 2:1). Usually Bo3/Bo5, no draws.' },
        recommendedFormat: 'playoff', formats: ['playoff', 'groups_playoff', 'swiss', 'round_robin'],
      },
      {
        value: 'starcraft',
        label: { ru: 'StarCraft II', kz: 'StarCraft II', en: 'StarCraft II' },
        desc:  { ru: 'RTS 1×1. Счёт — выигранные карты.', kz: 'RTS 1×1. Есеп — ұтылған карталар.', en: 'RTS 1v1. Score = maps won.' },
        periods: 1, periodOptions: [1], duration: 0, extraTime: false, pts: { win: 3, draw: 0, loss: 0 }, noDraw: true, hideDuration: true,
        periodLabel: { ru: 'Карты', kz: 'Карталар', en: 'Maps' }, durationLabel: { ru: 'Карты', kz: 'Карталар', en: 'Maps' },
        scoreNote: { ru: 'Счёт серии — количество выигранных карт (например 3:1). Обычно Bo3/Bo5, ничьих нет.', kz: 'Серия есебі — ұтылған карталар саны. Bo3/Bo5, теңсіз.', en: 'Series score = maps won. Usually Bo3/Bo5, no draws.' },
        recommendedFormat: 'playoff', formats: ['playoff', 'groups_playoff', 'swiss', 'round_robin'],
      },
      {
        value: 'fighting',
        label: { ru: 'Файтинги (Tekken/MK)', kz: 'Файтингтер (Tekken/MK)', en: 'Fighting (Tekken/MK)' },
        desc:  { ru: 'Tekken, Mortal Kombat, Street Fighter 1×1. Счёт — выигранные партии.', kz: 'Tekken, Mortal Kombat 1×1. Есеп — ұтылған партиялар.', en: 'Tekken, Mortal Kombat, Street Fighter 1v1. Score = games won.' },
        periods: 1, periodOptions: [1], duration: 0, extraTime: false, pts: { win: 3, draw: 0, loss: 0 }, noDraw: true, hideDuration: true,
        periodLabel: { ru: 'Партии', kz: 'Партиялар', en: 'Games' }, durationLabel: { ru: 'Партии', kz: 'Партиялар', en: 'Games' },
        scoreNote: { ru: 'Счёт серии — количество выигранных партий (например 3:2). Обычно Bo5/Bo7, ничьих нет.', kz: 'Серия есебі — ұтылған партиялар саны. Bo5/Bo7, теңсіз.', en: 'Series score = games won. Usually Bo5/Bo7, no draws.' },
        recommendedFormat: 'playoff', formats: ['playoff', 'groups_playoff', 'swiss', 'round_robin'],
      },
      {
        value: 'hearthstone',
        label: { ru: 'Hearthstone', kz: 'Hearthstone', en: 'Hearthstone' },
        desc:  { ru: 'Карточная игра 1×1. Счёт — выигранные партии.', kz: 'Карта ойыны 1×1. Есеп — ұтылған партиялар.', en: 'Card game 1v1. Score = games won.' },
        periods: 1, periodOptions: [1], duration: 0, extraTime: false, pts: { win: 3, draw: 0, loss: 0 }, noDraw: true, hideDuration: true,
        periodLabel: { ru: 'Партии', kz: 'Партиялар', en: 'Games' }, durationLabel: { ru: 'Партии', kz: 'Партиялар', en: 'Games' },
        scoreNote: { ru: 'Счёт серии — количество выигранных партий (например 3:1). Обычно Bo3/Bo5, ничьих нет.', kz: 'Серия есебі — ұтылған партиялар саны. Bo3/Bo5, теңсіз.', en: 'Series score = games won. Usually Bo3/Bo5, no draws.' },
        recommendedFormat: 'playoff', formats: ['playoff', 'groups_playoff', 'swiss', 'round_robin'],
      },
      {
        value: 'pubg',
        label: { ru: 'PUBG', kz: 'PUBG', en: 'PUBG' },
        desc:  { ru: 'Battle royale. Рейтинг по очкам за серию матчей.', kz: 'Battle royale. Матчтар сериясы бойынша ұпай рейтингі.', en: 'Battle royale. Points ranking across a series of matches.' },
        periods: 1, periodOptions: [1], duration: 0, extraTime: false, pts: { win: 0, draw: 0, loss: 0 }, noDraw: true, hideDuration: true,
        periodLabel: { ru: 'Матчи', kz: 'Матчтар', en: 'Matches' }, durationLabel: { ru: 'Матчи', kz: 'Матчтар', en: 'Matches' },
        scoreNote: { ru: 'Итог — сумма очков за все матчи. Победитель — с наибольшим счётом.', kz: 'Қорытынды — барлық матчтар ұпайының қосындысы.', en: 'Result = total points across all matches. Highest total wins.' },
        recommendedFormat: 'leaderboard', formats: ['leaderboard', 'round_robin'],
      },
      {
        value: 'fortnite',
        label: { ru: 'Fortnite', kz: 'Fortnite', en: 'Fortnite' },
        desc:  { ru: 'Battle royale. Рейтинг по очкам за серию матчей.', kz: 'Battle royale. Матчтар сериясы бойынша ұпай рейтингі.', en: 'Battle royale. Points ranking across a series of matches.' },
        periods: 1, periodOptions: [1], duration: 0, extraTime: false, pts: { win: 0, draw: 0, loss: 0 }, noDraw: true, hideDuration: true,
        periodLabel: { ru: 'Матчи', kz: 'Матчтар', en: 'Matches' }, durationLabel: { ru: 'Матчи', kz: 'Матчтар', en: 'Matches' },
        scoreNote: { ru: 'Итог — сумма очков за все матчи. Победитель — с наибольшим счётом.', kz: 'Қорытынды — барлық матчтар ұпайының қосындысы.', en: 'Result = total points across all matches. Highest total wins.' },
        recommendedFormat: 'leaderboard', formats: ['leaderboard', 'round_robin'],
      },
    ],
  },
  {
    id: 'boardgames', abbr: 'C', icon: ChessPawn, proOnly: true, theme: THEME.indigo, individual: true,
    participantKind: 'participant', scoreMode: 'manual', events: EVENTS.none,
    label:   { ru: 'Интеллектуальные игры', kz: 'Зияткерлік ойындар', en: 'Mind sports' },
    tagline: { ru: 'Шахматы и шашки', kz: 'Шахмат және дойбы', en: 'Chess & checkers' },
    subtypes: [
      {
        value: 'chess',
        label: { ru: 'Шахматы', kz: 'Шахмат', en: 'Chess' },
        desc:  { ru: 'Швейцарка или круговой. Победа/ничья/поражение.', kz: 'Швейцарлық не айналмалы. Жеңіс/тең/жеңіліс.', en: 'Swiss or round-robin. Win/draw/loss.' },
        periods: 1, periodOptions: [1], duration: 0, extraTime: false, pts: { win: 1, draw: 1, loss: 0 }, hideDuration: true,
        periodLabel: { ru: 'Партии', kz: 'Партиялар', en: 'Games' }, durationLabel: { ru: 'Контроль времени', kz: 'Уақыт бақылауы', en: 'Time control' },
        scoreNote: { ru: 'Результат партии: 1 — победа, ½ — ничья, 0 — поражение. Очки таблицы задаются ниже (по умолчанию 1 за победу).', kz: 'Партия нәтижесі: 1 — жеңіс, ½ — тең, 0 — жеңіліс. Кесте ұпайлары төменде.', en: 'Game result: 1 win, ½ draw, 0 loss. Table points set below.' },
        recommendedFormat: 'swiss', formats: ['swiss', 'round_robin', 'playoff', 'groups_playoff'],
      },
      {
        value: 'checkers',
        label: { ru: 'Шашки', kz: 'Дойбы', en: 'Checkers' },
        desc:  { ru: 'Швейцарка или круговой. Победа/ничья/поражение.', kz: 'Швейцарлық не айналмалы. Жеңіс/тең/жеңіліс.', en: 'Swiss or round-robin. Win/draw/loss.' },
        periods: 1, periodOptions: [1], duration: 0, extraTime: false, pts: { win: 1, draw: 1, loss: 0 }, hideDuration: true,
        periodLabel: { ru: 'Партии', kz: 'Партиялар', en: 'Games' }, durationLabel: { ru: 'Контроль времени', kz: 'Уақыт бақылауы', en: 'Time control' },
        scoreNote: { ru: 'Результат партии: 1 — победа, ½ — ничья, 0 — поражение. Очки таблицы задаются ниже.', kz: 'Партия нәтижесі: 1 — жеңіс, ½ — тең, 0 — жеңіліс. Кесте ұпайлары төменде.', en: 'Game result: 1 win, ½ draw, 0 loss. Table points set below.' },
        recommendedFormat: 'swiss', formats: ['swiss', 'round_robin', 'playoff', 'groups_playoff'],
      },
    ],
  },
  {
    id: 'combat', abbr: 'M', icon: MmaGlove, proOnly: true, theme: THEME.black, individual: true,
    participantKind: 'fighter', scoreMode: 'manual', events: EVENTS.combat,
    label:   { ru: 'Единоборства', kz: 'Жекпе-жек', en: 'Combat sports' },
    tagline: { ru: 'MMA, бокс, борьба', kz: 'MMA, бокс, күрес', en: 'MMA, boxing, wrestling' },
    subtypes: [
      {
        value: 'mma',
        label: { ru: 'MMA', kz: 'MMA', en: 'MMA' },
        desc:  { ru: 'Смешанные единоборства. Сетка на выбывание.', kz: 'Аралас жекпе-жек. Жою сеткасы.', en: 'Mixed martial arts. Elimination bracket.' },
        periods: 3, periodOptions: [3, 5], duration: 5, extraTime: false, pts: { win: 3, draw: 0, loss: 0 }, noDraw: true, hideDuration: false,
        periodLabel: { ru: 'Раунды', kz: 'Раундтар', en: 'Rounds' }, durationLabel: { ru: 'Длительность раунда', kz: 'Раунд ұзақтығы', en: 'Round length' },
        recommendedFormat: 'playoff', formats: ['playoff', 'groups_playoff', 'round_robin'],
      },
      {
        value: 'boxing',
        label: { ru: 'Бокс', kz: 'Бокс', en: 'Boxing' },
        desc:  { ru: 'Бокс по раундам. Возможна ничья.', kz: 'Раундтармен бокс. Тең болуы мүмкін.', en: 'Boxing by rounds. Draws possible.' },
        periods: 3, periodOptions: [3, 5, 12], duration: 3, extraTime: false, pts: { win: 3, draw: 1, loss: 0 },
        periodLabel: { ru: 'Раунды', kz: 'Раундтар', en: 'Rounds' }, durationLabel: { ru: 'Длительность раунда', kz: 'Раунд ұзақтығы', en: 'Round length' },
        recommendedFormat: 'playoff', formats: ['playoff', 'groups_playoff', 'round_robin'],
      },
      {
        value: 'wrestling',
        label: { ru: 'Борьба', kz: 'Күрес', en: 'Wrestling' },
        desc:  { ru: 'Борьба / грэпплинг. Сетка на выбывание.', kz: 'Күрес / грэпплинг. Жою сеткасы.', en: 'Wrestling / grappling. Elimination bracket.' },
        periods: 2, periodOptions: [1, 2, 3], duration: 3, extraTime: false, pts: { win: 3, draw: 0, loss: 0 }, noDraw: true, hideDuration: false,
        periodLabel: { ru: 'Периоды', kz: 'Кезеңдер', en: 'Periods' }, durationLabel: { ru: 'Длительность периода', kz: 'Кезең ұзақтығы', en: 'Period length' },
        recommendedFormat: 'playoff', formats: ['playoff', 'groups_playoff', 'round_robin'],
      },
    ],
  },
  {
    id: 'nomad', abbr: 'N', icon: Yurt, proOnly: true, theme: THEME.amber,
    participantKind: 'participant', scoreMode: 'manual', events: EVENTS.none,
    label:   { ru: 'Кочевые игры', kz: 'Ұлттық ойындар', en: 'Nomad games' },
    tagline: { ru: 'Көкпар, тоғызқұмалақ, қазақ күресі', kz: 'Көкпар, тоғызқұмалақ, қазақ күресі', en: 'Kokpar, togyzkumalak, kazakh wrestling' },
    subtypes: [
      {
        value: 'kokpar',
        label: { ru: 'Көкпар', kz: 'Көкпар', en: 'Kokpar' },
        desc:  { ru: 'Конная командная игра. Счёт — заброшенные в казандык очки.', kz: 'Атпен командалық ойын. Есеп — қазандыққа тасталған ұпайлар.', en: 'Team horseback game. Score = goals into the kazan.' },
        periods: 2, periodOptions: [2, 3], duration: 20, extraTime: false, pts: { win: 3, draw: 1, loss: 0 },
        periodLabel: { ru: 'Таймы', kz: 'Таймдар', en: 'Halves' }, durationLabel: { ru: 'Длительность тайма', kz: 'Тайм ұзақтығы', en: 'Half duration' },
        recommendedFormat: 'round_robin', formats: ['round_robin', 'groups_playoff', 'playoff', 'league_playoff'],
        scoreMode: 'count', events: EVENTS.kokpar, participantKind: 'team',
      },
      {
        value: 'kazaksha_kures',
        label: { ru: 'Қазақ күресі', kz: 'Қазақ күресі', en: 'Kazakh kuresi' },
        desc:  { ru: 'Национальная борьба на поясах. Сетка на выбывание.', kz: 'Белбеу ұстасып күресу. Жою сеткасы.', en: 'National belt wrestling. Elimination bracket.' },
        periods: 1, periodOptions: [1], duration: 3, extraTime: false, pts: { win: 3, draw: 0, loss: 0 }, noDraw: true,
        periodLabel: { ru: 'Схватки', kz: 'Тартыстар', en: 'Bouts' }, durationLabel: { ru: 'Длительность схватки', kz: 'Тартыс ұзақтығы', en: 'Bout length' },
        recommendedFormat: 'playoff', formats: ['playoff', 'groups_playoff', 'round_robin'],
        participantKind: 'fighter', events: EVENTS.combat,
      },
      {
        value: 'audaryspak',
        label: { ru: 'Аударыспақ', kz: 'Аударыспақ', en: 'Audaryspak' },
        desc:  { ru: 'Борьба всадников верхом. Сетка на выбывание.', kz: 'Атқа мінген балуандар күресі. Жою сеткасы.', en: 'Mounted wrestling on horseback. Elimination bracket.' },
        periods: 1, periodOptions: [1], duration: 5, extraTime: false, pts: { win: 3, draw: 0, loss: 0 }, noDraw: true,
        periodLabel: { ru: 'Схватки', kz: 'Тартыстар', en: 'Bouts' }, durationLabel: { ru: 'Длительность схватки', kz: 'Тартыс ұзақтығы', en: 'Bout length' },
        recommendedFormat: 'playoff', formats: ['playoff', 'groups_playoff', 'round_robin'],
        participantKind: 'fighter', events: EVENTS.combat,
      },
      {
        value: 'togyzkumalak',
        label: { ru: 'Тоғызқұмалақ', kz: 'Тоғызқұмалақ', en: 'Togyzkumalak' },
        desc:  { ru: 'Интеллектуальная настольная игра. Швейцарка или круговой.', kz: 'Зияткерлік үстел ойыны. Швейцарлық не айналмалы.', en: 'Strategy board game. Swiss or round-robin.' },
        periods: 1, periodOptions: [1], duration: 0, extraTime: false, pts: { win: 1, draw: 1, loss: 0 }, hideDuration: true,
        periodLabel: { ru: 'Партии', kz: 'Партиялар', en: 'Games' }, durationLabel: { ru: 'Контроль времени', kz: 'Уақыт бақылауы', en: 'Time control' },
        scoreNote: { ru: 'Результат партии: 1 — победа, ½ — ничья, 0 — поражение. Очки таблицы задаются ниже.', kz: 'Партия нәтижесі: 1 — жеңіс, ½ — тең, 0 — жеңіліс. Кесте ұпайлары төменде.', en: 'Game result: 1 win, ½ draw, 0 loss. Table points set below.' },
        recommendedFormat: 'swiss', formats: ['swiss', 'round_robin', 'playoff', 'groups_playoff'],
        participantKind: 'participant', events: EVENTS.none,
      },
      {
        value: 'asyk_atu',
        label: { ru: 'Асық ату', kz: 'Асық ату', en: 'Asyk atu' },
        desc:  { ru: 'Национальная игра в асыки. Рейтинг по сумме очков.', kz: 'Асық ойыны. Ұпай қосындысы бойынша рейтинг.', en: 'Traditional knucklebone game. Points ranking.' },
        periods: 1, periodOptions: [1], duration: 0, extraTime: false, pts: { win: 0, draw: 0, loss: 0 }, noDraw: true, hideDuration: true,
        periodLabel: { ru: 'Раунды', kz: 'Раундтар', en: 'Rounds' }, durationLabel: { ru: 'Раунды', kz: 'Раундтар', en: 'Rounds' },
        scoreNote: { ru: 'Итог — сумма очков за раунды. Побеждает набравший больше.', kz: 'Қорытынды — раундтар ұпайының қосындысы. Көп жинаған жеңеді.', en: 'Result = total points across rounds. Highest total wins.' },
        recommendedFormat: 'leaderboard', formats: ['leaderboard', 'round_robin', 'playoff'],
        participantKind: 'participant', events: EVENTS.none,
      },
    ],
  },
  {
    id: 'american', abbr: 'A', icon: AmericanFootball, proOnly: true, theme: THEME.navy,
    participantKind: 'team', scoreMode: 'manual', events: EVENTS.none,
    label:   { ru: 'Американские', kz: 'Америкалық', en: 'American sports' },
    tagline: { ru: 'Американский футбол, бейсбол, лакросс', kz: 'Америкалық футбол, бейсбол, лакросс', en: 'American football, baseball, lacrosse' },
    subtypes: [
      {
        value: 'american_football',
        label: { ru: 'Американский футбол', kz: 'Америкалық футбол', en: 'American football' },
        desc:  { ru: '4 четверти по 15 минут. Тачдаун, филд-гол. Без ничьих.', kz: '15 минуттан 4 ширек. Тачдаун, филд-гол. Теңсіз.', en: 'Four 15-minute quarters. Touchdowns & field goals. No draws.' },
        periods: 4, periodOptions: [2, 4], duration: 15, extraTime: true, pts: { win: 2, draw: 0, loss: 0 }, noDraw: true,
        periodLabel: { ru: 'Четверти', kz: 'Ширектер', en: 'Quarters' }, durationLabel: { ru: 'Длительность четверти', kz: 'Ширек ұзақтығы', en: 'Quarter duration' },
        recommendedFormat: 'league_playoff', formats: ['league_playoff', 'playoff', 'groups_playoff', 'round_robin'],
        events: EVENTS.americanFb,
      },
      {
        value: 'flag_football',
        label: { ru: 'Флаг-футбол', kz: 'Флаг-футбол', en: 'Flag football' },
        desc:  { ru: 'Бесконтактный формат 5×5. Тачдауны. Без ничьих.', kz: 'Контактсыз 5×5 формат. Тачдаундар. Теңсіз.', en: 'Non-contact 5v5 format. Touchdowns. No draws.' },
        periods: 2, periodOptions: [2], duration: 20, extraTime: false, pts: { win: 2, draw: 0, loss: 0 }, noDraw: true,
        periodLabel: { ru: 'Таймы', kz: 'Таймдар', en: 'Halves' }, durationLabel: { ru: 'Длительность тайма', kz: 'Тайм ұзақтығы', en: 'Half duration' },
        recommendedFormat: 'groups_playoff', formats: ['groups_playoff', 'playoff', 'round_robin', 'league_playoff'],
        events: EVENTS.americanFb,
      },
      {
        value: 'baseball',
        label: { ru: 'Бейсбол', kz: 'Бейсбол', en: 'Baseball' },
        desc:  { ru: '9 иннингов. Счёт — раны (очки). Без ничьих.', kz: '9 иннинг. Есеп — рандар. Теңсіз.', en: 'Nine innings. Score = runs. No draws.' },
        periods: 9, periodOptions: [7, 9], duration: 0, extraTime: true, pts: { win: 2, draw: 0, loss: 0 }, noDraw: true, hideDuration: true,
        periodLabel: { ru: 'Иннинги', kz: 'Иннингтер', en: 'Innings' }, durationLabel: { ru: 'Иннинги', kz: 'Иннингтер', en: 'Innings' },
        scoreNote: { ru: 'Счёт матча — количество ранов (например 5:3). Ничьих нет.', kz: 'Матч есебі — рандар саны. Теңсіз.', en: 'Match score = runs (e.g. 5:3). No draws.' },
        recommendedFormat: 'league_playoff', formats: ['league_playoff', 'round_robin', 'playoff', 'groups_playoff'],
        events: EVENTS.baseball,
      },
      {
        value: 'lacrosse',
        label: { ru: 'Лакросс', kz: 'Лакросс', en: 'Lacrosse' },
        desc:  { ru: '4 четверти. Счёт — голы. Есть овертайм.', kz: '4 ширек. Есеп — голдар. Овертайм бар.', en: 'Four quarters. Score = goals. Overtime on.' },
        periods: 4, periodOptions: [4], duration: 15, extraTime: true, pts: { win: 3, draw: 1, loss: 0 },
        periodLabel: { ru: 'Четверти', kz: 'Ширектер', en: 'Quarters' }, durationLabel: { ru: 'Длительность четверти', kz: 'Ширек ұзақтығы', en: 'Quarter duration' },
        recommendedFormat: 'league_playoff', formats: ['league_playoff', 'round_robin', 'playoff', 'groups_playoff'],
        scoreMode: 'count', events: [EV.goal, EV.assist],
      },
    ],
  },
  {
    id: 'other', abbr: '•', icon: HelpCircle, proOnly: true, theme: THEME.gray,
    participantKind: 'team', scoreMode: 'manual', events: EVENTS.none,
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

// ── Discipline-aware resolvers (events, scoring, competitor noun) ──────────────
// The in-match events offered for a sport (subtype override → category → football).
export function getEventDefs(value: string | null | undefined): EventDef[] {
  if (!value) return EVENTS.football
  const hit = SUBTYPE_INDEX[value]
  if (!hit) return EVENTS.football
  return hit.subtype.events ?? hit.category.events ?? EVENTS.football
}

// 'count' → score is derived from goal-like events; 'manual' → score inputs.
export function getScoreMode(value: string | null | undefined): ScoreMode {
  if (!value) return 'count'
  const hit = SUBTYPE_INDEX[value]
  if (!hit) return 'count'
  return hit.subtype.scoreMode ?? hit.category.scoreMode ?? 'count'
}

// How to name a competitor for this sport: team / participant / fighter.
export function getParticipantKind(value: string | null | undefined): ParticipantKind {
  if (!value) return 'team'
  const hit = SUBTYPE_INDEX[value]
  if (!hit) return 'team'
  return hit.subtype.participantKind
    ?? hit.category.participantKind
    ?? (hit.category.individual ? 'participant' : 'team')
}
