import { indexNowKey } from '@/lib/indexnow'

// Ownership proof for IndexNow: the file must contain exactly the key that is
// sent with each submission. 404 while INDEXNOW_KEY is unset, which is also the
// state in which nothing is ever submitted.
export async function GET() {
  const key = indexNowKey()
  if (!key) return new Response('Not found', { status: 404 })

  return new Response(key, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
