'use client'

import { useState } from 'react'
import { signUp } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import Image from 'next/image'
import OAuthButtons from '@/components/auth/OAuthButtons'

type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: {
    tagline: 'Профессиональные турниры — в вашем телефоне',
    title: 'Создайте аккаунт — это бесплатно',
    email: 'Email', emailPh: 'Введите email',
    password: 'Пароль', passwordPh: 'Придумайте пароль',
    confirm: 'Подтвердите пароль', confirmPh: 'Повторите пароль',
    btn: 'Создать аккаунт бесплатно', btnLoading: 'Создаём аккаунт…',
    hasAccount: 'Уже есть аккаунт?', loginLink: 'Войти',
    mismatch: 'Пароли не совпадают',
    tooShort: 'Пароль должен быть не менее 6 символов',
    consent: 'Нажимая «Создать аккаунт», вы принимаете',
    consentTerms: 'Пользовательское соглашение',
    consentAnd: 'и',
    consentPrivacy: 'Политику конфиденциальности',
  },
  kz: {
    tagline: 'Кәсіби турнирлер — телефоныңызда',
    title: 'Аккаунт жасаңыз — бұл тегін',
    email: 'Email', emailPh: 'Email енгізіңіз',
    password: 'Құпия сөз', passwordPh: 'Құпия сөз ойлап табыңыз',
    confirm: 'Құпия сөзді растаңыз', confirmPh: 'Құпия сөзді қайталаңыз',
    btn: 'Тегін аккаунт жасау', btnLoading: 'Аккаунт жасалуда…',
    hasAccount: 'Аккаунт бар ма?', loginLink: 'Кіру',
    mismatch: 'Құпия сөздер сәйкес келмейді',
    tooShort: 'Құпия сөз кемінде 6 таңбадан тұруы керек',
    consent: '«Аккаунт жасау» батырмасын басу арқылы сіз қабылдайсыз',
    consentTerms: 'Пайдаланушы келісімін',
    consentAnd: 'және',
    consentPrivacy: 'Құпиялылық саясатын',
  },
  en: {
    tagline: 'Professional tournaments — at your fingertips',
    title: 'Create your account — it\'s free',
    email: 'Email', emailPh: 'Enter your email',
    password: 'Password', passwordPh: 'Create a password',
    confirm: 'Confirm password', confirmPh: 'Repeat your password',
    btn: 'Create free account', btnLoading: 'Creating account…',
    hasAccount: 'Already have an account?', loginLink: 'Sign in',
    mismatch: 'Passwords do not match',
    tooShort: 'Password must be at least 6 characters',
    consent: 'By clicking "Create account" you agree to our',
    consentTerms: 'Terms of Service',
    consentAnd: 'and',
    consentPrivacy: 'Privacy Policy',
  },
} as const

export default function RegisterForm({ lang, next = '' }: { lang: Lang; next?: string }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const tx = T[lang]

  const langSuffix = lang !== 'ru' ? `?lang=${lang}` : ''
  const loginHref = next
    ? `/login${langSuffix || '?'}${langSuffix ? '&' : ''}next=${encodeURIComponent(next)}`
    : `/login${langSuffix}`

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string
    if (password !== confirm) { setError(tx.mismatch); setLoading(false); return }
    if (password.length < 6) { setError(tx.tooShort); setLoading(false); return }
    const result = await signUp(formData)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' }}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden">

        <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#047857,#10b981)' }} />

        <div className="p-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Image src="/logo-green.png" alt="Tournable" width={44} height={44} className="w-11 h-11 object-contain" />
            <div>
              <div className="font-black text-xl tracking-tight text-gray-900" style={{ letterSpacing: '-.03em' }}>TOURNABLE</div>
              <div className="text-xs text-gray-400">{tx.tagline}</div>
            </div>
          </div>

          <h1 className="text-xl font-black text-gray-900 mb-6">{tx.title}</h1>

          <OAuthButtons lang={lang} mode="register" next={next} />

          <form onSubmit={handleSubmit} className="space-y-4">
            {next && <input type="hidden" name="next" value={next} />}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">{tx.email}</Label>
              <Input id="email" name="email" type="email" placeholder={tx.emailPh} required
                className="rounded-xl border-gray-200 focus:border-emerald-400 focus:ring-emerald-400" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">{tx.password}</Label>
              <Input id="password" name="password" type="password" placeholder={tx.passwordPh} required
                className="rounded-xl border-gray-200 focus:border-emerald-400 focus:ring-emerald-400" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-sm font-semibold text-gray-700">{tx.confirm}</Label>
              <Input id="confirm" name="confirm" type="password" placeholder={tx.confirmPh} required
                className="rounded-xl border-gray-200 focus:border-emerald-400 focus:ring-emerald-400" />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading}
              className="w-full rounded-xl h-11 font-bold text-base"
              style={{ background: 'linear-gradient(90deg,#047857,#059669)' }}>
              {loading ? tx.btnLoading : tx.btn}
            </Button>

            <p className="text-center text-xs text-gray-400 leading-relaxed">
              {tx.consent}{' '}
              <Link href="/terms" className="text-emerald-600 hover:underline">{tx.consentTerms}</Link>
              {' '}{tx.consentAnd}{' '}
              <Link href="/privacy" className="text-emerald-600 hover:underline">{tx.consentPrivacy}</Link>
            </p>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {tx.hasAccount}{' '}
            <Link href={loginHref} className="text-emerald-600 font-bold hover:underline">
              {tx.loginLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
