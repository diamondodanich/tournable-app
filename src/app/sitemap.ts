import { createClient } from '@/lib/supabase/server'
import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tournable.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, slug, updated_at')
    .eq('is_public', true)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(500)

  const tournamentUrls: MetadataRoute.Sitemap = (tournaments ?? []).map((t) => ({
    url: `${APP_URL}/t/${t.slug ?? t.id}`,
    lastModified: new Date(t.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    { url: `${APP_URL}`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${APP_URL}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${APP_URL}/pricing`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${APP_URL}/terms`,    lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${APP_URL}/privacy`,  lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    ...tournamentUrls,
  ]
}
