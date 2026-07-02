// Client-safe module: no Node imports here — TipTopPayButton (client component)
// imports constants from this file. Webhook signature verification lives in
// src/app/api/webhooks/tiptoppay/route.ts (server-only).

// Public ID is safe to expose client-side (same trust level as a Stripe publishable key).
export const PUBLIC_ID  = process.env.NEXT_PUBLIC_TIPTOPPAY_PUBLIC_ID ?? ''

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
