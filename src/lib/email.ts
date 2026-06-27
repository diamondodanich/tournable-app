import { Resend } from 'resend'
import { render } from '@react-email/render'
import WelcomeEmail from '@/emails/WelcomeEmail'
import InviteEmail from '@/emails/InviteEmail'
import ProActivatedEmail from '@/emails/ProActivatedEmail'
import SubscriptionExpiringEmail from '@/emails/SubscriptionExpiringEmail'
import SubscriptionExpiredEmail from '@/emails/SubscriptionExpiredEmail'

// Lazy client — instantiated on first use so missing key doesn't break build
let _resend: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const FROM    = process.env.FROM_EMAIL        ?? 'Tournable <noreply@tournable.app>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.tournable.app'

// ── Welcome ───────────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(email: string, displayName?: string) {
  const resend = getResend()
  if (!resend) return
  try {
    const html = await render(WelcomeEmail({ displayName, appUrl: APP_URL }))
    await resend.emails.send({
      from:    FROM,
      to:      email,
      subject: 'Добро пожаловать в Tournable!',
      html,
    })
  } catch (e) {
    console.error('[email] welcome failed:', e)
  }
}

// ── Invite ────────────────────────────────────────────────────────────────────
export async function sendInviteEmail(
  toEmail: string,
  tournamentName: string,
  inviteUrl: string,
  role: 'editor' | 'viewer',
  lang: 'ru' | 'kz' | 'en' = 'ru',
) {
  const resend = getResend()
  if (!resend) return
  try {
    const html = await render(InviteEmail({ tournamentName, inviteUrl, role, appUrl: APP_URL, lang }))
    const subjects = {
      ru: `Вас приглашают в турнир «${tournamentName}»`,
      kz: `«${tournamentName}» турниріне шақырылдыңыз`,
      en: `You're invited to tournament "${tournamentName}"`,
    }
    await resend.emails.send({
      from:    FROM,
      to:      toEmail,
      subject: subjects[lang],
      html,
    })
  } catch (e) {
    console.error('[email] invite failed:', e)
  }
}

// ── Pro activated ─────────────────────────────────────────────────────────────
export async function sendProActivatedEmail(
  email: string,
  period: 'monthly' | 'annual',
  amount: number,
  expiresAt: Date,
) {
  const resend = getResend()
  if (!resend) return
  try {
    const html = await render(ProActivatedEmail({ email, period, amount, expiresAt, appUrl: APP_URL }))
    await resend.emails.send({
      from:    FROM,
      to:      email,
      subject: 'Tournable Pro активирован',
      html,
    })
  } catch (e) {
    console.error('[email] pro-activated failed:', e)
  }
}

// ── Subscription expiring (3 days) ────────────────────────────────────────────
export async function sendSubscriptionExpiringEmail(email: string, expiresAt: Date) {
  const resend = getResend()
  if (!resend) return
  try {
    const html = await render(SubscriptionExpiringEmail({ expiresAt, appUrl: APP_URL }))
    await resend.emails.send({
      from:    FROM,
      to:      email,
      subject: 'Ваша подписка Tournable Pro истекает через 3 дня',
      html,
    })
  } catch (e) {
    console.error('[email] expiring failed:', e)
  }
}

// ── Subscription expired ──────────────────────────────────────────────────────
export async function sendSubscriptionExpiredEmail(email: string) {
  const resend = getResend()
  if (!resend) return
  try {
    const html = await render(SubscriptionExpiredEmail({ appUrl: APP_URL }))
    await resend.emails.send({
      from:    FROM,
      to:      email,
      subject: 'Ваша подписка Tournable Pro истекла',
      html,
    })
  } catch (e) {
    console.error('[email] expired failed:', e)
  }
}
