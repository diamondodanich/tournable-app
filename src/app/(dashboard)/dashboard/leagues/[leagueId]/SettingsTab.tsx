'use client'

import { useState, useTransition } from 'react'
import { updateLeague, deleteLeague } from '@/app/actions/leagues'
import { Save, Trash2 } from 'lucide-react'
import type { League } from '@/types'

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

export default function SettingsTab({ league }: { league: League }) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(league.name)
  const [sport, setSport] = useState(league.sport ?? '')
  const [city, setCity] = useState(league.city ?? '')
  const [description, setDescription] = useState(league.description ?? '')
  const [metaTitle, setMetaTitle] = useState(league.meta_title ?? '')
  const [metaDescription, setMetaDescription] = useState(league.meta_description ?? '')
  const [isPublic, setIsPublic] = useState(league.is_public)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function handleSave() {
    if (!name.trim()) { setError('Введите название'); return }
    setError('')
    startTransition(async () => {
      const result = await updateLeague(league.id, {
        name: name.trim(),
        sport: sport || null,
        city: city.trim() || null,
        description: description.trim() || null,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        is_public: isPublic,
      })
      if (result?.error) { setError(result.error); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  function handleDelete() {
    if (!confirm(`Удалить чемпионат "${league.name}"? Это действие необратимо.`)) return
    startTransition(() => deleteLeague(league.id))
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5">Название *</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5">Вид спорта</label>
        <select
          value={sport}
          onChange={e => setSport(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 outline-none text-sm bg-white"
        >
          <option value="">Не указан</option>
          {SPORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5">Город</label>
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 outline-none text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5">Описание</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 outline-none text-sm resize-none"
        />
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">SEO</p>
        <div className="space-y-3">
          <input
            value={metaTitle}
            onChange={e => setMetaTitle(e.target.value)}
            placeholder="Meta title (по умолчанию = название чемпионата)"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 outline-none text-sm"
          />
          <input
            value={metaDescription}
            onChange={e => setMetaDescription(e.target.value)}
            placeholder="Meta description"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 outline-none text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-gray-100 pt-5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={e => setIsPublic(e.target.checked)}
            className="w-4 h-4 accent-purple-600"
          />
          <span className="text-sm font-medium text-gray-700">Публичная страница</span>
        </label>
        <span className="text-xs text-gray-400">
          /leagues/{league.slug}
        </span>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Save size={14} /> {saved ? 'Сохранено' : 'Сохранить'}
        </button>

        <button
          onClick={handleDelete}
          disabled={isPending}
          className="flex items-center gap-2 text-red-400 hover:text-red-600 text-sm font-medium transition-colors ml-auto"
        >
          <Trash2 size={14} /> Удалить чемпионат
        </button>
      </div>
    </div>
  )
}
