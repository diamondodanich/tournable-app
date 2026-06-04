import crypto from 'crypto'

// ── Constants ─────────────────────────────────────────────────────────────────
export const MERCHANT_ID = process.env.FREEDOMPAY_MERCHANT_ID ?? ''
export const SECRET_KEY  = process.env.FREEDOMPAY_SECRET_KEY  ?? ''
export const APP_URL     = process.env.NEXT_PUBLIC_APP_URL    ?? 'https://tournable-app.vercel.app'

// Classic FreedomPay API (compatible with Paybox.money protocol)
const API_ENDPOINT = 'https://api.freedompay.kz/v2/payment/purchase'

// Plan pricing
export const PRICES = {
  monthly: { amount: 4990,  months: 1  },
  annual:  { amount: 44990, months: 12 },
} as const

export type PlanPeriod = keyof typeof PRICES

// ── Signature ─────────────────────────────────────────────────────────────────
// Formula: MD5(scriptName + ';' + sorted_param_values_by_key + ';' + secretKey)
export function buildSignature(
  scriptName: string,
  params: Record<string, string>,
  secretKey = SECRET_KEY,
): string {
  const sorted = Object.keys(params)
    .sort()
    .map(k => params[k])

  const parts = [scriptName, ...sorted, secretKey]
  return crypto.createHash('md5').update(parts.join(';')).digest('hex')
}

export function verifySignature(
  scriptName: string,
  params: Record<string, string>,
  sigToVerify: string,
  secretKey = SECRET_KEY,
): boolean {
  // Remove pg_sig from params before computing
  const { pg_sig: _, ...rest } = params
  const expected = buildSignature(scriptName, rest, secretKey)
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(sigToVerify.padEnd(32, '0').slice(0, 32), 'hex'),
  )
}

// ── Payment initiation ────────────────────────────────────────────────────────
export interface CreatePaymentResult {
  redirectUrl: string
  paymentId:   string
}

export async function createPayment(
  userId:   string,
  period:   PlanPeriod,
): Promise<CreatePaymentResult> {
  const { amount } = PRICES[period]
  const salt    = crypto.randomBytes(8).toString('hex')
  const orderId = `t_${userId.replace(/-/g, '').slice(0, 16)}_${Date.now()}`

  const params: Record<string, string> = {
    pg_merchant_id:   MERCHANT_ID,
    pg_order_id:      orderId,
    pg_amount:        amount.toString(),
    pg_currency:      'KZT',
    pg_description:   `Tournable Pro — ${period === 'monthly' ? 'Месяц' : 'Год'}`,
    pg_result_url:    `${APP_URL}/api/webhooks/freedompay`,
    pg_success_url:   `${APP_URL}/checkout/success`,
    pg_failure_url:   `${APP_URL}/checkout/fail`,
    pg_salt:          salt,
    // Custom params — echoed back in webhook so we know who to activate
    user_id:          userId,
    plan_period:      period,
  }

  params.pg_sig = buildSignature('purchase', params)

  const body = new URLSearchParams(params).toString()
  const res  = await fetch(API_ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    throw new Error(`FreedomPay API error: ${res.status}`)
  }

  const data = await res.json() as Record<string, string>

  if (data.pg_status !== 'ok') {
    throw new Error(`FreedomPay: ${data.pg_error_description ?? data.pg_status}`)
  }

  return {
    redirectUrl: data.pg_redirect_url,
    paymentId:   data.pg_payment_id ?? orderId,
  }
}
