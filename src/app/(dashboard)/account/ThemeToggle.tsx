'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Moon, Sun } from 'lucide-react'

type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: { title: 'Тема оформления', hint: 'Тёмная тема применяется к личному кабинету', light: 'Светлая', dark: 'Тёмная' },
  kz: { title: 'Безендіру тақырыбы', hint: 'Қараңғы тақырып жеке кабинетке қолданылады', light: 'Ашық', dark: 'Қараңғы' },
  en: { title: 'Appearance', hint: 'Dark theme applies to your dashboard', light: 'Light', dark: 'Dark' },
} as const

export default function ThemeToggle({ initialDark, lang = 'ru' }: { initialDark: boolean; lang?: Lang }) {
  const tx = T[lang]
  const [dark, setDark] = useState(initialDark)
  const router = useRouter()

  function set(next: boolean) {
    if (next === dark) return
    setDark(next)
    document.cookie = `theme=${next ? 'dark' : 'light'}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-black text-lg text-gray-900 mb-1">{tx.title}</h2>
      <p className="text-sm text-gray-400 mb-5">{tx.hint}</p>
      <div className="flex gap-2">
        {([['light', tx.light, Sun, false], ['dark', tx.dark, Moon, true]] as const).map(([id, label, Icon, val]) => (
          <button key={id} onClick={() => set(val)}
            className={`flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition-colors ${
              dark === val ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>
    </div>
  )
}
