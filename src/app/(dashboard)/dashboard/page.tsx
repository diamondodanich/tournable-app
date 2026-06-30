import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getUserPlan } from '@/app/actions/billing'
import { Tournament } from '@/types'
import Link from 'next/link'
import { Plus, Zap, BarChart2, Share2, Users, Calendar, UserCheck, ExternalLink, Crown, Layers } from 'lucide-react'
import DeleteTournamentButton from '@/components/tournament/DeleteTournamentButton'
import TeamAvatar from '@/components/tournament/TeamAvatar'
import NewTournamentButton from '@/components/tournament/NewTournamentButton'

export const dynamic = 'force-dynamic'

type Lang = 'ru' | 'kz' | 'en'

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  ru: {
    title: 'Все турниры',
    subtitle: 'Управляйте своими соревнованиями',
    newTournament: 'Новый турнир',
    emptyTitle: 'Первый турнир — за 30 секунд',
    emptyDesc: 'Выберите формат, добавьте команды — расписание готово. Участники следят за счётом по ссылке без регистрации.',
    start: 'Создать турнир',
    active: 'Активен',
    setup: 'Настройка',
    features: [
      { title: 'Онлайн-табло',        desc: 'Ведите матчи в реальном времени прямо с телефона' },
      { title: 'Таблицы и статистика', desc: 'Турнирная таблица и бомбардиры обновляются автоматически' },
      { title: 'Поделиться',           desc: 'Отправьте ссылку — участники следят без регистрации' },
    ],
    rounds: (n: number) => {
      const m10 = n % 10, m100 = n % 100
      if (m100 >= 11 && m100 <= 14) return `${n} кругов`
      if (m10 === 1) return `${n} круг`
      if (m10 >= 2 && m10 <= 4) return `${n} круга`
      return `${n} кругов`
    },
    teams: (n: number) => {
      const m10 = n % 10, m100 = n % 100
      if (m100 >= 11 && m100 <= 14) return `${n} команд`
      if (m10 === 1) return `${n} команда`
      if (m10 >= 2 && m10 <= 4) return `${n} команды`
      return `${n} команд`
    },
  },
  kz: {
    title: 'Барлық турнирлер',
    subtitle: 'Жарыстарыңызды басқарыңыз',
    newTournament: 'Жаңа турнир',
    emptyTitle: 'Бірінші турнир — 30 секундта',
    emptyDesc: 'Форматты таңдаңыз, командаларды қосыңыз — кесте дайын. Қатысушылар сілтеме арқылы тіркелусіз есепті қарайды.',
    start: 'Турнир жасау',
    active: 'Белсенді',
    setup: 'Баптау',
    features: [
      { title: 'Онлайн хабартақта',      desc: 'Матчтарды телефоннан нақты уақытта жүргізіңіз' },
      { title: 'Кестелер мен статистика', desc: 'Турнир кестесі мен бомбардирлер автоматты жаңарады' },
      { title: 'Бөлісу',                 desc: 'Сілтеме жіберіңіз — қатысушылар тіркелмей қарайды' },
    ],
    rounds: (n: number) => `${n} тур`,
    teams:  (n: number) => `${n} команда`,
  },
  en: {
    title: 'All tournaments',
    subtitle: 'Manage your competitions',
    newTournament: 'New tournament',
    emptyTitle: 'Your first tournament — in 30 seconds',
    emptyDesc: 'Pick a format, add teams — schedule ready. Participants follow the score via a link, no sign-up needed.',
    start: 'Create tournament',
    active: 'Active',
    setup: 'Setup',
    features: [
      { title: 'Live scoreboard', desc: 'Track matches in real time from your phone' },
      { title: 'Tables & stats',  desc: 'Standings and top scorers update automatically' },
      { title: 'Share',           desc: 'Send a link — no sign-up needed for viewers' },
    ],
    rounds: (n: number) => `${n} round${n !== 1 ? 's' : ''}`,
    teams:  (n: number) => `${n} team${n !== 1 ? 's' : ''}`,
  },
} as const

const FEAT_ICONS = [Zap, BarChart2, Share2]

type TournamentWithCount = Tournament & { teams: { count: number }[] }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const cookieStore = await cookies()
  const langRaw = cookieStore.get('lang')?.value ?? 'ru'
  const lang: Lang = (['ru', 'kz', 'en'] as Lang[]).includes(langRaw as Lang) ? (langRaw as Lang) : 'ru'
  const tx = T[lang]

  const [plan, { data: tournaments }, { data: memberRows }, { data: showcaseTournaments }, { data: championships }] = await Promise.all([
    getUserPlan(),
    supabase
      .from('tournaments')
      .select('*, teams(count)')
      .eq('user_id', user!.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('tournament_members')
      .select('tournament_id, role, tournaments(*, teams(count))')
      .eq('user_id', user!.id)
      .eq('status', 'accepted'),
    // Public tournaments for empty-state showcase (requires is_public column in DB)
    supabase
      .from('tournaments')
      .select('id, name, logo_url, sport, slug, format')
      .eq('is_public', true)
      .is('deleted_at', null)
      .neq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(3),
    // Championships (leagues) owned by the user — with season & team counts
    supabase
      .from('leagues')
      .select('id, name, slug, sport, logo_url, seasons(count), league_teams(count)')
      .eq('owner_id', user!.id)
      .order('created_at', { ascending: false }),
  ])

  const isPro = plan === 'pro' || plan === 'enterprise'
  const isEnterprise = plan === 'enterprise'
  const champList = (championships ?? []) as any[]
  const invitedIds = new Set((tournaments ?? []).map((t: TournamentWithCount) => t.id))
  const invitedTournaments = (memberRows ?? [])
    .filter((m: any) => m.tournaments && !invitedIds.has(m.tournament_id) && !m.tournaments.deleted_at)
    .map((m: any) => ({ ...m.tournaments, _role: m.role as string })) as (TournamentWithCount & { _role: string })[]

  const list = (tournaments ?? []) as TournamentWithCount[]
  // First active (generated) tournament — used by NewTournamentButton modal
  const firstActive = list.find(t => t.generated) ?? list[0] ?? null

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{tx.title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{tx.subtitle}</p>
        </div>
        <NewTournamentButton
          isPro={isPro}
          isEnterprise={isEnterprise}
          activeTournament={firstActive ? { id: firstActive.id, name: firstActive.name } : null}
          label="Создать"
        />
      </div>

      {list.length === 0 && champList.length === 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tx.features.map((f, i) => {
              const Icon = FEAT_ICONS[i]
              return (
                <div key={f.title} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 p-5 flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Icon size={17} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{f.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">{f.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Live examples — public tournaments from DB */}
          {(showcaseTournaments ?? []).length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Примеры турниров</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(showcaseTournaments ?? []).map((t: any) => (
                  <Link
                    key={t.id}
                    href={`/t/${t.slug ?? t.id}`}
                    target="_blank"
                    className="bg-white/70 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all p-4 flex items-center gap-3"
                  >
                    <TeamAvatar name={t.name} logoUrl={t.logo_url} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{t.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.sport ?? '—'}</p>
                    </div>
                    <ExternalLink size={13} className="text-gray-300 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((t) => {
            const teamCount = t.teams?.[0]?.count ?? 0
            const isActive = t.generated
            return (
              <div key={t.id} className="group relative">
                <Link href={`/dashboard/tournament/${t.id}`} className="block">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all p-5 h-full flex flex-col gap-3">
                    <div className="flex items-start gap-3 pr-7">
                      <TeamAvatar name={t.name} logoUrl={t.logo_url} size={40} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-black text-gray-900 text-base leading-snug">{t.name}</p>
                          <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {isActive ? tx.active : tx.setup}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto">
                      {teamCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {tx.teams(teamCount)}
                        </span>
                      )}
                      {t.format === 'round_robin' && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {tx.rounds(t.num_rounds)}
                        </span>
                      )}
                      <span className="ml-auto">{new Date(t.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                </Link>
                {/* Delete button sits outside the Link */}
                <div className="absolute top-3 right-3">
                  <DeleteTournamentButton id={t.id} name={t.name} />
                </div>
              </div>
            )
          })}

          <Link href="/dashboard/new" className="group">
            <div className="h-full min-h-[90px] rounded-2xl border-2 border-dashed border-gray-200 group-hover:border-emerald-400 transition-colors flex items-center justify-center gap-1.5 text-gray-300 group-hover:text-emerald-500 font-bold text-sm p-5">
              <Plus size={15} /> {tx.newTournament}
            </div>
          </Link>
        </div>
      )}

      {champList.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={16} className="text-violet-500" />
            <h2 className="text-base font-black text-gray-700">Чемпионаты</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {champList.map((c) => {
              const seasonCount = c.seasons?.[0]?.count ?? 0
              const teamCount = c.league_teams?.[0]?.count ?? 0
              return (
                <Link key={c.id} href={`/dashboard/leagues/${c.id}`}>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 hover:border-violet-300 hover:shadow-md transition-all p-5 h-full flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <TeamAvatar name={c.name} logoUrl={c.logo_url} size={40} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-black text-gray-900 text-base leading-snug">{c.name}</p>
                          <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                            Чемпионат
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto">
                      <span className="flex items-center gap-1">
                        <Layers size={11} /> {seasonCount} сезон{seasonCount === 1 ? '' : seasonCount >= 2 && seasonCount <= 4 ? 'а' : 'ов'}
                      </span>
                      {teamCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {tx.teams(teamCount)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {invitedTournaments.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck size={16} className="text-indigo-500" />
            <h2 className="text-base font-black text-gray-700">Приглашённые турниры</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {invitedTournaments.map((t) => {
              const teamCount = t.teams?.[0]?.count ?? 0
              const isActive = t.generated
              return (
                <Link key={t.id} href={`/dashboard/tournament/${t.id}`}>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all p-5 h-full flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <TeamAvatar name={t.name} logoUrl={t.logo_url} size={40} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-black text-gray-900 text-base leading-snug">{t.name}</p>
                          <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                            {t._role === 'editor' ? 'Редактор' : 'Наблюдатель'}
                          </span>
                        </div>
                        <span className={`text-xs font-medium mt-0.5 inline-block ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {isActive ? tx.active : tx.setup}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto">
                      {teamCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {tx.teams(teamCount)}
                        </span>
                      )}
                      <span className="ml-auto">{new Date(t.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
