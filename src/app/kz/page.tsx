import { createClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/landing/LandingPage'
import type { Metadata } from 'next'
import { LANDING_SEO, OG_LOCALE } from '@/lib/seoCopy'
import { jsonLdGraph, organizationLd, webSiteLd, softwareApplicationLd, localizedAlternates, absUrl } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const t = LANDING_SEO.kz
  return {
    // `absolute` — the copy already opens with the brand, and the root layout's
    // "%s — Tournable" template would append it a second time.
    title: { absolute: t.title },
    description: t.description,
    alternates: { ...localizedAlternates(), canonical: '/kz' },
    openGraph: {
      type: 'website', siteName: 'Tournable', url: absUrl('/kz'),
      title: t.title, description: t.description, locale: OG_LOCALE.kz,
    },
  }
}

const JSON_LD = jsonLdGraph(
  organizationLd(),
  webSiteLd(),
  softwareApplicationLd(LANDING_SEO.kz.description),
)

export default async function LandingKzPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const initials = user?.email?.slice(0, 2).toUpperCase()
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />
      <LandingPage isLoggedIn={!!user} defaultLang="kz" userInitials={initials} />
    </>
  )
}
