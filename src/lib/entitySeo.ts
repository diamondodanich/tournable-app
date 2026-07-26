// ─────────────────────────────────────────────────────────────────────────────
// Localized <title>/<description> copy for the public entity pages (tournament,
// championship, team, player, match). Each of those pages exists at three URLs
// — `/x`, `/kz/x`, `/en/x` — and must describe itself in the language of the URL
// it was requested at, otherwise hreflang points at three identical Russian
// documents and Google keeps only one of them.
//
// Russian needs the dative after «по» and Kazakh uses the postposition
// «бойынша»; both come from `sportSeo`, never from a raw label.
// ─────────────────────────────────────────────────────────────────────────────

import type { Lang } from '@/lib/sports'
import { sportByPhrase, sportDisplayName } from '@/lib/sportSeo'

export interface Meta { title: string; description: string }

/** "по футболу" / "Футбол бойынша" / "football" — sport as it fits a sentence. */
function sportPhrase(sport: string | null | undefined, lang: Lang): string | null {
  if (!sport) return null
  if (lang === 'ru') return sportByPhrase(sport)
  const name = sportDisplayName(sport, lang)
  if (!name) return null
  return lang === 'kz' ? `${name} бойынша` : name.toLowerCase()
}

function join(parts: (string | null | undefined)[], sep = ' '): string {
  return parts.filter(Boolean).join(sep)
}

// ── Tournament ───────────────────────────────────────────────────────────────

export function tournamentMeta(
  lang: Lang,
  t: { name: string; sport?: string | null; formatLabel?: string | null; teams?: number | null },
): Meta {
  const phrase = sportPhrase(t.sport, lang)
  const name = sportDisplayName(t.sport, lang)

  if (lang === 'kz') {
    return {
      title: name ? `${t.name}: кесте және нәтижелер, ${name.toLowerCase()}` : `${t.name}: кесте, матчтар және нәтижелер`,
      description: join([
        phrase ? `${phrase} турнир` : 'Турнир',
        t.teams ? `· ${t.teams} команда` : null,
        t.formatLabel ? `· ${t.formatLabel.toLowerCase()}` : null,
        '· турнир кестесі, матчтар кестесі, нәтижелер мен ойыншылар статистикасы онлайн.',
      ]),
    }
  }

  if (lang === 'en') {
    return {
      title: name ? `${t.name}: table and results, ${name.toLowerCase()}` : `${t.name}: table, fixtures and results`,
      description: join([
        phrase ? `A ${phrase} tournament` : 'A tournament',
        t.teams ? `· ${t.teams} teams` : null,
        t.formatLabel ? `· ${t.formatLabel.toLowerCase()}` : null,
        '· league table, fixtures, results and player statistics online.',
      ]),
    }
  }

  return {
    title: name ? `${t.name}: таблица и результаты, ${name.toLowerCase()}` : `${t.name}: таблица, расписание и результаты`,
    description: join([
      phrase ? `Турнир ${phrase}` : 'Турнир',
      t.teams ? `· ${t.teams} команд` : null,
      t.formatLabel ? `· ${t.formatLabel.toLowerCase()}` : null,
      '· таблица, расписание матчей, результаты и статистика игроков онлайн.',
    ]),
  }
}

// ── Championship ─────────────────────────────────────────────────────────────

export function leagueMeta(
  lang: Lang,
  l: { name: string; sport?: string | null; city?: string | null; description?: string | null },
): Meta {
  const name = sportDisplayName(l.sport, lang)
  const phrase = sportPhrase(l.sport, lang)
  // Championship names very often already contain the sport; repeating it in the
  // title reads like keyword stuffing.
  const showSport = name && !l.name.toLowerCase().includes(name.toLowerCase())

  if (lang === 'kz') {
    return {
      title: `${l.name}${showSport ? ` — ${name}` : ''}${l.city ? `, ${l.city}` : ''}: кесте, командалар және нәтижелер`,
      description: l.description ?? join([
        `${l.name}${phrase ? ` — ${phrase} чемпионат` : ''}${l.city ? `, ${l.city}` : ''}.`,
        'Турнир кестесі, матчтар күнтізбесі, команда құрамдары, ойыншылар статистикасы және маусымдар тарихы.',
      ]),
    }
  }

  if (lang === 'en') {
    return {
      title: `${l.name}${showSport ? ` — ${name}` : ''}${l.city ? `, ${l.city}` : ''}: table, teams and results`,
      description: l.description ?? join([
        `${l.name}${phrase ? ` — a ${phrase} championship` : ''}${l.city ? ` in ${l.city}` : ''}.`,
        'League table, fixtures, squads, player statistics and season history.',
      ]),
    }
  }

  return {
    title: `${l.name}${showSport ? ` — ${name}` : ''}${l.city ? `, ${l.city}` : ''}: таблица, команды и результаты`,
    description: l.description ?? join([
      `${l.name}${phrase ? ` — чемпионат ${phrase}` : ''}${l.city ? ` в городе ${l.city}` : ''}.`,
      'Турнирная таблица, календарь матчей, составы команд, статистика игроков и история сезонов.',
    ]),
  }
}

// ── Squad list ───────────────────────────────────────────────────────────────

export function playersMeta(lang: Lang, l: { name: string; sport?: string | null }): Meta {
  const phrase = sportPhrase(l.sport, lang)
  if (lang === 'kz') {
    return {
      title: `«${l.name}» чемпионатының ойыншылары — құрамдар мен статистика`,
      description: `«${l.name}»${phrase ? ` (${phrase})` : ''} чемпионатының барлық ойыншылары: команда құрамдары, бомбардирлер мен ассистенттер бүкіл тарих бойынша.`,
    }
  }
  if (lang === 'en') {
    return {
      title: `${l.name} players — squads and statistics`,
      description: `Every player in the ${l.name}${phrase ? ` ${phrase}` : ''} championship: squads, top scorers and assist leaders across all seasons.`,
    }
  }
  return {
    title: `Игроки чемпионата «${l.name}» — составы команд и статистика`,
    description: `Все игроки чемпионата «${l.name}»${phrase ? ` ${phrase}` : ''}: составы команд, бомбардиры и ассистенты за всю историю турнира.`,
  }
}

// ── Team ─────────────────────────────────────────────────────────────────────

export function teamMeta(
  lang: Lang,
  t: { name: string; city?: string | null; leagueName?: string | null; sport?: string | null },
): Meta {
  const phrase = sportPhrase(t.sport, lang)
  const where = t.city ? ` (${t.city})` : ''

  if (lang === 'kz') {
    return {
      title: `${t.name} — құрам, статистика және нәтижелер${t.leagueName ? ` · ${t.leagueName}` : ''}`,
      description: join([
        `${t.name}${where} —`,
        phrase ? `${phrase} команда` : 'команда',
        t.leagueName ? `«${t.leagueName}» чемпионатында.` : '.',
        'Ойыншылар құрамы, маусымдар бойынша статистика, күнтізбе және матч нәтижелері.',
      ]).replace(' .', '.'),
    }
  }

  if (lang === 'en') {
    return {
      title: `${t.name} — squad, statistics and results${t.leagueName ? ` · ${t.leagueName}` : ''}`,
      description: join([
        `${t.name}${where} —`,
        phrase ? `a ${phrase} team` : 'a team',
        t.leagueName ? `in the ${t.leagueName} championship.` : '.',
        'Squad, season-by-season statistics, fixtures and results.',
      ]).replace(' .', '.'),
    }
  }

  return {
    title: `${t.name} — состав, статистика и результаты${t.leagueName ? ` · ${t.leagueName}` : ''}`,
    description: join([
      `${t.name}${where} —`,
      phrase ? `команда ${phrase}` : 'команда',
      t.leagueName ? `в чемпионате «${t.leagueName}».` : '.',
      'Состав игроков, статистика по сезонам, календарь и результаты матчей.',
    ]).replace(' .', '.'),
  }
}

// ── Player ───────────────────────────────────────────────────────────────────

export function playerMeta(
  lang: Lang,
  p: { name: string; number?: number | null; teamName?: string | null; leagueName?: string | null; sport?: string | null },
): Meta {
  const sport = sportDisplayName(p.sport, lang)
  const affiliation = join([p.teamName, p.leagueName], ', ')
  const num = p.number != null ? ` (№${p.number})` : ''

  if (lang === 'kz') {
    return {
      title: `${p.name}${p.teamName ? ` — ${p.teamName}` : ''}${p.leagueName ? `, ${p.leagueName}` : ''}: ойыншы статистикасы`,
      description: join([
        `${p.name}${num}`,
        sport ? `— ${sport.toLowerCase()}.` : '—',
        affiliation ? `${affiliation}.` : null,
        'Матчтар, голдар, ассисттер және карточкалар маусымдар бойынша.',
      ]),
    }
  }

  if (lang === 'en') {
    return {
      title: `${p.name}${p.teamName ? ` — ${p.teamName}` : ''}${p.leagueName ? `, ${p.leagueName}` : ''}: player statistics`,
      description: join([
        `${p.name}${num}`,
        sport ? `— ${sport.toLowerCase()}.` : '—',
        affiliation ? `${affiliation}.` : null,
        'Matches, goals, assists and cards season by season.',
      ]),
    }
  }

  return {
    title: `${p.name}${p.teamName ? ` — ${p.teamName}` : ''}${p.leagueName ? `, ${p.leagueName}` : ''}: статистика игрока`,
    description: join([
      `${p.name}${num}`,
      sport ? `— ${sport.toLowerCase()}.` : '—',
      affiliation ? `${affiliation}.` : null,
      'Матчи, голы, передачи и карточки по сезонам.',
    ]),
  }
}

// ── Match ────────────────────────────────────────────────────────────────────

export function matchMeta(
  lang: Lang,
  m: {
    home: string; away: string; played: boolean
    homeScore?: number | null; awayScore?: number | null
    leagueName: string; seasonName?: string | null; sport?: string | null
  },
): Meta {
  const sport = sportDisplayName(m.sport, lang)
  const score = m.played && m.homeScore != null ? `${m.homeScore}:${m.awayScore}` : 'vs'
  const title = `${m.home} ${score} ${m.away} — ${m.leagueName}`

  if (lang === 'kz') {
    return {
      title,
      description: join([
        `${m.home} — ${m.away}`,
        m.played && m.homeScore != null ? `есеп ${m.homeScore}:${m.awayScore}.` : 'алдағы матч.',
        sport ? `${sport},` : null,
        m.leagueName,
        m.seasonName ? `· ${m.seasonName}` : null,
        '— құрам, матч оқиғалары және статистика.',
      ]),
    }
  }

  if (lang === 'en') {
    return {
      title,
      description: join([
        `${m.home} — ${m.away}`,
        m.played && m.homeScore != null ? `final score ${m.homeScore}:${m.awayScore}.` : 'upcoming match.',
        sport ? `${sport},` : null,
        m.leagueName,
        m.seasonName ? `· ${m.seasonName}` : null,
        '— line-ups, match events and statistics.',
      ]),
    }
  }

  return {
    title,
    description: join([
      `${m.home} — ${m.away}`,
      m.played && m.homeScore != null ? `счёт ${m.homeScore}:${m.awayScore}.` : 'предстоящий матч.',
      sport ? `${sport},` : null,
      m.leagueName,
      m.seasonName ? `· ${m.seasonName}` : null,
      '— состав, события матча и статистика.',
    ]),
  }
}

/** "Чемпионат не найден" and friends, for the noindex fallbacks. */
export const NOT_FOUND_TITLE: Record<Lang, { tournament: string; league: string; team: string; player: string; match: string }> = {
  ru: { tournament: 'Турнир не найден', league: 'Чемпионат не найден', team: 'Команда не найдена', player: 'Игрок не найден', match: 'Матч не найден' },
  kz: { tournament: 'Турнир табылмады', league: 'Чемпионат табылмады', team: 'Команда табылмады', player: 'Ойыншы табылмады', match: 'Матч табылмады' },
  en: { tournament: 'Tournament not found', league: 'Championship not found', team: 'Team not found', player: 'Player not found', match: 'Match not found' },
}
