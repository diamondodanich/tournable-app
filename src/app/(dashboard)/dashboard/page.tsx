import { createClient } from '@/lib/supabase/server'
import { Tournament } from '@/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trophy, Calendar, Users } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false })

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

      {!tournaments || tournaments.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-emerald-100 shadow-sm">
          <Trophy size={48} className="mx-auto text-emerald-200 mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Турниров пока нет</h2>
          <p className="text-gray-400 mb-6">Создайте первый турнир и начните управлять матчами</p>
          <Link href="/dashboard/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <Plus size={16} /> Создать турнир
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(tournaments as Tournament[]).map((t) => (
            <Link key={t.id} href={`/dashboard/tournament/${t.id}`}>
              <Card className="hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-bold text-gray-900 leading-snug">
                      {t.name}
                    </CardTitle>
                    <Badge variant={t.generated ? 'default' : 'secondary'} className={t.generated ? 'bg-emerald-100 text-emerald-700 shrink-0' : 'shrink-0'}>
                      {t.generated ? 'Активен' : 'Настройка'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      {t.num_rounds} {t.num_rounds === 1 ? 'круг' : 'круга'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(t.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
