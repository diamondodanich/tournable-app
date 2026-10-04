// Theme wrapper for public championship pages.
//
// Public pages used to be authored one-off: the championship hub light, the team,
// player and match pages hard-coded dark, and no way to change either. Every page
// is now written in the light palette and this shell applies the `.dark` class
// (whose global overrides live in globals.css) when the visitor asked for dark —
// the same `theme` cookie the dashboard uses.
//
// The cookie is read in the browser, not on the server: reading `cookies()` here
// made every public page render per request, so they could not be cached and each
// crawler hit cost a full SSR pass. The inline script adds `.dark` before the page
// paints on a full load; PublicThemeToggle re-applies it after client navigation,
// where React does not execute inserted scripts.

import PublicThemeToggle from './PublicThemeToggle'
import type { Lang } from '@/lib/sports'

const THEME_SCRIPT =
  "if(/(?:^|;\\s*)theme=dark(?:;|$)/.test(document.cookie))document.currentScript.parentElement.classList.add('dark')"

export default function PublicShell({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return (
    <div suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      {children}
      <PublicThemeToggle lang={lang} />
    </div>
  )
}
