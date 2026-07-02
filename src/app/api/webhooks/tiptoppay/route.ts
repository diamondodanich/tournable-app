import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PRICES, ENTERPRISE_PRICES, type PlanPeriod, type PlanType } from '@/lib/tiptoppay'

export const runtime = 'nodejs'

// TipTop Pay signs each notification: Content-HMAC / X-Content-HMAC header =
// base64( HMAC-SHA256(rawBody, ApiSecret) ), UTF8. API Secret is server-only.
const API_SECRET = process.env.TIPTOPPAY_API_SECRET ?? ''

function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !API_SECRET) return false

  const expected = crypto.createHmac('sha256', API_SECRET).update(rawBody, 'utf8').digest('base64')

  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

// TipTop Pay expects {"code": 0} to acknowledge a notification; any other
// code (or a timeout) triggers up to 100 retries.
function ack() {
  return NextResponse.json({ code: 0 })
}

async function parseBody(req: NextRequest): Promise<{ raw: string; params: Record<string, string> }> {
  const raw = await req.text()
  const contentType = req.headers.get('content-type') ?? ''

  let params: Record<string, string> = {}
  if (contentType.includes('application/json')) {
    try { params = JSON.parse(raw) } catch { params = {} }
  } else {
    new URLSearchParams(raw).forEach((v, k) => { params[k] = v })
  }
  return { raw, params }
}

export async function POST(req: NextRequest) {
  const { raw, params } = await parseBody(req)

  const signature = req.headers.get('content-hmac') ?? req.headers.get('x-content-hmac')
  if (!verifyWebhookSignature(raw, signature)) {
    console.error('[tiptoppay webhook] signature mismatch')
    // Acknowledge anyway — TipTop Pay will otherwise retry a forged/malformed
    // request 100 times. We simply never activate a plan without a valid signature.
    return ack()
  }

  // Only Pay notifications with a successful authorization may activate a plan.
  // Fail/Refund/Cancel notifications carry the same Data metadata — never
  // activate from those even if a stray toggle in the TipTop ЛК routes them here.
  const status = params.Status ?? ''
  if (status !== 'Completed' && status !== 'Authorized') {
    console.log(`[tiptoppay webhook] ignoring notification with Status="${status}"`)
    return ack()
  }

  // Widget's `metadata` param comes back as a JSON-encoded `Data` field
  let metadata: Partial<PaymentMetadata> = {}
  if (params.Data) {
    try { metadata = JSON.parse(params.Data) } catch { metadata = {} }
  }

  const userId     = metadata.user_id ?? params.AccountId
  const planPeriod = metadata.plan_period
  const planType   = metadata.plan_type ?? 'pro'

  if (!userId || !planPeriod || !(planPeriod in PRICES)) {
    console.error('[tiptoppay webhook] missing user_id or plan_period', params)
    return ack()
  }

  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !serviceKey) {
    console.error('[tiptoppay webhook] Supabase service key not configured')
    return ack()
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const prices    = planType === 'enterprise' ? ENTERPRISE_PRICES : PRICES
  const months    = prices[planPeriod as PlanPeriod].months
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + months)

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id:              userId,
        plan:            planType,
        plan_expires_at: expiresAt.toISOString(),
        updated_at:      new Date().toISOString(),
      },
      { onConflict: 'id' },
    )

  if (error) {
    console.error(`[tiptoppay webhook] failed to activate ${planType}:`, error)
    return ack()
  }

  const { error: subErr } = await supabase.from('subscriptions').insert({
    user_id:     userId,
    plan:        planType,
    expires_at:  expiresAt.toISOString(),
    amount_kzt:  prices[planPeriod as PlanPeriod].amount,
    source:      'cloudpayments',
    external_id: params.TransactionId ?? params.SubscriptionId ?? null,
  })
  if (subErr) console.error('[tiptoppay webhook] subscriptions insert:', subErr)

  console.log(`[tiptoppay webhook] ${planType} activated for ${userId} until ${expiresAt.toISOString()}`)
  return ack()
}

interface PaymentMetadata {
  user_id: string
  plan_period: PlanPeriod
  plan_type: PlanType
}
