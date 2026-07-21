import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, UserPlus, Rocket, Repeat, Trophy, Wallet, Clock, AlertTriangle, Users, TrendingUp,
} from 'lucide-react'
import type { ProductMetrics, RecentUser, TimeseriesPoint } from '@/lib/metrics'
import MetricsChartPanel from '@/components/admin/MetricsChartPanel'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Метрики', robots: { index: false, follow: false } }

const KZT = new Intl.NumberFormat('ru-RU')

function fmt(n: number | null | undefined, suffix = '') {
  if (n === null || n === undefined) return '—'
  return `${KZT.format(n)}${suffix}`
}

/** Часы → человекочитаемо: 3,5 ч / 2,1 дн */
function fmtHours(h: number | null | undefined) {
  if (h === null || h === undefined) return '—'
  if (h < 48) return `${h.toFixed(1).replace('.', ',')} ч`
  return `${(h / 24).toFixed(1).replace('.', ',')} дн`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  })
}

const PLAN_BADGE: Record<string, string> = {
  free:       'bg-gray-100 text-gray-500',
  pro:        'bg-emerald-100 text-emerald-700',
  enterprise: 'bg-violet-100 text-violet-700',
}

type Tone = 'emerald' | 'violet' | 'amber' | 'gray'

const TONES: Record<Tone, { icon: string; value: string }> = {
  emerald: { icon: 'bg-emerald-50 text-emerald-600', value: 'text-emerald-700' },
  violet:  { icon: 'bg-violet-50 text-violet-600',   value: 'text-violet-700'  },
  amber:   { icon: 'bg-amber-50 text-amber-600',     value: 'text-amber-700'   },
  gray:    { icon: 'bg-gray-100 text-gray-500',      value: 'text-gray-900'    },
}

function Stat({
  label, value, hint, tone = 'gray',
}: { label: string; value: string; hint?: string; tone?: Tone }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`text-2xl font-black mt-1.5 tabular-nums ${TONES[tone].value}`}>{value}</div>
      {hint && <div className="text-xs text-gray-500 mt-1 leading-snug">{hint}</div>}
    </div>
  )
}

function Section({
  title, icon: Icon, tone, children,
}: {
  title: string
  icon: React.ElementType
  tone: Tone
  children: React.ReactNode
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${TONES[tone].icon}`}>
          <Icon size={16} />
        </div>
        <h2 className="text-sm font-black uppercase tracking-wide text-gray-700">{title}</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{children}</div>
    </section>
  )
}

export default async function AdminMetricsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Layout уже редиректит гостей на /login, но рендерится параллельно с page —
  // без этой проверки страница успевает упасть на user.id раньше редиректа
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  // Не 403, а 404 — страница не должна выдавать факт своего существования
  if (!profile?.is_admin) notFound()

  const [{ data, error }, { data: usersData }, { data: seriesData, error: seriesError }] =
    await Promise.all([
      supabase.rpc('product_metrics'),
      supabase.rpc('recent_users', { limit_count: 50 }),
      supabase.rpc('metrics_timeseries', { days: 30 }),
    ])
  const m = data as ProductMetrics | null
  const users = (usersData ?? []) as RecentUser[]
  const series = (seriesData ?? []) as TimeseriesPoint[]

  if (error || !m) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={22} />
        </div>
        <h1 className="text-lg font-black text-gray-900">Метрики недоступны</h1>
        <p className="text-sm text-gray-500 mt-2">
          {error?.message ?? 'Пустой ответ'}
        </p>
        <p className="text-xs text-gray-400 mt-4">
          Если функция ещё не создана — примените миграцию 034_product_metrics.sql
        </p>
      </div>
    )
  }

  const updated = new Date(m.generated_at).toLocaleString('ru-RU', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="max-w-5xl mx-auto">

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 mb-6 transition-colors group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        Все турниры
      </Link>

      <div className="flex items-baseline justify-between gap-4 mb-8 flex-wrap">
        <h1 className="text-2xl font-black text-gray-900">Метрики продукта</h1>
        <span className="text-xs text-gray-400 tabular-nums">обновлено {updated}</span>
      </div>

      {/* ── Динамика ────────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center gap-2.5 mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${TONES.emerald.icon}`}>
            <TrendingUp size={16} />
          </div>
          <h2 className="text-sm font-black uppercase tracking-wide text-gray-700">Динамика роста</h2>
        </div>
        {seriesError ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900">График недоступен</div>
              <div className="text-xs text-gray-600 mt-1 break-words">{seriesError.message}</div>
              <div className="text-xs text-gray-500 mt-2">
                Если написано «structure of query does not match function result type» —
                примените миграцию 038_fix_timeseries_types.sql
              </div>
            </div>
          </div>
        ) : (
          <MetricsChartPanel initialData={series} initialDays={30} />
        )}
        <p className="text-xs text-gray-400 mt-2">
          Переключатель периода и вида действует только на этот график. Карточки ниже
          считаются за фиксированные периоды, подписанные на каждой.
        </p>
      </section>

      <Section title="Привлечение" icon={UserPlus} tone="emerald">
        <Stat label="Сегодня"    value={fmt(m.signups_today)} tone="emerald" hint="регистраций" />
        <Stat label="7 дней"     value={fmt(m.signups_7d)} />
        <Stat label="30 дней"    value={fmt(m.signups_30d)} />
        <Stat label="Всего"      value={fmt(m.signups_total)} />
      </Section>

      <Section title="Активация" icon={Rocket} tone="emerald">
        <Stat
          label="Создали турнир"
          value={fmt(m.activated)}
          tone="emerald"
          hint="главная метрика стадии"
        />
        <Stat
          label="Конверсия"
          value={`${String(m.activation_rate).replace('.', ',')} %`}
          hint="из регистраций"
        />
        <Stat
          label="Время до 1-го"
          value={fmtHours(m.median_hours_to_first)}
          hint="медиана"
        />
        <Stat
          label="Брошено сразу"
          value={fmt(m.abandoned_tournaments)}
          tone={m.abandoned_tournaments > 0 ? 'amber' : 'gray'}
          hint="создан, ни одного матча"
        />
      </Section>

      <Section title="Возврат" icon={Repeat} tone="violet">
        <Stat
          label="Создали 2-й турнир"
          value={fmt(m.returning)}
          tone="violet"
          hint="реальное удержание"
        />
        <Stat label="Доля" value={`${String(m.return_rate).replace('.', ',')} %`} hint="от активированных" />
        <Stat label="Турниров всего" value={fmt(m.tournaments_total)} />
        <Stat label="За 7 дней" value={fmt(m.tournaments_7d)} />
      </Section>

      <Section title="Глубина использования" icon={Trophy} tone="amber">
        <Stat label="Команд на турнир" value={String(m.avg_teams).replace('.', ',')} hint="в среднем" />
        <Stat
          label="Матчей сыграно"
          value={fmt(m.matches_played_7d)}
          hint="в турнирах за 7 дней"
        />
        <Stat
          label="Доиграли до конца"
          value={fmt(m.completed_tournaments)}
          tone="amber"
          hint="все матчи сыграны"
        />
        <Stat label="Доля завершённых" value={`${String(m.completion_rate).replace('.', ',')} %`} />
      </Section>

      <Section title="Деньги" icon={Wallet} tone="violet">
        <Stat label="MRR" value={fmt(m.mrr_kzt, ' ₸')} tone="violet" hint="нормализовано в месяц" />
        <Stat label="Выручка 30 дней" value={fmt(m.revenue_30d_kzt, ' ₸')} />
        <Stat label="Платящих" value={fmt(m.paying_users)} hint={`Pro ${m.pro_active} · Ent ${m.enterprise_active}`} />
        <Stat label="Конверсия в оплату" value={`${String(m.conversion_rate).replace('.', ',')} %`} />
      </Section>

      {/* ── Последние пользователи ──────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center gap-2.5 mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${TONES.emerald.icon}`}>
            <Users size={16} />
          </div>
          <h2 className="text-sm font-black uppercase tracking-wide text-gray-700">
            Последние регистрации
          </h2>
        </div>

        {users.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-6 text-sm text-gray-500">
            Пока никто не зарегистрировался. Если пользователи есть, а список пуст —
            не применена миграция 035_recent_users.sql
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                    <th className="text-left font-bold px-4 py-3">Пользователь</th>
                    <th className="text-left font-bold px-4 py-3 whitespace-nowrap">Регистрация</th>
                    <th className="text-right font-bold px-4 py-3">Турниров</th>
                    <th className="text-right font-bold px-4 py-3">Матчей</th>
                    <th className="text-left font-bold px-4 py-3">План</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.user_id} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 break-all">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap tabular-nums">
                        {fmtDate(u.signed_up_at)}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums font-bold ${u.tournaments > 0 ? 'text-emerald-700' : 'text-gray-300'}`}>
                        {u.tournaments}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums ${u.matches_played > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                        {u.matches_played}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold uppercase ${PLAN_BADGE[u.plan] ?? PLAN_BADGE.free}`}>
                          {u.plan}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-2">
          Турниров = 0 означает, что человек зарегистрировался и ушёл — это те, с кем
          стоит поговорить в первую очередь.
        </p>
      </section>

      <div className="flex items-start gap-2 text-xs text-gray-400 border-t border-gray-100 pt-4">
        <Clock size={14} className="shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Данные считаются напрямую из базы в момент открытия страницы. Не учитываются:
          турниры в корзине (soft delete) и аккаунты с меткой <code>profiles.is_internal</code> —
          свои и тестовые. Ежедневная сводка приходит в Telegram в 07:00 по Астане.
        </p>
      </div>
    </div>
  )
}
