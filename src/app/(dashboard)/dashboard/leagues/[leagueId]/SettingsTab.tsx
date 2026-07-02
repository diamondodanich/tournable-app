'use client'

import { useState, useTransition } from 'react'
import { updateLeague, deleteLeague } from '@/app/actions/leagues'
import { Save, Trash2 } from 'lucide-react'
import type { League } from '@/types'

type Lang = 'ru' | 'kz' | 'en'

const SPORTS: Record<Lang, { value: string; label: string }[]> = {
  ru: [
    { value: 'football',         label: 'Футбол' },
    { value: 'futsal',           label: 'Футзал' },
    { value: 'basketball',       label: 'Баскетбол' },
    { value: 'volleyball',       label: 'Волейбол' },
    { value: 'hockey',           label: 'Хоккей' },
    { value: 'efootball',        label: 'Киберфутбол' },
    { value: 'ebasketball',      label: 'Кибербаскетбол' },
    { value: 'beach_volleyball', label: 'Пляжный волейбол' },
    { value: 'other',            label: 'Другое' },
  ],
  kz: [
    { value: 'football',         label: 'Футбол' },
    { value: 'futsal',           label: 'Футзал' },
    { value: 'basketball',       label: 'Баскетбол' },
    { value: 'volleyball',       label: 'Волейбол' },
    { value: 'hockey',           label: 'Хоккей' },
    { value: 'efootball',        label: 'Кибер футбол' },
    { value: 'ebasketball',      label: 'Кибер баскетбол' },
    { value: 'beach_volleyball', label: 'Пляжды волейбол' },
    { value: 'other',            label: 'Басқа' },
  ],
  en: [
    { value: 'football',         label: 'Football' },
    { value: 'futsal',           label: 'Futsal' },
    { value: 'basketball',       label: 'Basketball' },
    { value: 'volleyball',       label: 'Volleyball' },
    { value: 'hockey',           label: 'Hockey' },
    { value: 'efootball',        label: 'eFootball' },
    { value: 'ebasketball',      label: 'eBasketball' },
    { value: 'beach_volleyball', label: 'Beach volleyball' },
    { value: 'other',            label: 'Other' },
  ],
}

const T = {
  ru: {
    enterName: 'Введите название',
    confirmDelete: (name: string) => `Удалить чемпионат "${name}"? Это действие необратимо.`,
    nameLabel: 'Название *',
    sportLabel: 'Вид спорта',
    notSpecified: 'Не указан',
    cityLabel: 'Город',
    descriptionLabel: 'Описание',
    seo: 'SEO',
    metaTitlePlaceholder: 'Meta title (по умолчанию = название чемпионата)',
    metaDescriptionPlaceholder: 'Meta description',
    publicPage: 'Публичная страница',
    save: 'Сохранить',
    saved: 'Сохранено',
    deleteLeague: 'Удалить чемпионат',
  },
  kz: {
    enterName: 'Атауын енгізіңіз',
    confirmDelete: (name: string) => `"${name}" чемпионатын жою керек пе? Бұл әрекетті қайтару мүмкін емес.`,
    nameLabel: 'Атауы *',
    sportLabel: 'Спорт түрі',
    notSpecified: 'Көрсетілмеген',
    cityLabel: 'Қала',
    descriptionLabel: 'Сипаттама',
    seo: 'SEO',
    metaTitlePlaceholder: 'Meta title (әдепкі = чемпионат атауы)',
    metaDescriptionPlaceholder: 'Meta description',
    publicPage: 'Ашық бет',
    save: 'Сақтау',
    saved: 'Сақталды',
    deleteLeague: 'Чемпионатты жою',
  },
  en: {
    enterName: 'Enter a name',
    confirmDelete: (name: string) => `Delete championship "${name}"? This action cannot be undone.`,
    nameLabel: 'Name *',
    sportLabel: 'Sport',
    notSpecified: 'Not specified',
    cityLabel: 'City',
    descriptionLabel: 'Description',
    seo: 'SEO',
    metaTitlePlaceholder: 'Meta title (defaults to championship name)',
    metaDescriptionPlaceholder: 'Meta description',
    publicPage: 'Public page',
    save: 'Save',
    saved: 'Saved',
    deleteLeague: 'Delete championship',
  },
} as const

export default function SettingsTab({ league, lang = 'ru' }: { league: League; lang?: Lang }) {
  const T_ = T[lang]
  const SPORTS_ = SPORTS[lang]
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
    if (!name.trim()) { setError(T_.enterName); return }
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
    if (!confirm(T_.confirmDelete(league.name))) return
    startTransition(() => deleteLeague(league.id))
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5">{T_.nameLabel}</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5">{T_.sportLabel}</label>
        <select
          value={sport}
          onChange={e => setSport(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 outline-none text-sm bg-white"
        >
          <option value="">{T_.notSpecified}</option>
          {SPORTS_.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5">{T_.cityLabel}</label>
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 outline-none text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5">{T_.descriptionLabel}</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 outline-none text-sm resize-none"
        />
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{T_.seo}</p>
        <div className="space-y-3">
          <input
            value={metaTitle}
            onChange={e => setMetaTitle(e.target.value)}
            placeholder={T_.metaTitlePlaceholder}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 outline-none text-sm"
          />
          <input
            value={metaDescription}
            onChange={e => setMetaDescription(e.target.value)}
            placeholder={T_.metaDescriptionPlaceholder}
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
          <span className="text-sm font-medium text-gray-700">{T_.publicPage}</span>
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
          <Save size={14} /> {saved ? T_.saved : T_.save}
        </button>

        <button
          onClick={handleDelete}
          disabled={isPending}
          className="flex items-center gap-2 text-red-400 hover:text-red-600 text-sm font-medium transition-colors ml-auto"
        >
          <Trash2 size={14} /> {T_.deleteLeague}
        </button>
      </div>
    </div>
  )
}
