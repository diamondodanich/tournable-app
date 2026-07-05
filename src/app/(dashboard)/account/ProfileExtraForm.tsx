'use client'

import { useState, useTransition } from 'react'
import { User, Phone, Globe, MapPin, Save, Check } from 'lucide-react'
import { updateAccountProfile } from '@/app/actions/auth'
import { COUNTRIES, CITIES } from '@/lib/countries'

type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: {
    title: 'Дополнительно', hint: 'Необязательно — можно заполнить позже',
    name: 'Имя', namePh: 'Ваше имя', phone: 'Телефон',
    country: 'Страна', countryPh: 'Начните вводить…', city: 'Город', cityPh: 'Начните вводить…',
    save: 'Сохранить', saved: 'Сохранено',
  },
  kz: {
    title: 'Қосымша', hint: 'Міндетті емес — кейін толтыруға болады',
    name: 'Аты', namePh: 'Атыңыз', phone: 'Телефон',
    country: 'Ел', countryPh: 'Жаза бастаңыз…', city: 'Қала', cityPh: 'Жаза бастаңыз…',
    save: 'Сақтау', saved: 'Сақталды',
  },
  en: {
    title: 'Additional', hint: 'Optional — you can fill this in later',
    name: 'Name', namePh: 'Your name', phone: 'Phone',
    country: 'Country', countryPh: 'Start typing…', city: 'City', cityPh: 'Start typing…',
    save: 'Save', saved: 'Saved',
  },
} as const

type Mask = 'ru7' | 'generic'

function digitsOnly(s: string) { return s.replace(/\D/g, '') }

// Format NATIONAL digits (no country code) into a display string with dial prefix.
function formatPhone(nat: string, dial: string, mask: Mask): string {
  if (mask === 'ru7') {
    const d = nat.slice(0, 10)
    let out = `+${dial}`
    if (d.length) out += ` (${d.slice(0, 3)}`
    if (d.length >= 3) out += `) ${d.slice(3, 6)}`
    if (d.length >= 6) out += `-${d.slice(6, 8)}`
    if (d.length >= 8) out += `-${d.slice(8, 10)}`
    return out
  }
  const d = nat.slice(0, 12)
  const groups = d.match(/.{1,3}/g)
  return `+${dial}${groups ? ' ' + groups.join(' ') : ''}`
}

function findCountry(name: string) {
  const n = name.trim().toLowerCase()
  return COUNTRIES.find(c => c.name.toLowerCase() === n)
}

export default function ProfileExtraForm({ initial, lang = 'ru' }: {
  initial: { display_name?: string; phone?: string; country?: string; city?: string }
  lang?: Lang
}) {
  const tx = T[lang]
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(initial.display_name ?? '')
  const [country, setCountry] = useState(initial.country ?? '')
  const [city, setCity] = useState(initial.city ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const activeCountry = findCountry(country)
  const dial = activeCountry?.dial ?? '7'
  const mask: Mask = dial === '7' ? 'ru7' : 'generic'
  const maxNat = mask === 'ru7' ? 10 : 12
  const cityOptions = CITIES[activeCountry?.name ?? ''] ?? []

  // Source of truth for the phone = NATIONAL digits (no dial). Display is derived.
  const [nat, setNat] = useState(() => {
    const d0 = findCountry(initial.country ?? '')?.dial ?? '7'
    let d = digitsOnly(initial.phone ?? '')
    if (d.startsWith(d0)) d = d.slice(d0.length)
    return d.slice(0, d0 === '7' ? 10 : 12)
  })

  const phoneDisplay = nat ? formatPhone(nat, dial, mask) : ''

  function onPhone(v: string) {
    let digits = digitsOnly(v)
    // Display always starts with "+dial", so digitsOnly(v) = dial + national while
    // the field is non-empty. Strip the dial prefix.
    if (v.includes('+') && digits.startsWith(dial)) digits = digits.slice(dial.length)
    else if (digits.length > maxNat && digits.startsWith(dial)) digits = digits.slice(dial.length)
    // Backspacing over a formatting char removes no digit → drop the trailing digit
    // so deletion always makes progress.
    if (v.length < phoneDisplay.length && digits.length === nat.length && digits.length > 0) {
      digits = digits.slice(0, -1)
    }
    setNat(digits.slice(0, maxNat))
  }

  function onCountry(v: string) {
    setCountry(v)
    setCity('')  // city depends on country
    // national digits are country-agnostic — no need to touch `nat`; display re-masks
  }

  function handleSave() {
    setError('')
    startTransition(async () => {
      const res = await updateAccountProfile({ display_name: name, phone: phoneDisplay, country, city })
      if (res?.error) { setError(res.error); return }
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    })
  }

  const inputCls = 'flex-1 py-2.5 outline-none text-sm bg-transparent min-w-0'
  const wrapCls = 'flex items-center gap-2 rounded-xl border border-gray-200 focus-within:border-emerald-400 px-3'

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-black text-lg text-gray-900 mb-1">{tx.title}</h2>
      <p className="text-sm text-gray-400 mb-5">{tx.hint}</p>

      <datalist id="country-list">{COUNTRIES.map(c => <option key={c.name} value={c.name} />)}</datalist>
      <datalist id="city-list">{cityOptions.map(c => <option key={c} value={c} />)}</datalist>

      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{tx.name}</label>
          <div className={wrapCls}>
            <User size={15} className="text-gray-400 shrink-0" />
            <input value={name} onChange={e => setName(e.target.value)} placeholder={tx.namePh} className={inputCls} maxLength={60} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{tx.phone}</label>
          <div className={wrapCls}>
            <Phone size={15} className="text-gray-400 shrink-0" />
            <input value={phoneDisplay} onChange={e => onPhone(e.target.value)} placeholder={`+${dial} …`} type="tel" inputMode="tel" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{tx.country}</label>
            <div className={wrapCls}>
              <Globe size={15} className="text-gray-400 shrink-0" />
              <input value={country} onChange={e => onCountry(e.target.value)} placeholder={tx.countryPh} list="country-list" className={inputCls} maxLength={40} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{tx.city}</label>
            <div className={wrapCls}>
              <MapPin size={15} className="text-gray-400 shrink-0" />
              <input value={city} onChange={e => setCity(e.target.value)} placeholder={tx.cityPh} list="city-list" className={inputCls} maxLength={40} />
            </div>
          </div>
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
