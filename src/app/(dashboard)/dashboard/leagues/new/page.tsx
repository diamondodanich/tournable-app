import { createLeague } from '@/app/actions/leagues'
import { getUserPlan } from '@/app/actions/billing'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

async function handleCreate(formData: FormData): Promise<void> {
  'use server'
  await createLeague(formData)
}

export const dynamic = 'force-dynamic'

const SPORTS = [
  { value: 'football',         label: 'Футбол' },
  { value: 'futsal',           label: 'Футзал' },
  { value: 'basketball',       label: 'Баскетбол' },
  { value: 'volleyball',       label: 'Волейбол' },
  { value: 'hockey',           label: 'Хоккей' },
  { value: 'efootball',        label: 'Киберфутбол' },
  { value: 'ebasketball',      label: 'Кибербаскетбол' },
  { value: 'beach_volleyball', label: 'Пляжный волейбол' },
  { value: 'other',            label: 'Другое' },
]

export default async function NewLeaguePage() {
  const plan = await getUserPlan()
  if (plan !== 'enterprise') redirect('/dashboard/leagues')

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/leagues" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4">
          <ChevronLeft size={14} /> Назад к лигам
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Новая лига</h1>
        <p className="text-sm text-gray-400 mt-0.5">Создайте лигу — добавьте команды и сезоны после создания</p>
      </div>

      <form action={handleCreate} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Название лиги *</label>
          <input
            name="name"
            required
            placeholder="Например: Городская лига Астаны"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Вид спорта</label>
          <select
            name="sport"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition-all bg-white"
          >
            <option value="">Не указан</option>
            {SPORTS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Город</label>
          <input
            name="city"
            placeholder="Астана"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Описание</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Краткое описание лиги для публичной страницы"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors text-sm"
        >
          Создать лигу
        </button>
      </form>
    </div>
  )
}
