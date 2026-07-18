import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, UserPlus, Rocket, Repeat, Trophy, Wallet, Clock, AlertTriangle,
} from 'lucide-react'
import type { ProductMetrics } from '@/lib/metrics'

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

  const { data, error } = await supabase.rpc('product_metrics')
  const m = data as ProductMetrics | null

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

      <div className="flex items-start gap-2 text-xs text-gray-400 border-t border-gray-100 pt-4">
        <Clock size={14} className="shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Данные считаются напрямую из базы в момент открытия страницы. Турниры в корзине
          (soft delete) не учитываются. Ежедневная сводка приходит в Telegram в 07:00 по Астане.
        </p>
      </div>
    </div>
  )
}
