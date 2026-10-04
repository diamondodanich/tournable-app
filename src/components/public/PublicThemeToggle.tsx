'use client'

import { useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { setThemeCookie } from '@/lib/cookies'

type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: { light: 'Светлая тема', dark: 'Тёмная тема' },
  kz: { light: 'Ашық тақырып', dark: 'Қараңғы тақырып' },
  en: { light: 'Light theme', dark: 'Dark theme' },
} as const

// The theme lives in the `theme` cookie; this tiny store lets the toggle re-render
// after it rewrites the cookie. The server snapshot is always light because public
// pages are cached and rendered without the visitor's cookies.
const listeners = new Set<() => void>()
function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
const readDark = () => /(?:^|;\s*)theme=dark(?:;|$)/.test(document.cookie)

/**
 * Floating light/dark switch for public pages.
 *
 * It writes the same `theme` cookie the dashboard uses, so a visitor who is also
 * an owner sees one consistent choice everywhere instead of a public side that
 * is hard-coded light on some pages and hard-coded dark on others.
 *
 * It also owns the `.dark` class on PublicShell's wrapper (its parent): the
 * shell's inline script covers the first paint of a full load, and this effect
 * covers client-side navigation and toggling.
 */
export default function PublicThemeToggle({ lang = 'ru' }: { lang?: Lang }) {
  const dark = useSyncExternalStore(subscribe, readDark, () => false)
  const ref = useRef<HTMLButtonElement>(null)
  const tx = T[lang]

  // Reads the cookie rather than `dark`: during hydration `dark` is still the
  // server snapshot (light) and would strip the class the inline script just set.
  useLayoutEffect(() => {
    ref.current?.parentElement?.classList.toggle('dark', readDark())
  }, [dark])

  function toggle() {
    setThemeCookie(dark ? 'light' : 'dark')
    listeners.forEach(l => l())
  }

  return (
    <button
      ref={ref}
      onClick={toggle}
      title={dark ? tx.light : tx.dark}
      aria-label={dark ? tx.light : tx.dark}
      className="fixed bottom-4 left-4 z-40 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
