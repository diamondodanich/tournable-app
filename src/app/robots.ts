import type { MetadataRoute } from 'next'
import { APP_URL } from '@/lib/appUrl'

// Everything under these prefixes is either behind auth, a payment step or a
// per-user view — crawling it burns budget and produces soft-404s / duplicate
// login screens in the index.
const PRIVATE = [
  '/dashboard',
  '/account',
  '/admin',
  '/api/',
  '/auth/',
  '/checkout',
  '/invite',
  '/onboarding',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]

// SEO-tool and marketing crawlers bring no visitors, yet they walked every player
// and match page in all three languages and were a large share of function
// invocations. Search engines (Google, Yandex, Bing) are unaffected.
const NO_CRAWL = [
  'AwarioBot',
  'AwarioSmartBot',
  'AwarioRssBot',
  'SERankingBacklinksBot',
  'ShapBot',
  'PetalBot',
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot',
  'DotBot',
  'DataForSeoBot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE,
      },
      {
        userAgent: NO_CRAWL,
        disallow: '/',
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  }
}
