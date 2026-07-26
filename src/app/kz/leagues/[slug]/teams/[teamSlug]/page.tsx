import type { Metadata } from 'next'
import TeamPage, { teamMetadata } from '@/components/public/TeamPage'

const LANG = 'kz' as const

export async function generateMetadata({ params }: { params: Promise<{ slug: string; teamSlug: string }> }): Promise<Metadata> {
  const { slug, teamSlug } = await params
  return teamMetadata(slug, teamSlug, LANG)
}

export default async function Page({ params }: { params: Promise<{ slug: string; teamSlug: string }> }) {
  const { slug, teamSlug } = await params
  return <TeamPage slug={slug} teamSlug={teamSlug} lang={LANG} />
}
