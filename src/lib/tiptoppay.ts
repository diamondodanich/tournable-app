import crypto from 'crypto'

// ── Constants ─────────────────────────────────────────────────────────────────
// Public ID is safe to expose client-side (same trust level as a Stripe publishable key).
export const PUBLIC_ID  = process.env.NEXT_PUBLIC_TIPTOPPAY_PUBLIC_ID ?? ''
// API Secret must stay server-side only — used to verify webhook signatures.
export const API_SECRET = process.env.TIPTOPPAY_API_SECRET ?? ''

export const WIDGET_SCRIPT_URL = 'https://widget.tiptoppay.kz/bundles/widget.js'

// Plan pricing — mirrors src/lib/freedompay.ts so both providers quote the same price
export const PRICES = {
  monthly: { amount: 4990,  months: 1  },
  annual:  { amount: 44990, months: 12 },
} as const

export const ENTERPRISE_PRICES = {
  monthly: { amount: 39990,  months: 1  },
  annual:  { amount: 349990, months: 12 },
} as const

export type PlanPeriod = keyof typeof PRICES
export type PlanType = 'pro' | 'enterprise'

export interface PaymentMetadata {
  user_id: string
  plan_period: PlanPeriod
  plan_type: PlanType
}

// ── Webhook signature verification ─────────────────────────────────────────────
// TipTop Pay (CloudPayments-compatible) signs each notification with a
// `Content-HMAC` header: base64( HMAC-SHA256(rawBody, ApiSecret) ).
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !API_SECRET) return false

  const expected = crypto.createHmac('sha256', API_SECRET).update(rawBody, 'utf8').digest('base64')

  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
