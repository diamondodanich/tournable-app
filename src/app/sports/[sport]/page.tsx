import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SportLanding from '@/components/seo/SportLanding'
import { getEventDefs, getSubtype } from '@/lib/sports'
import { FORMAT_LABELS } from '@/lib/formats'
import { SPORT_SEO, sportSeoBySlug, sportPageCopy, trilingualAlternates } from '@/lib/sportSeo'
import { absUrl } from '@/lib/seo'

const LANG = 'ru' as const

// Static page + hourly refresh of the "tournaments in this sport" block: crawlers
// and users get a cached HTML response instead of a fresh SSR pass each time.
export const revalidate = 3600

export function generateStaticParams() {
  return SPORT_SEO.map(e => ({ sport: e.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ sport: string }> }): Promise<Metadata> {
  const { sport } = await params
  const entry = sportSeoBySlug(sport)
  if (!entry) return { title: 'Страница не найдена', robots: { index: false, follow: false } }

  const subtype = getSubtype(entry.sport)
  const formatNames = (subtype?.formats ?? []).map(f => FORMAT_LABELS[f][LANG])
  const statNames = getEventDefs(entry.sport).filter(d => d.stat).map(d => d.label[LANG])
  const copy = sportPageCopy(entry, LANG, formatNames, statNames)
  const path = `/sports/${entry.slug}`

  return {
    title: copy.title,
    description: copy.description,
    alternates: trilingualAlternates(path, LANG),
    openGraph: {
      title: copy.h1, description: copy.description, type: 'website',
      url: absUrl(path), siteName: 'Tournable', locale: 'ru_RU',
      images: [{ url: '/logo-green.png' }],
    },
    twitter: { card: 'summary', title: copy.h1, description: copy.description },
  }
}

export default async function SportPage({ params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params
  const entry = sportSeoBySlug(sport)
  if (!entry) notFound()
  return <SportLanding entry={entry} lang={LANG} />
}
