'use client'

import { useRouter } from 'next/navigation'
import { setLangCookie } from '@/app/actions/lang'

const LANGS = ['RU', 'KZ', 'EN'] as const

export default function LangSwitcher({ current }: { current: string }) {
  const router = useRouter()

  async function handleChange(lang: string) {
    await setLangCookie(lang.toLowerCase())
    router.refresh()
  }

  return (
    <div className="flex items-center gap-0.5 bg-white/10 rounded-lg p-0.5">
      {LANGS.map(l => (
        <button
          key={l}
          onClick={() => handleChange(l)}
          className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
            current.toUpperCase() === l
              ? 'bg-white text-emerald-700'
              : 'text-emerald-100 hover:text-white'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
