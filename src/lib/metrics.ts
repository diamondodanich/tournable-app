// Типы и форматирование продуктовых метрик.
// Источник данных — RPC public.product_metrics() (миграция 034).
// Используется админ-страницей /admin/metrics и ежедневным Telegram-дайджестом.

export type ProductMetrics = {
  // Привлечение
  signups_today: number
  signups_7d: number
  signups_30d: number
  signups_total: number
  // Активация
  activated: number
  activation_rate: number
  median_hours_to_first: number | null
  // Возврат
  returning: number
  return_rate: number
  // Использование
  tournaments_total: number
  tournaments_7d: number
  avg_teams: number
  matches_played_7d: number
  completed_tournaments: number
  completion_rate: number
  abandoned_tournaments: number
  // Деньги
  pro_active: number
  enterprise_active: number
  mrr_kzt: number
  revenue_30d_kzt: number
  paying_users: number
  conversion_rate: number

  generated_at: string
}

/** Строка из RPC recent_users() — миграция 035 */
export type RecentUser = {
  user_id: string
  email: string
  signed_up_at: string
  plan: 'free' | 'pro' | 'enterprise'
  tournaments: number
  matches_played: number
  last_activity_at: string
}

const NUM = new Intl.NumberFormat('ru-RU')

/** Сводка для Telegram. Формат HTML (parse_mode: HTML). */
export function formatDigest(m: ProductMetrics, date = new Date()): string {
  const day = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  const pct = (v: number) => String(v).replace('.', ',')
  const n = (v: number) => NUM.format(v)

  const ttfv = m.median_hours_to_first === null
    ? '—'
    : m.median_hours_to_first < 48
      ? `${m.median_hours_to_first.toFixed(1).replace('.', ',')} ч`
      : `${(m.median_hours_to_first / 24).toFixed(1).replace('.', ',')} дн`

  return [
    `<b>Tournable · ${day}</b>`,
    '',
    `<b>Регистрации</b>`,
    `За сутки: <b>${n(m.signups_today)}</b> · за 7 дней: ${n(m.signups_7d)} · всего: ${n(m.signups_total)}`,
    '',
    `<b>Активация</b>`,
    `Создали турнир: <b>${n(m.activated)}</b> (${pct(m.activation_rate)} % от регистраций)`,
    `Медиана до первого турнира: ${ttfv}`,
    m.abandoned_tournaments > 0
      ? `Брошено без единого матча: ${n(m.abandoned_tournaments)}`
      : null,
    '',
    `<b>Возврат</b>`,
    `Создали 2-й турнир: <b>${n(m.returning)}</b> (${pct(m.return_rate)} %)`,
    '',
    `<b>Использование</b>`,
    `Турниров за 7 дней: ${n(m.tournaments_7d)} · сыграно матчей в них: ${n(m.matches_played_7d)}`,
    `Команд на турнир: ${String(m.avg_teams).replace('.', ',')} · доиграли до конца: ${pct(m.completion_rate)} %`,
    '',
    `<b>Деньги</b>`,
    `MRR: <b>${n(m.mrr_kzt)} ₸</b> · за 30 дней: ${n(m.revenue_30d_kzt)} ₸`,
    `Платящих: ${n(m.paying_users)} (Pro ${n(m.pro_active)}, Enterprise ${n(m.enterprise_active)}) · конверсия ${pct(m.conversion_rate)} %`,
  ]
    .filter(l => l !== null)
    .join('\n')
}
