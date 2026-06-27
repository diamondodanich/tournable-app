import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SeasonArchivePage({ params }: { params: Promise<{ slug: string; year: string }> }) {
  const { slug, year } = await params
  // `year` can be either a season ID or a year number
  // For now redirect to the league page with season param if it looks like a season ID
  redirect(`/leagues/${slug}?season=${year}`)
}
