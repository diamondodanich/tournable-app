import { createClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/landing/LandingPage'
import type { Metadata } from 'next'
import { LANDING_SEO, OG_LOCALE } from '@/lib/seoCopy'
import { jsonLdGraph, organizationLd, webSiteLd, softwareApplicationLd, localizedAlternates, absUrl } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const t = LANDING_SEO.en
  return {
    // `absolute` — the copy already opens with the brand, and the root layout's
    // "%s — Tournable" template would append it a second time.
    title: { absolute: t.title },
    description: t.description,
    // Same hreflang cluster as the Russian landing; this URL is the canonical
    // English entry point.
    alternates: { ...localizedAlternates(), canonical: '/en' },
    openGraph: {
      type: 'website', siteName: 'Tournable', url: absUrl('/en'),
      title: t.title, description: t.description, locale: OG_LOCALE.en,
    },
  }
}

const JSON_LD = jsonLdGraph(
  organizationLd(),
  webSiteLd(),
  softwareApplicationLd(LANDING_SEO.en.description),
)

export default async function LandingEnPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const initials = user?.email?.slice(0, 2).toUpperCase()
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />
      <LandingPage isLoggedIn={!!user} defaultLang="en" userInitials={initials} />
    </>
  )
}
