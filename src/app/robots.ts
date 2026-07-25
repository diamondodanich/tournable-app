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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE,
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  }
}
