import { createClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/landing/LandingPage'
import type { Metadata } from 'next'
import { LANDING_SEO, OG_LOCALE } from '@/lib/seoCopy'
import {
  jsonLdGraph, organizationLd, webSiteLd, softwareApplicationLd, localizedAlternates, absUrl,
} from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const t = LANDING_SEO.ru
  return {
    title: t.title,
    description: t.description,
    alternates: localizedAlternates(),
    openGraph: {
      type: 'website', siteName: 'Tournable', url: absUrl('/'),
      title: t.title, description: t.description, locale: OG_LOCALE.ru,
      images: [{ url: '/logo-green.png' }],
    },
  }
}

const JSON_LD = jsonLdGraph(
  organizationLd(),
  webSiteLd(),
  softwareApplicationLd(LANDING_SEO.ru.description),
)

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const initials = user?.email?.slice(0, 2).toUpperCase()
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />
      <LandingPage isLoggedIn={!!user} defaultLang="ru" userInitials={initials} />
    </>
  )
}
