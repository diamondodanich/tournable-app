import { Resend } from 'resend'
import { render } from '@react-email/render'
import WelcomeEmail from '@/emails/WelcomeEmail'
import InviteEmail from '@/emails/InviteEmail'
import SubscriptionExpiringEmail from '@/emails/SubscriptionExpiringEmail'
import SubscriptionExpiredEmail from '@/emails/SubscriptionExpiredEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM  = process.env.FROM_EMAIL    ?? 'Tournable <noreply@tournable.kz>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tournable.vercel.app'

// ── Welcome ───────────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(email: string, displayName?: string) {
  if (!process.env.RESEND_API_KEY) return
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
) {
  if (!process.env.RESEND_API_KEY) return
  try {
    const html = await render(InviteEmail({ tournamentName, inviteUrl, role, appUrl: APP_URL }))
    const roleLabel = role === 'editor' ? 'редактора' : 'наблюдателя'
    await resend.emails.send({
      from:    FROM,
      to:      toEmail,
      subject: `Вас приглашают в турнир «${tournamentName}» — роль ${roleLabel}`,
      html,
    })
  } catch (e) {
    console.error('[email] invite failed:', e)
  }
}

// ── Subscription expiring (3 days) ────────────────────────────────────────────
export async function sendSubscriptionExpiringEmail(email: string, expiresAt: Date) {
  if (!process.env.RESEND_API_KEY) return
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
  if (!process.env.RESEND_API_KEY) return
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
