import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserPlan } from '@/app/actions/billing'
import Link from 'next/link'
import { Plus, Globe, MapPin, Lock } from 'lucide-react'
import type { League } from '@/types'

export const dynamic = 'force-dynamic'

const SPORT_LABELS: Record<string, string> = {
  football: 'Футбол', futsal: 'Футзал', efootball: 'Киберфутбол',
  basketball: 'Баскетбол', streetball: 'Стритбол', ebasketball: 'Кибербаскетбол',
  volleyball: 'Волейбол', beach_volleyball: 'Пляжный волейбол',
  hockey: 'Хоккей', other: 'Другое',
}

export default async function LeaguesPage() {
  const plan = await getUserPlan()

  if (plan !== 'enterprise') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-6 px-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">
          <Lock size={28} className="text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Постоянные лиги</h1>
          <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
            Создавайте лиги с историей сезонов, профилями команд и статистикой игроков. Доступно в тарифе Enterprise.
          </p>
        </div>
        <Link
          href="/pricing#enterprise"
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          Узнать про Enterprise
        </Link>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: leagues } = await supabase
    .from('leagues')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const list = (leagues ?? []) as League[]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-gray-900">Лиги</h1>
            <span className="text-[9px] font-black px-2 py-1 rounded-full bg-purple-100 text-purple-700 leading-none">ENTERPRISE</span>
          </div>
          <p className="text-sm text-gray-400">Постоянные лиги с историей сезонов и профилями команд</p>
        </div>
        <Link
          href="/dashboard/leagues/new"
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl transition-colors text-sm"
        >
          <Plus size={15} /> Новая лига
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="bg-white/70 rounded-3xl border border-gray-100 p-12 text-center">
          <Globe size={40} className="mx-auto mb-4 text-purple-300" />
          <h2 className="font-black text-gray-800 text-lg mb-2">Создайте первую лигу</h2>
          <p className="text-gray-400 text-sm max-w-xs mx-auto mb-6">
            Лига объединяет сезоны в единую историю. Добавьте команды, заполните составы — публичная страница появится автоматически.
          </p>
          <Link
            href="/dashboard/leagues/new"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 rounded-xl text-sm"
          >
            <Plus size={14} /> Создать лигу
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((league) => (
            <Link key={league.id} href={`/dashboard/leagues/${league.id}`}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all p-5 flex flex-col gap-3 h-full">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0 text-base font-black text-purple-600">
                    {league.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-base leading-snug truncate">{league.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {league.sport ? SPORT_LABELS[league.sport] ?? league.sport : 'Вид спорта не указан'}
                    </p>
                  </div>
                </div>
                {league.city && (
                  <p className="flex items-center gap-1.5 text-xs text-gray-400">
                    <MapPin size={11} /> {league.city}
                  </p>
                )}
                <div className="mt-auto flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    league.is_public ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {league.is_public ? 'Публичная' : 'Скрытая'}
                  </span>
                  <span className="ml-auto text-[10px] text-gray-300">
                    /leagues/{league.slug}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
