import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // ── Language prefix ────────────────────────────────────────────────────────
  // Public pages live at three URLs (`/x`, `/kz/x`, `/en/x`) and each renders in
  // the language of its own URL, so hreflang describes three real documents. A
  // visitor who picked Kazakh or English still expects a shared link to open in
  // their language, so send them to the prefixed twin. Crawlers carry no cookie
  // and therefore always stay on the Russian canonical.
  const langRedirect = languageRedirect(request)
  if (langRedirect) return NextResponse.redirect(langRedirect)

  // Without a Supabase auth cookie there is no session to read or refresh, so
  // skip the auth round-trip entirely. Crawlers and logged-out visitors are most
  // of the traffic, and getUser() on every one of their requests was the single
  // largest Active CPU cost of the project.
  const hasSession = request.cookies.getAll().some(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
  if (!hasSession) {
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register')

  // Unauthenticated user on a protected route → redirect to login, preserving next
  if (!user && !isAuthPage && request.nextUrl.pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  // Logged-in user on auth page → redirect away, UNLESS this is the multi-account
  // "add account" flow (?add=1), where we intentionally let them reach /login while
  // still signed in so the previous account stays switchable afterwards.
  const isAddFlow = request.nextUrl.searchParams.get('add') === '1'
  if (user && isAuthPage && !isAddFlow) {
    const next = request.nextUrl.searchParams.get('next')
    const target = next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
    return NextResponse.redirect(new URL(target, request.url))
  }

  return supabaseResponse
}

// Paths that exist in all three languages. `/t/<id>/live` (scoreboard) and
// `/leagues/<slug>/seasons/<year>` (redirect helper) have no prefixed twin, so
// they must not be rewritten into a 404.
const PREFIXABLE = /^\/(?:$|t\/[^/]+$|leagues$|leagues\/[^/]+(?:\/(?:players(?:\/[^/]+)?|teams\/[^/]+|matches\/[^/]+))?$|tournaments$|sports(?:\/[^/]+)?$)/

function languageRedirect(request: NextRequest): URL | null {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/kz') || pathname.startsWith('/en')) return null
  if (!PREFIXABLE.test(pathname)) return null

  const lang = request.cookies.get('lang')?.value
  if (lang !== 'kz' && lang !== 'en') return null

  const target = request.nextUrl.clone()
  target.pathname = pathname === '/' ? `/${lang}` : `/${lang}${pathname}`
  return target
}

export const config = {
  // Metadata routes (opengraph-image, sitemap, robots, icons) are excluded on
  // purpose: they carry no session, and running the Supabase auth round-trip on
  // every crawler request to them is pure latency.
  //
  // Beyond that, the proxy only has work for three kinds of request, so it is not
  // invoked at all for the rest (crawlers and logged-out visitors, most traffic):
  //   - /dashboard: a guest is redirected to /login;
  //   - a `lang` cookie: a public page may need its /kz or /en twin;
  //   - a Supabase auth cookie: the session is read and refreshed.
  // Matcher values must be literals, hence the repeated pattern. The cookie name
  // carries the Supabase project ref (sb-<ref>-auth-token, chunked as .0/.1 when
  // large); update it if the project ever changes.
  matcher: [
    '/dashboard/:path*',
    {
      source: '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*opengraph-image|.*twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      has: [{ type: 'cookie', key: 'lang' }],
    },
    {
      source: '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*opengraph-image|.*twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      has: [{ type: 'cookie', key: 'sb-ehvdvpmzpeprkuqkgzbh-auth-token' }],
    },
    {
      source: '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*opengraph-image|.*twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      has: [{ type: 'cookie', key: 'sb-ehvdvpmzpeprkuqkgzbh-auth-token.0' }],
    },
  ],
}
