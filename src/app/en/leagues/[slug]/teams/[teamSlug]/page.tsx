import type { Metadata } from 'next'
import TeamPage, { teamMetadata } from '@/components/public/TeamPage'

const LANG = 'en' as const

// Public, cookie-free data: render on first visit, then serve from cache.
// Edits from the dashboard purge it at once (lib/revalidate); 5 min is the fallback.
export const revalidate = 300
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; teamSlug: string }> }): Promise<Metadata> {
  const { slug, teamSlug } = await params
  return teamMetadata(slug, teamSlug, LANG)
}

export default async function Page({ params }: { params: Promise<{ slug: string; teamSlug: string }> }) {
  const { slug, teamSlug } = await params
  return <TeamPage slug={slug} teamSlug={teamSlug} lang={LANG} />
}
