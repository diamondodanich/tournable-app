import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTelegramMessage } from '@/lib/telegram'
import { formatDigest, type ProductMetrics } from '@/lib/metrics'

export const runtime = 'nodejs'

// Ежедневная сводка продуктовых метрик в Telegram.
// Запускается Vercel Cron в 01:00 UTC = 07:00 по Астане (vercel.json).
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // product_metrics() пускает только admin или service_role — anon здесь не сработает
  if (!serviceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY не задан' }, { status: 500 })
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabase.rpc('product_metrics')

  if (error || !data) {
    console.error('[cron] product_metrics RPC error:', error?.message)
    return NextResponse.json({ error: error?.message ?? 'no data' }, { status: 500 })
  }

  const metrics = data as ProductMetrics
  const sent = await sendTelegramMessage(formatDigest(metrics))

  return NextResponse.json({ ok: true, sent: sent.ok, error: sent.error, metrics })
}
