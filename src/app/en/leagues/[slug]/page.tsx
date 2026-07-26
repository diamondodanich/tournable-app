import type { Metadata } from 'next'
import LeaguePage, { leagueMetadata } from '@/components/public/LeaguePage'

const LANG = 'en' as const

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return leagueMetadata(slug, LANG)
}

export default async function Page({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ season?: string }>
}) {
  const { slug } = await params
  const { season } = await searchParams
  return <LeaguePage slug={slug} seasonParam={season} lang={LANG} />
}
