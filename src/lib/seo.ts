// ─────────────────────────────────────────────────────────────────────────────
// SEO helpers: canonical URLs, hreflang and schema.org JSON-LD builders.
//
// Why canonicals live here and not in the root layout: Next merges metadata
// *shallowly* down the segment tree, so an `alternates` block declared once in
// `app/layout.tsx` is inherited verbatim by every page that doesn't declare its
// own. A root-level `canonical: '/'` therefore points every tournament, team and
// player page at the homepage and drops them out of the index. Each public page
// builds its own canonical through `canonicalFor()`.
// ─────────────────────────────────────────────────────────────────────────────

import { APP_URL } from '@/lib/appUrl'

export type Lang = 'ru' | 'kz' | 'en'

/** Absolute URL for a site-relative path. */
export function absUrl(path: string): string {
  return `${APP_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/** `alternates` block for a page served at a single URL in one language. */
export function canonicalFor(path: string) {
  return { canonical: path }
}

/** URL prefix carrying the page language: '' for Russian, '/kz', '/en'. */
export function langPrefix(lang: Lang): '' | '/en' | '/kz' {
  return lang === 'en' ? '/en' : lang === 'kz' ? '/kz' : ''
}

/**
 * Canonical + hreflang cluster for a page that exists at `/x`, `/kz/x` and
 * `/en/x`. `path` is always the Russian (prefix-less) path.
 */
export function trilingualAlternates(path: string, lang: Lang) {
  return {
    canonical: `${langPrefix(lang)}${path}`,
    languages: {
      ru: absUrl(path),
      kk: absUrl(`/kz${path}`),
      en: absUrl(`/en${path}`),
      'x-default': absUrl(path),
    },
  }
}

/**
 * `alternates` for the landing pages, which exist at three URLs (/, /en, /kz).
 * `kk` is the ISO-639-1 code for Kazakh — `kz` is a country code and is ignored
 * by Google as an hreflang value.
 */
export function localizedAlternates(path: '' | '/pricing' = '') {
  return {
    canonical: path === '' ? '/' : path,
    languages: {
      ru: absUrl(path === '' ? '/' : path),
      kk: absUrl(`/kz${path}`),
      en: absUrl(`/en${path}`),
      'x-default': absUrl(path === '' ? '/' : path),
    },
  }
}

// ── JSON-LD ──────────────────────────────────────────────────────────────────

type Json = Record<string, unknown>

/** Drops null/undefined/empty values so the graph stays valid for Google. */
function clean<T extends Json>(obj: T): T {
  const out: Json = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === '' ) continue
    if (Array.isArray(v) && v.length === 0) continue
    out[k] = v
  }
  return out as T
}

export const ORGANIZATION_ID = `${APP_URL}/#organization`
export const WEBSITE_ID = `${APP_URL}/#website`

export function organizationLd(): Json {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'Tournable',
    url: APP_URL,
    logo: { '@type': 'ImageObject', url: absUrl('/logo-green.png') },
    sameAs: [] as string[],
  }
}

export function webSiteLd(): Json {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: 'Tournable',
    url: APP_URL,
    inLanguage: ['ru', 'kk', 'en'],
    publisher: { '@id': ORGANIZATION_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${APP_URL}/tournaments?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function breadcrumbsLd(items: { name: string; path: string }[]): Json {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  }
}

export function faqLd(items: { q: string; a: string }[]): Json {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

/** A league / championship — a standing organisation, not a single event. */
export function sportsOrganizationLd(l: {
  name: string
  path: string
  sport?: string | null
  city?: string | null
  logoUrl?: string | null
  description?: string | null
}): Json {
  return clean({
    '@type': 'SportsOrganization',
    '@id': `${absUrl(l.path)}#organization`,
    name: l.name,
    url: absUrl(l.path),
    sport: l.sport ?? undefined,
    logo: l.logoUrl ?? undefined,
    description: l.description ?? undefined,
    location: l.city ? { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: l.city } } : undefined,
  })
}

export function sportsTeamLd(t: {
  name: string
  path: string
  sport?: string | null
  city?: string | null
  logoUrl?: string | null
  leagueName?: string | null
  leaguePath?: string | null
  athletes?: { name: string; path?: string | null }[]
}): Json {
  return clean({
    '@type': 'SportsTeam',
    '@id': `${absUrl(t.path)}#team`,
    name: t.name,
    url: absUrl(t.path),
    sport: t.sport ?? undefined,
    logo: t.logoUrl ?? undefined,
    location: t.city ? { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: t.city } } : undefined,
    memberOf: t.leagueName && t.leaguePath
      ? { '@type': 'SportsOrganization', name: t.leagueName, url: absUrl(t.leaguePath) }
      : undefined,
    athlete: (t.athletes ?? []).map(a => clean({
      '@type': 'Person',
      name: a.name,
      url: a.path ? absUrl(a.path) : undefined,
    })),
  })
}

export function athleteLd(p: {
  name: string
  path: string
  photoUrl?: string | null
  teamName?: string | null
  teamPath?: string | null
  sport?: string | null
  jerseyNumber?: number | string | null
  position?: string | null
}): Json {
  return clean({
    '@type': 'Person',
    '@id': `${absUrl(p.path)}#person`,
    name: p.name,
    url: absUrl(p.path),
    image: p.photoUrl ?? undefined,
    jobTitle: p.position ?? undefined,
    identifier: p.jerseyNumber != null ? String(p.jerseyNumber) : undefined,
    memberOf: p.teamName
      ? clean({ '@type': 'SportsTeam', name: p.teamName, url: p.teamPath ? absUrl(p.teamPath) : undefined, sport: p.sport ?? undefined })
      : undefined,
  })
}

/** One match. `startDate` must be ISO-8601; omitted when the fixture is undated. */
export function sportsEventLd(m: {
  name: string
  path: string
  sport?: string | null
  startDate?: string | null
  homeName: string
  awayName: string
  homePath?: string | null
  awayPath?: string | null
  organizerName?: string | null
  organizerPath?: string | null
  locationName?: string | null
}): Json {
  // Score is not a schema.org SportsTeam property — it is carried in the event
  // name ("Team A 2:1 Team B") instead, which is what Google surfaces.
  const competitor = (name: string, path?: string | null) => clean({
    '@type': 'SportsTeam',
    name,
    url: path ? absUrl(path) : undefined,
  })

  return clean({
    '@type': 'SportsEvent',
    '@id': `${absUrl(m.path)}#event`,
    name: m.name,
    url: absUrl(m.path),
    sport: m.sport ?? undefined,
    startDate: m.startDate ?? undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    homeTeam: competitor(m.homeName, m.homePath),
    awayTeam: competitor(m.awayName, m.awayPath),
    competitor: [competitor(m.homeName, m.homePath), competitor(m.awayName, m.awayPath)],
    organizer: m.organizerName
      ? clean({ '@type': 'SportsOrganization', name: m.organizerName, url: m.organizerPath ? absUrl(m.organizerPath) : undefined })
      : undefined,
    // Venues are not stored yet. Declaring a VirtualLocation for a match played on
    // an actual pitch would be false, so the field is simply left out.
    location: m.locationName
      ? { '@type': 'Place', name: m.locationName, address: m.locationName }
      : undefined,
  })
}

/** A tournament: a series of matches under one name. */
export function sportsEventSeriesLd(t: {
  name: string
  path: string
  sport?: string | null
  startDate?: string | null
  endDate?: string | null
  description?: string | null
  logoUrl?: string | null
  subEvents?: { name: string; startDate?: string | null }[]
  competitors?: { name: string; path?: string | null }[]
}): Json {
  return clean({
    '@type': 'SportsEvent',
    '@id': `${absUrl(t.path)}#event`,
    name: t.name,
    url: absUrl(t.path),
    sport: t.sport ?? undefined,
    startDate: t.startDate ?? undefined,
    endDate: t.endDate ?? undefined,
    description: t.description ?? undefined,
    image: t.logoUrl ?? undefined,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    organizer: { '@id': ORGANIZATION_ID },
    competitor: (t.competitors ?? []).map(c => clean({
      '@type': 'SportsTeam',
      name: c.name,
      url: c.path ? absUrl(c.path) : undefined,
    })),
    subEvent: (t.subEvents ?? []).map(s => clean({
      '@type': 'SportsEvent',
      name: s.name,
      startDate: s.startDate ?? undefined,
    })),
  })
}

/** Ordered list of links (standings, catalogues) — helps Google read the table. */
export function itemListLd(items: { name: string; path?: string | null }[]): Json {
  return {
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => clean({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: it.path ? absUrl(it.path) : undefined,
    })),
  }
}

export function softwareApplicationLd(description: string, offers?: { price: string; currency: string }[]): Json {
  return clean({
    '@type': 'SoftwareApplication',
    '@id': `${APP_URL}/#app`,
    name: 'Tournable',
    url: APP_URL,
    applicationCategory: 'SportsApplication',
    operatingSystem: 'Web',
    inLanguage: ['ru', 'kk', 'en'],
    description,
    publisher: { '@id': ORGANIZATION_ID },
    offers: (offers ?? [{ price: '0', currency: 'KZT' }]).map(o => ({
      '@type': 'Offer',
      price: o.price,
      priceCurrency: o.currency,
    })),
  })
}

/**
 * Wraps nodes into a single `@graph` document. One `<script>` per page keeps the
 * entities cross-referenced by `@id` instead of repeating them.
 */
export function jsonLdGraph(...nodes: (Json | null | undefined)[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': nodes.filter(Boolean),
  })
}
