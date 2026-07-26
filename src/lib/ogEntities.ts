// Shared bodies for the entity opengraph-image routes. Each entity has three
// localized URLs, so the card generator takes the language instead of hardcoding
// Russian labels.

import { createPublicClient } from '@/lib/supabase/public'
import { getSportTheme, getPositionLabel, type Lang, type Format } from '@/lib/sports'
import { FORMAT_LABELS } from '@/lib/formats'
import { sportDisplayName } from '@/lib/sportSeo'
import { renderOgCard } from '@/lib/og'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const L = {
  ru: {
    brand: 'Турниры и чемпионаты онлайн',
    tournament: 'Турнир', championship: 'Чемпионат',
    teams: (n: number) => `${n} команд`,
    seasons: (n: number) => `${n} ${n === 1 ? 'сезон' : n < 5 ? 'сезона' : 'сезонов'}`,
    squad: (n: number) => `${n} игроков в составе`,
    playersTitle: 'Игроки чемпионата',
    playersSub: (n: number) => `${n} игроков · бомбардиры и ассистенты за всю историю`,
    playersFallback: 'Составы команд и статистика',
    round: (n: number) => `тур ${n}`,
  },
  kz: {
    brand: 'Онлайн турнирлер мен чемпионаттар',
    tournament: 'Турнир', championship: 'Чемпионат',
    teams: (n: number) => `${n} команда`,
    seasons: (n: number) => `${n} маусым`,
    squad: (n: number) => `Құрамда ${n} ойыншы`,
    playersTitle: 'Чемпионат ойыншылары',
    playersSub: (n: number) => `${n} ойыншы · бүкіл тарих бойынша үздіктер`,
    playersFallback: 'Команда құрамдары және статистика',
    round: (n: number) => `${n}-тур`,
  },
  en: {
    brand: 'Tournaments and leagues online',
    tournament: 'Tournament', championship: 'Championship',
    teams: (n: number) => `${n} teams`,
    seasons: (n: number) => `${n} season${n === 1 ? '' : 's'}`,
    squad: (n: number) => `${n} players in the squad`,
    playersTitle: 'Championship players',
    playersSub: (n: number) => `${n} players · all-time scorers and assist leaders`,
    playersFallback: 'Squads and statistics',
    round: (n: number) => `round ${n}`,
  },
} as const

const fallback = (lang: Lang) => renderOgCard({ title: 'Tournable', subtitle: L[lang].brand })

export async function tournamentOgImage(idOrSlug: string, lang: Lang) {
  const supabase = createPublicClient()
  const query = supabase.from('tournaments').select('id, name, sport, format')
  const { data: t } = await (UUID_RE.test(idOrSlug) ? query.eq('id', idOrSlug) : query.eq('slug', idOrSlug)).maybeSingle()
  if (!t) return fallback(lang)

  const { count } = await supabase
    .from('teams').select('id', { count: 'exact', head: true }).eq('tournament_id', t.id)

  const theme = getSportTheme(t.sport)
  return renderOgCard({
    eyebrow: sportDisplayName(t.sport, lang) ?? L[lang].tournament,
    title: t.name,
    subtitle: [
      FORMAT_LABELS[(t.format ?? 'round_robin') as Format]?.[lang],
      count ? L[lang].teams(count) : null,
    ].filter(Boolean).join(' · ') || null,
    accent: theme.primary,
    background: theme.heroDark,
  })
}

export async function leagueOgImage(slug: string, lang: Lang) {
  const supabase = createPublicClient()
  const { data: l } = await supabase
    .from('leagues').select('id, name, sport, city').eq('slug', slug).eq('is_public', true).maybeSingle()
  if (!l) return fallback(lang)

  const [{ count: teams }, { count: seasons }] = await Promise.all([
    supabase.from('league_teams').select('id', { count: 'exact', head: true }).eq('league_id', l.id),
    supabase.from('seasons').select('id', { count: 'exact', head: true }).eq('league_id', l.id),
  ])

  const theme = getSportTheme(l.sport)
  return renderOgCard({
    eyebrow: [sportDisplayName(l.sport, lang), l.city].filter(Boolean).join(' · ') || L[lang].championship,
    title: l.name,
    subtitle: [
      teams ? L[lang].teams(teams) : null,
      seasons ? L[lang].seasons(seasons) : null,
    ].filter(Boolean).join(' · ') || null,
    accent: theme.primary,
    background: theme.heroDark,
  })
}

export async function leaguePlayersOgImage(slug: string, lang: Lang) {
  const supabase = createPublicClient()
  const { data: l } = await supabase
    .from('leagues').select('id, name, sport').eq('slug', slug).eq('is_public', true).maybeSingle()
  if (!l) return fallback(lang)

  const { count } = await supabase
    .from('players').select('id, league_teams!inner(league_id)', { count: 'exact', head: true })
    .eq('league_teams.league_id', l.id)

  const theme = getSportTheme(l.sport)
  return renderOgCard({
    eyebrow: [l.name, sportDisplayName(l.sport, lang)].filter(Boolean).join(' · '),
    title: L[lang].playersTitle,
    subtitle: count ? L[lang].playersSub(count) : L[lang].playersFallback,
    accent: theme.primary,
    background: theme.heroDark,
  })
}

export async function teamOgImage(slug: string, teamSlug: string, lang: Lang) {
  const supabase = createPublicClient()
  const { data: t } = await supabase
    .from('league_teams')
    .select('id, name, city, leagues!inner(name, sport, slug)')
    .eq('slug', teamSlug).eq('leagues.slug', slug).maybeSingle()
  if (!t) return fallback(lang)

  const { count: players } = await supabase
    .from('players').select('id', { count: 'exact', head: true }).eq('league_team_id', t.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const league = (t as any).leagues
  const theme = getSportTheme(league?.sport)
  return renderOgCard({
    eyebrow: [league?.name, sportDisplayName(league?.sport, lang)].filter(Boolean).join(' · '),
    title: t.name,
    subtitle: [t.city, players ? L[lang].squad(players) : null].filter(Boolean).join(' · ') || null,
    accent: theme.primary,
    background: theme.heroDark,
  })
}

export async function playerOgImage(slug: string, playerId: string, lang: Lang) {
  const supabase = createPublicClient()
  const { data: p } = await supabase
    .from('players')
    .select('name, number, position, league_teams(name, leagues(name, sport, slug))')
    .eq('id', playerId).maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const league = (p as any)?.league_teams?.leagues
  if (!p || league?.slug !== slug) return fallback(lang)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const team = (p as any).league_teams?.name as string | undefined
  const theme = getSportTheme(league.sport)
  return renderOgCard({
    eyebrow: [team, league.name].filter(Boolean).join(' · '),
    title: p.name,
    subtitle: [
      getPositionLabel(league.sport, p.position, lang) || null,
      sportDisplayName(league.sport, lang),
    ].filter(Boolean).join(' · ') || null,
    badge: p.number != null ? `№${p.number}` : null,
    accent: theme.primary,
    background: theme.heroDark,
  })
}

export async function matchOgImage(slug: string, matchId: string, lang: Lang) {
  const supabase = createPublicClient()
  const { data: f } = await supabase
    .from('fixtures')
    .select('tournament_id, matchday, played, home_score, away_score, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)')
    .eq('id', matchId).maybeSingle()
  if (!f) return fallback(lang)

  // Same league-membership check as the page: a match must not render under a
  // slug it does not belong to.
  const { data: season } = await supabase
    .from('seasons')
    .select('name, leagues!inner(name, sport, slug)')
    .eq('tournament_id', f.tournament_id)
    .eq('leagues.slug', slug)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const league = (season as any)?.leagues
  if (!league) return fallback(lang)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const home = (f as any).home_team?.name ?? '—'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const away = (f as any).away_team?.name ?? '—'
  const theme = getSportTheme(league.sport)
  const played = f.played && f.home_score != null

  return renderOgCard({
    eyebrow: [league.name, sportDisplayName(league.sport, lang)].filter(Boolean).join(' · '),
    title: `${home} — ${away}`,
    subtitle: [season?.name, f.matchday ? L[lang].round(f.matchday) : null].filter(Boolean).join(' · ') || null,
    badge: played ? `${f.home_score}:${f.away_score}` : null,
    accent: theme.primary,
    background: theme.heroDark,
  })
}
