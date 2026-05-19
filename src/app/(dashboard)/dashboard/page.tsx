import { createClient } from '@/lib/supabase/server'
import { Tournament } from '@/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trophy, Zap, BarChart2, Share2, Users, Calendar } from 'lucide-react'

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
  { icon: Zap,       title: 'Онлайн-табло',   desc: 'Ведите матчи в реальном времени прямо с телефона' },
  { icon: BarChart2, title: 'Таблицы и статистика', desc: 'Турнирная таблица и бомбардиры обновляются автоматически' },
  { icon: Share2,    title: 'Поделиться',      desc: 'Отправьте ссылку — участники следят без регистрации' },
]

type TournamentWithCount = Tournament & { teams: { count: number }[] }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*, teams(count)')
    .order('created_at', { ascending: false })

  const list = (tournaments ?? []) as TournamentWithCount[]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Мои турниры</h1>
          <p className="text-gray-500 mt-1">Управляйте своими соревнованиями</p>
        </div>
        <Link href="/dashboard/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Plus size={16} /> Новый турнир
          </Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="space-y-6">
          {/* Hero empty state */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-10 text-center text-white shadow-xl">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
            <Trophy size={56} className="mx-auto mb-5 opacity-90" />
            <h2 className="text-2xl font-black mb-2">Создайте первый турнир</h2>
            <p className="text-emerald-100 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
              Займёт меньше минуты. Добавьте команды — расписание сгенерируется автоматически.
            </p>
            <Link href="/dashboard/new">
              <Button className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold h-11 px-8 text-base shadow-md">
                <Plus size={16} className="mr-2" /> Начать
              </Button>
            </Link>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 items-start">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <f.icon size={18} className="text-emerald-600" />
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
            return (
              <Link key={t.id} href={`/dashboard/tournament/${t.id}`}>
                <div className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer h-full p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-black text-gray-900 text-base leading-snug">{t.name}</p>
                    <Badge className={t.generated
                      ? 'bg-emerald-100 text-emerald-700 border-0 shrink-0'
                      : 'bg-gray-100 text-gray-500 border-0 shrink-0'
                    }>
                      {t.generated ? 'Активен' : 'Настройка'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-auto">
                    {teamCount > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Users size={13} />
                        {teamCount} {pluralTeams(teamCount)}
                      </span>
                    )}
                    {t.format === 'round_robin' && (
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        {t.num_rounds} {pluralRounds(t.num_rounds)}
                      </span>
                    )}
                    <span className="ml-auto text-xs">
                      {new Date(t.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}

          {/* Add new card */}
          <Link href="/dashboard/new">
            <div className="group h-full min-h-[100px] rounded-2xl border-2 border-dashed border-gray-200 hover:border-emerald-400 transition-colors cursor-pointer flex items-center justify-center gap-2 text-gray-300 hover:text-emerald-500 font-bold text-sm p-5">
              <Plus size={16} /> Новый турнир
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
