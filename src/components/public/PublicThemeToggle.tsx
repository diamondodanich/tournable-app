'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Moon, Sun } from 'lucide-react'
import { setThemeCookie } from '@/lib/cookies'

type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: { light: 'Светлая тема', dark: 'Тёмная тема' },
  kz: { light: 'Ашық тақырып', dark: 'Қараңғы тақырып' },
  en: { light: 'Light theme', dark: 'Dark theme' },
} as const

/**
 * Floating light/dark switch for public pages.
 *
 * It writes the same `theme` cookie the dashboard uses, so a visitor who is also
 * an owner sees one consistent choice everywhere instead of a public side that
 * is hard-coded light on some pages and hard-coded dark on others.
 */
export default function PublicThemeToggle({ initialDark, lang = 'ru' }: { initialDark: boolean; lang?: Lang }) {
  const [dark, setDark] = useState(initialDark)
  const router = useRouter()
  const tx = T[lang]

  function toggle() {
    const next = !dark
    setDark(next)
    setThemeCookie(next ? 'dark' : 'light')
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      title={dark ? tx.light : tx.dark}
      aria-label={dark ? tx.light : tx.dark}
      className="fixed bottom-4 left-4 z-40 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
