'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

/**
 * Переключатель темы презентации. Тему меняем прямо на DOM-узле (без router.refresh),
 * чтобы во время показа клиенту не мигал перерендер. Выбор пишем в тот же
 * cookie `theme`, что и остальной кабинет, — при следующем открытии подставится
 * на сервере, без вспышки.
 */
export default function DeckThemeToggle({
  initialTheme,
  className,
}: {
  initialTheme: 'light' | 'dark'
  className?: string
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme)

  // Сервер уже проставил data-deck-theme; здесь только держим состояние в синхроне
  useEffect(() => {
    document.querySelectorAll('[data-deck-root]').forEach((el) => {
      el.setAttribute('data-deck-theme', theme)
    })
  }, [theme])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`
  }

  const label = theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'

  return (
    <button type="button" onClick={toggle} className={className} title={label} aria-label={label}>
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
