// Theme wrapper for public championship pages.
//
// Public pages used to be authored one-off: the championship hub light, the team,
// player and match pages hard-coded dark, and no way to change either. Every page
// is now written in the light palette and this shell applies the `.dark` class
// (whose global overrides live in globals.css) when the visitor asked for dark —
// the same `theme` cookie the dashboard uses.

import { cookies } from 'next/headers'
import PublicThemeToggle from './PublicThemeToggle'
import type { Lang } from '@/lib/sports'

export default async function PublicShell({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const isDark = (await cookies()).get('theme')?.value === 'dark'
  return (
    <div className={isDark ? 'dark' : undefined}>
      {children}
      <PublicThemeToggle initialDark={isDark} lang={lang} />
    </div>
  )
}
