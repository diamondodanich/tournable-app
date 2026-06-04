import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildSignature, SECRET_KEY, PRICES, type PlanPeriod } from '@/lib/freedompay'

export const runtime = 'nodejs'

// ── Helper: build XML response ────────────────────────────────────────────────
function xmlResponse(status: 'ok' | 'rejected' | 'error', description = '') {
  const salt = Math.random().toString(36).slice(2)
  const sig  = buildSignature('result', { pg_status: status, pg_description: description, pg_salt: salt })
  const xml  = `<?xml version="1.0" encoding="utf-8"?>
<response>
  <pg_status>${status}</pg_status>
  <pg_description>${description}</pg_description>
  <pg_salt>${salt}</pg_salt>
  <pg_sig>${sig}</pg_sig>
</response>`
  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  })
}

export async function POST(req: NextRequest) {
  // Parse multipart/form-data or urlencoded
  let params: Record<string, string> = {}
  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    form.forEach((v, k) => { params[k] = v.toString() })
  } else {
    const text = await req.text()
    new URLSearchParams(text).forEach((v, k) => { params[k] = v })
  }

  // ── 1. Verify signature ────────────────────────────────────────────────────
  const { pg_sig, ...rest } = params
  if (!pg_sig) return xmlResponse('error', 'Missing pg_sig')

  const expected = buildSignature('result', rest, SECRET_KEY)
  if (expected !== pg_sig) {
    console.error('[freedompay webhook] signature mismatch')
    return xmlResponse('error', 'Invalid signature')
  }

  // ── 2. Check payment result ────────────────────────────────────────────────
  const pgResult = params.pg_result  // '1' = success, '0' = failure, '2' = partial
  if (pgResult !== '1') {
    // Payment failed or incomplete — acknowledge without activating
    return xmlResponse('ok', 'Payment not successful')
  }

  // ── 3. Extract our custom params ──────────────────────────────────────────
  const userId     = params.user_id    as string | undefined
  const planPeriod = params.plan_period as PlanPeriod | undefined

  if (!userId || !planPeriod || !(planPeriod in PRICES)) {
    console.error('[freedompay webhook] missing user_id or plan_period', params)
    return xmlResponse('error', 'Missing user_id or plan_period')
  }

  // ── 4. Activate Pro ───────────────────────────────────────────────────────
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!url || !serviceKey) {
    console.error('[freedompay webhook] Supabase service key not configured')
    return xmlResponse('error', 'Server configuration error')
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const months    = PRICES[planPeriod].months
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + months)

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id:              userId,
        plan:            'pro',
        plan_expires_at: expiresAt.toISOString(),
        updated_at:      new Date().toISOString(),
      },
      { onConflict: 'id' },
    )

  if (error) {
    console.error('[freedompay webhook] failed to activate pro:', error)
    return xmlResponse('error', 'Failed to activate subscription')
  }

  // ── 5. Record payment in subscriptions table ──────────────────────────────
  const { error: subErr } = await supabase.from('subscriptions').insert({
    user_id:     userId,
    plan:        'pro',
    expires_at:  expiresAt.toISOString(),
    amount_kzt:  PRICES[planPeriod].amount,
    source:      'freedompay',
    external_id: params.pg_payment_id ?? params.pg_order_id ?? null,
  })
  if (subErr) console.error('[freedompay webhook] subscriptions insert:', subErr)

  console.log(`[freedompay webhook] Pro activated for ${userId} until ${expiresAt.toISOString()}`)
  return xmlResponse('ok', 'Pro activated')
}
