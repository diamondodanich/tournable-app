export interface CoverTheme {
  id: string
  label: string
  sports: string[] | null  // null = universal (all sports)
  gradient: string
}

export const COVER_THEMES: CoverTheme[] = [
  // Universal
  { id: 'dark_slate',    label: 'Тёмный',       sports: null, gradient: 'linear-gradient(135deg,#0f172a 0%,#1e293b 55%,#334155 100%)' },
  { id: 'midnight',      label: 'Полночь',       sports: null, gradient: 'linear-gradient(135deg,#0c1445 0%,#1a237e 50%,#1565c0 100%)' },
  { id: 'charcoal',      label: 'Антрацит',      sports: null, gradient: 'linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 50%,#404040 100%)' },

  // Football & Futsal
  { id: 'football_classic', label: 'Зелёный газон', sports: ['football','futsal'], gradient: 'linear-gradient(135deg,#0b3b2e 0%,#047857 40%,#10b981 100%)' },
  { id: 'football_night',   label: 'Ночной матч',   sports: ['football','futsal'], gradient: 'linear-gradient(135deg,#080c18 0%,#0d1b3e 50%,#1a3a6e 100%)' },
  { id: 'football_rust',    label: 'Осенний',        sports: ['football','futsal'], gradient: 'linear-gradient(135deg,#431407 0%,#7c2d12 45%,#b45309 100%)' },

  // E-football
  { id: 'efootball_neon',  label: 'Неон',    sports: ['efootball'], gradient: 'linear-gradient(135deg,#0d0019 0%,#4c1d95 50%,#7c3aed 100%)' },
  { id: 'efootball_cyber', label: 'Кибер',   sports: ['efootball'], gradient: 'linear-gradient(135deg,#0a0f1a 0%,#0f2460 50%,#1e40af 100%)' },
  { id: 'efootball_dark',  label: 'Тёмный',  sports: ['efootball'], gradient: 'linear-gradient(135deg,#0a0a0a 0%,#18181b 50%,#27272a 100%)' },

  // Basketball, Streetball, E-basketball
  { id: 'basketball_fire',   label: 'Огонь',       sports: ['basketball','streetball','ebasketball'], gradient: 'linear-gradient(135deg,#431407 0%,#c2410c 45%,#f97316 100%)' },
  { id: 'basketball_court',  label: 'Паркет',      sports: ['basketball','ebasketball'],              gradient: 'linear-gradient(135deg,#78350f 0%,#92400e 50%,#b45309 100%)' },
  { id: 'basketball_urban',  label: 'Урбан',        sports: ['basketball','streetball'],               gradient: 'linear-gradient(135deg,#111111 0%,#1f2937 50%,#374151 100%)' },

  // Volleyball & Beach Volleyball
  { id: 'volleyball_indoor', label: 'Синий зал', sports: ['volleyball'],                  gradient: 'linear-gradient(135deg,#0b1f4d 0%,#1e3a8a 45%,#2563eb 100%)' },
  { id: 'volleyball_beach',  label: 'Пляж',       sports: ['beach_volleyball'],            gradient: 'linear-gradient(135deg,#7c4409 0%,#ca8a04 50%,#eab308 100%)' },
  { id: 'volleyball_ocean',  label: 'Океан',      sports: ['volleyball','beach_volleyball'], gradient: 'linear-gradient(135deg,#0c4a6e 0%,#0369a1 50%,#0ea5e9 100%)' },

  // Hockey
  { id: 'hockey_ice',  label: 'Лёд',         sports: ['hockey'], gradient: 'linear-gradient(135deg,#062f37 0%,#0e7490 45%,#06b6d4 100%)' },
  { id: 'hockey_dark', label: 'Тёмный лёд',  sports: ['hockey'], gradient: 'linear-gradient(135deg,#080e20 0%,#0c2340 45%,#0e4c6a 100%)' },
  { id: 'hockey_silver', label: 'Серебро',   sports: ['hockey'], gradient: 'linear-gradient(135deg,#1c1c1c 0%,#374151 45%,#6b7280 100%)' },

  // Other
  { id: 'other_purple', label: 'Пурпурный', sports: ['other'], gradient: 'linear-gradient(135deg,#2e1065 0%,#5b21b6 45%,#7c3aed 100%)' },
  { id: 'other_ruby',   label: 'Рубин',      sports: ['other'], gradient: 'linear-gradient(135deg,#4a0404 0%,#991b1b 45%,#dc2626 100%)' },
  { id: 'other_teal',   label: 'Бирюзовый',  sports: ['other'], gradient: 'linear-gradient(135deg,#042f2e 0%,#0f766e 45%,#14b8a6 100%)' },
]

export function getThemesForSport(sport: string | null | undefined): CoverTheme[] {
  const s = sport ?? ''
  // universal themes first, then sport-specific
  const universal = COVER_THEMES.filter(t => t.sports === null)
  const specific   = COVER_THEMES.filter(t => t.sports !== null && t.sports.includes(s))
  return [...specific, ...universal]
}

export function getCoverTheme(id: string): CoverTheme | undefined {
  return COVER_THEMES.find(t => t.id === id)
}

export function isCoverThemeUrl(url: string): boolean {
  return url.startsWith('theme:')
}

export function getCoverStyle(coverUrl: string | null | undefined): { background: string } | null {
  if (!coverUrl) return null
  if (coverUrl.startsWith('theme:')) {
    const id = coverUrl.slice(6)
    const theme = getCoverTheme(id)
    return theme ? { background: theme.gradient } : null
  }
  return null
}
