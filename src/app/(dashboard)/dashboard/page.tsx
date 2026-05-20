import { createClient } from '@/lib/supabase/server'
import { Tournament } from '@/types'
import Link from 'next/link'
import { Plus, Trophy, Zap, BarChart2, Share2, Users, Calendar, ArrowRight } from 'lucide-react'
import DeleteTournamentButton from '@/components/tournament/DeleteTournamentButton'

function pluralRounds(n: number) {
  const mod10 = n % 10, mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return 'кругов'
  if (mod10 === 1) return 'круг'
  if (mod10 >= 2 && mod10 <= 4) return 'круга'
  return 'кругов'
}

function pluralTeams(n: number) {
  const mod10 = n % 10, mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return 'команд'
  if (mod10 === 1) return 'команда'
  if (mod10 >= 2 && mod10 <= 4) return 'команды'
  return 'команд'
}

const FEATURES = [
  { icon: Zap,       title: 'Онлайн-табло',        desc: 'Ведите матчи в реальном времени прямо с телефона' },
  { icon: BarChart2, title: 'Таблицы и статистика', desc: 'Турнирная таблица и бомбардиры обновляются автоматически' },
  { icon: Share2,    title: 'Поделиться',           desc: 'Отправьте ссылку — участники следят без регистрации' },
]

type TournamentWithCount = Tournament & { teams: { count: number }[] }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*, teams(count)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const list = (tournaments ?? []) as TournamentWithCount[]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Мои турниры</h1>
          <p className="text-sm text-gray-400 mt-0.5">Управляйте своими соревнованиями</p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus size={15} /> Новый турнир
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="space-y-4">
          <div className="relative overflow-hidden bg-emerald-600 rounded-3xl px-8 py-12 text-center text-white">
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
            <Trophy size={52} className="mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl font-black mb-2">Создайте первый турнир</h2>
            <p className="text-emerald-100 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
              Займёт меньше минуты. Добавьте команды — расписание сгенерируется автоматически.
            </p>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-7 py-3 rounded-xl shadow-md transition-colors text-sm"
            >
              <Plus size={15} /> Начать <ArrowRight size={14} className="opacity-60" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 p-5 flex gap-3 items-start">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <f.icon size={17} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{f.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
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
                    <div className="flex items-start justify-between gap-2 pr-7">
                      <p className="font-black text-gray-900 text-base leading-snug">{t.name}</p>
                      <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isActive ? 'Активен' : 'Настройка'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto">
                      {teamCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {teamCount} {pluralTeams(teamCount)}
                        </span>
                      )}
                      {t.format === 'round_robin' && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {t.num_rounds} {pluralRounds(t.num_rounds)}
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
              <Plus size={15} /> Новый турнир
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
