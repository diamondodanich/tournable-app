'use client'

import { useState, useTransition } from 'react'
import { User, Phone, Globe, MapPin, Save, Check } from 'lucide-react'
import { updateAccountProfile } from '@/app/actions/auth'

type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: {
    title: 'Дополнительно', hint: 'Необязательно — можно заполнить позже',
    name: 'Имя', namePh: 'Ваше имя', phone: 'Телефон', phonePh: '+7 700 000 00 00',
    country: 'Страна', countryPh: 'Казахстан', city: 'Город', cityPh: 'Астана',
    save: 'Сохранить', saved: 'Сохранено',
  },
  kz: {
    title: 'Қосымша', hint: 'Міндетті емес — кейін толтыруға болады',
    name: 'Аты', namePh: 'Атыңыз', phone: 'Телефон', phonePh: '+7 700 000 00 00',
    country: 'Ел', countryPh: 'Қазақстан', city: 'Қала', cityPh: 'Астана',
    save: 'Сақтау', saved: 'Сақталды',
  },
  en: {
    title: 'Additional', hint: 'Optional — you can fill this in later',
    name: 'Name', namePh: 'Your name', phone: 'Phone', phonePh: '+7 700 000 00 00',
    country: 'Country', countryPh: 'Kazakhstan', city: 'City', cityPh: 'Astana',
    save: 'Save', saved: 'Saved',
  },
} as const

export default function ProfileExtraForm({ initial, lang = 'ru' }: {
  initial: { display_name?: string; phone?: string; country?: string; city?: string }
  lang?: Lang
}) {
  const tx = T[lang]
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(initial.display_name ?? '')
  const [phone, setPhone] = useState(initial.phone ?? '')
  const [country, setCountry] = useState(initial.country ?? '')
  const [city, setCity] = useState(initial.city ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function onPhone(v: string) {
    // Allow only phone-valid characters — no garbage input.
    setPhone(v.replace(/[^\d+\-\s()]/g, '').slice(0, 24))
  }

  function handleSave() {
    setError('')
    startTransition(async () => {
      const res = await updateAccountProfile({ display_name: name, phone, country, city })
      if (res?.error) { setError(res.error); return }
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    })
  }

  const Field = ({ icon: Icon, label, value, onChange, ph, type = 'text' }: {
    icon: typeof User; label: string; value: string; onChange: (v: string) => void; ph: string; type?: string
  }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 focus-within:border-emerald-400 px-3">
        <Icon size={15} className="text-gray-400 shrink-0" />
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={ph} type={type}
          className="flex-1 py-2.5 outline-none text-sm bg-transparent" />
      </div>
    </div>
  )

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-black text-lg text-gray-900 mb-1">{tx.title}</h2>
      <p className="text-sm text-gray-400 mb-5">{tx.hint}</p>
      <div className="space-y-4 max-w-md">
        <Field icon={User} label={tx.name} value={name} onChange={setName} ph={tx.namePh} />
        <Field icon={Phone} label={tx.phone} value={phone} onChange={onPhone} ph={tx.phonePh} type="tel" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field icon={Globe} label={tx.country} value={country} onChange={setCountry} ph={tx.countryPh} />
          <Field icon={MapPin} label={tx.city} value={city} onChange={setCity} ph={tx.cityPh} />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button onClick={handleSave} disabled={pending}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
          {saved ? <Check size={14} /> : <Save size={14} />} {saved ? tx.saved : tx.save}
        </button>
      </div>
    </div>
  )
}
