import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { buildSignature, SECRET_KEY, WIDGET_SECRET, PRICES, ENTERPRISE_PRICES, type PlanPeriod, type PlanType } from '@/lib/freedompay'
import { sendProActivatedEmail } from '@/lib/email'

export const runtime = 'nodejs'

// Единственный доверенный путь активации платного плана. Клиент план не выдаёт:
// он лишь создаёт заказ в 'pending' (см. actions/payments.ts), а перевести заказ
// в 'paid' может только этот обработчик — после проверки подписи FreedomPay.

type PaymentOrder = {
  order_id:   string
  user_id:    string
  plan:       PlanType
  period:     PlanPeriod
  amount_kzt: number
  status:     'pending' | 'paid' | 'failed'
  lang:       'ru' | 'kz' | 'en'
}

// ── Helper: build XML response ────────────────────────────────────────────────
function xmlResponse(status: 'ok' | 'rejected' | 'error', description = '', key = SECRET_KEY) {
  const salt = Math.random().toString(36).slice(2)
  const sig  = buildSignature('result', { pg_status: status, pg_description: description, pg_salt: salt }, key)
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

// Помечает заказ неоплаченным — но только пока он 'pending', чтобы поздний
// отказ не сбросил уже выданный план.
async function markFailed(supabase: SupabaseClient, orderId: string, reason: string) {
  await supabase
    .from('payment_orders')
    .update({ status: 'failed', fail_reason: reason })
    .eq('order_id', orderId)
    .eq('status', 'pending')
}

export async function POST(req: NextRequest) {
  // Parse multipart/form-data or urlencoded
  const params: Record<string, string> = {}
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

  // Терминал может подписывать колбэк ключом приёма или ключом виджета —
  // принимаем оба, оба наши.
  const signingKey = [SECRET_KEY, WIDGET_SECRET]
    .filter(Boolean)
    .find(key => buildSignature('result', rest, key) === pg_sig)

  if (!signingKey) {
    console.error('[freedompay webhook] signature mismatch')
    return xmlResponse('error', 'Invalid signature')
  }

  // ── 2. Service-role client ─────────────────────────────────────────────────
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!url || !serviceKey) {
    console.error('[freedompay webhook] Supabase service key not configured')
    return xmlResponse('error', 'Server configuration error', signingKey)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── 3. Найти заказ, созданный до оплаты ────────────────────────────────────
  const orderId = params.pg_order_id
  if (!orderId) {
    console.error('[freedompay webhook] missing pg_order_id', params)
    return xmlResponse('error', 'Missing pg_order_id', signingKey)
  }

  const { data: order, error: orderErr } = await supabase
    .from('payment_orders')
    .select('order_id, user_id, plan, period, amount_kzt, status, lang')
    .eq('order_id', orderId)
    .maybeSingle<PaymentOrder>()

  if (orderErr) {
    console.error('[freedompay webhook] order lookup failed:', orderErr)
    return xmlResponse('error', 'Order lookup failed', signingKey)
  }

  // Неизвестный заказ активировать не по чему. Отвечаем ok, чтобы FreedomPay не
  // уходил в бесконечные ретраи — разбираться придётся по логу вручную.
  if (!order) {
    console.error(`[freedompay webhook] unknown order ${orderId} — активация пропущена`)
    return xmlResponse('ok', 'Unknown order', signingKey)
  }

  // ── 4. Результат платежа ───────────────────────────────────────────────────
  const pgResult = params.pg_result  // '1' = success, '0' = failure, '2' = partial
  if (pgResult !== '1') {
    await markFailed(supabase, orderId, `pg_result=${pgResult ?? 'none'}`)
    return xmlResponse('ok', 'Payment not successful', signingKey)
  }

  // ── 5. Сверить сумму с прайсом в коде ──────────────────────────────────────
  // Именно код, а не поле заказа: строку заказа создаёт клиентская сессия, и
  // подделанная в ней сумма не должна открывать дорогу к дешёвому Enterprise.
  const prices   = order.plan === 'enterprise' ? ENTERPRISE_PRICES : PRICES
  const priceRow = prices[order.period]

  if (!priceRow) {
    console.error(`[freedompay webhook] unknown period ${order.period} for order ${orderId}`)
    await markFailed(supabase, orderId, 'unknown period')
    return xmlResponse('ok', 'Unknown period', signingKey)
  }

  const paid     = Number(params.pg_amount)
  const currency = params.pg_currency ?? 'KZT'

  if (!Number.isFinite(paid) || Math.round(paid) < priceRow.amount || currency !== 'KZT') {
    console.error(
      `[freedompay webhook] amount mismatch on ${orderId}: получено ${params.pg_amount} ${currency}, ожидалось ${priceRow.amount} KZT`,
    )
    await markFailed(supabase, orderId, `amount mismatch: ${params.pg_amount} ${currency}`)
    return xmlResponse('ok', 'Amount mismatch', signingKey)
  }

  // ── 6. Занять заказ (идемпотентность) ──────────────────────────────────────
  // Условие status = 'pending' в UPDATE делает повторный колбэк безопасным:
  // второй раз ни одна строка не вернётся, значит план не продлится дважды.
  const { data: claimed, error: claimErr } = await supabase
    .from('payment_orders')
    .update({
      status:     'paid',
      paid_at:    new Date().toISOString(),
      payment_id: params.pg_payment_id ?? null,
    })
    .eq('order_id', orderId)
    .eq('status', 'pending')
    .select('order_id')

  if (claimErr) {
    console.error('[freedompay webhook] order claim failed:', claimErr)
    return xmlResponse('error', 'Failed to claim order', signingKey)
  }

  if (!claimed?.length) {
    console.log(`[freedompay webhook] order ${orderId} уже обработан (status=${order.status}) — пропуск`)
    return xmlResponse('ok', 'Already processed', signingKey)
  }

  // ── 7. Активировать план ───────────────────────────────────────────────────
  // Продление считаем от текущей даты окончания, если она ещё не прошла, —
  // иначе оплата за месяц вперёд съедала бы остаток уже оплаченного периода.
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_expires_at')
    .eq('id', order.user_id)
    .maybeSingle<{ plan_expires_at: string | null }>()

  const currentExpiry = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : null
  const base = currentExpiry && currentExpiry.getTime() > Date.now() ? currentExpiry : new Date()

  const expiresAt = new Date(base)
  expiresAt.setMonth(expiresAt.getMonth() + priceRow.months)

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id:              order.user_id,
        plan:            order.plan,
        plan_expires_at: expiresAt.toISOString(),
        updated_at:      new Date().toISOString(),
      },
      { onConflict: 'id' },
    )

  if (error) {
    console.error(`[freedompay webhook] failed to activate ${order.plan}:`, error)
    // Заказ уже помечен оплаченным — откатываем в 'pending', чтобы ретрай
    // FreedomPay (ответ 'error') смог довести активацию до конца.
    await supabase.from('payment_orders').update({ status: 'pending' }).eq('order_id', orderId)
    return xmlResponse('error', 'Failed to activate subscription', signingKey)
  }

  // ── 8. Записать платёж в историю ───────────────────────────────────────────
  const { error: subErr } = await supabase.from('subscriptions').insert({
    user_id:     order.user_id,
    plan:        order.plan,
    expires_at:  expiresAt.toISOString(),
    amount_kzt:  priceRow.amount,
    source:      'freedompay',
    external_id: params.pg_payment_id ?? orderId,
  })
  if (subErr) console.error('[freedompay webhook] subscriptions insert:', subErr)

  // ── 9. Письмо об активации (best-effort) ───────────────────────────────────
  try {
    const { data: authUser } = await supabase.auth.admin.getUserById(order.user_id)
    const email = authUser?.user?.email
    if (email) {
      await sendProActivatedEmail(email, order.period, priceRow.amount, expiresAt, order.plan, order.lang)
    }
  } catch (mailErr) {
    console.error('[freedompay webhook] activation email skipped:', mailErr)
  }

  console.log(`[freedompay webhook] ${order.plan} activated for ${order.user_id} until ${expiresAt.toISOString()}`)
  return xmlResponse('ok', `${order.plan} activated`, signingKey)
}
