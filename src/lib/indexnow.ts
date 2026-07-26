import { APP_URL } from '@/lib/appUrl'

// IndexNow lets a site tell Bing and Yandex that a URL appeared or changed,
// instead of waiting for the next crawl. Google does not participate — for it
// the sitemap plus internal links remain the only channel.
//
// Setup: generate any 8–128 character hex string, put it in the INDEXNOW_KEY
// env var, and the key file is served from /indexnow-key.txt automatically.
// Without the variable every call is a silent no-op, so local and preview
// environments never ping anything.

const ENDPOINT = 'https://api.indexnow.org/IndexNow'

export function indexNowKey(): string | null {
  const key = process.env.INDEXNOW_KEY?.trim()
  return key && key.length >= 8 ? key : null
}

/**
 * Submits site-relative paths (e.g. `/t/kubok-dvora`). Never throws and never
 * blocks a user action for more than a moment: publishing a tournament must not
 * fail because a search engine is slow.
 */
export async function submitToIndexNow(paths: string[]): Promise<void> {
  const key = indexNowKey()
  if (!key || paths.length === 0) return
  if (!APP_URL.startsWith('https://')) return

  const host = new URL(APP_URL).host
  const urlList = paths.map(p => (p.startsWith('http') ? p : `${APP_URL}${p.startsWith('/') ? p : `/${p}`}`))

  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${APP_URL}/indexnow-key.txt`,
        urlList: urlList.slice(0, 10_000),
      }),
      signal: AbortSignal.timeout(3000),
    })
  } catch {
    // Submission is an optimisation, not a requirement — the sitemap still covers it.
  }
}
