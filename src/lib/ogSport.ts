// Shared body for the three localized /sports/<slug>/opengraph-image routes.

import { getCategoryForSport, getEventDefs, getSportTheme, getSubtype, type Lang } from '@/lib/sports'
import { FORMAT_LABELS } from '@/lib/formats'
import { sportSeoBySlug, sportPageCopy } from '@/lib/sportSeo'
import { renderOgCard } from '@/lib/og'

export async function sportOgImage(slug: string, lang: Lang) {
  const entry = sportSeoBySlug(slug)
  if (!entry) return renderOgCard({ title: 'Tournable', subtitle: 'tournable.app' })

  const subtype = getSubtype(entry.sport)
  const formatNames = (subtype?.formats ?? []).map(f => FORMAT_LABELS[f][lang])
  const statNames = getEventDefs(entry.sport).filter(d => d.stat).map(d => d.label[lang])
  const copy = sportPageCopy(entry, lang, formatNames, statNames)
  const theme = getSportTheme(entry.sport)

  return renderOgCard({
    eyebrow: getCategoryForSport(entry.sport)?.label[lang] ?? entry.name[lang],
    title: copy.h1,
    // The formats really available for this discipline, not a generic feature list.
    subtitle: formatNames.slice(0, 4).join(' · ') || null,
    accent: theme.primary,
    background: theme.heroDark,
  })
}
