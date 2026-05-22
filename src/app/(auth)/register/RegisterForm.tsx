'use client'

import { useState } from 'react'
import { signUp } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import Image from 'next/image'

type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: {
    tagline: 'Управление турнирами',
    title: 'Создать аккаунт',
    email: 'Email', emailPh: 'Введите email',
    password: 'Пароль', passwordPh: 'Введите пароль',
    confirm: 'Подтвердите пароль', confirmPh: 'Повторите пароль',
    btn: 'Зарегистрироваться', btnLoading: 'Создаём аккаунт…',
    hasAccount: 'Уже есть аккаунт?', loginLink: 'Войти',
    loginHref: '/login',
    mismatch: 'Пароли не совпадают',
    tooShort: 'Пароль должен быть не менее 6 символов',
  },
  kz: {
    tagline: 'Турнирді басқару',
    title: 'Аккаунт жасау',
    email: 'Email', emailPh: 'Email енгізіңіз',
    password: 'Құпия сөз', passwordPh: 'Құпия сөзді енгізіңіз',
    confirm: 'Құпия сөзді растаңыз', confirmPh: 'Құпия сөзді қайталаңыз',
    btn: 'Тіркелу', btnLoading: 'Аккаунт жасалуда…',
    hasAccount: 'Аккаунт бар ма?', loginLink: 'Кіру',
    loginHref: '/login?lang=kz',
    mismatch: 'Құпия сөздер сәйкес келмейді',
    tooShort: 'Құпия сөз кемінде 6 таңбадан тұруы керек',
  },
  en: {
    tagline: 'Tournament Management',
    title: 'Create an account',
    email: 'Email', emailPh: 'Enter your email',
    password: 'Password', passwordPh: 'Enter your password',
    confirm: 'Confirm password', confirmPh: 'Repeat your password',
    btn: 'Create account', btnLoading: 'Creating account…',
    hasAccount: 'Already have an account?', loginLink: 'Sign in',
    loginHref: '/login?lang=en',
    mismatch: 'Passwords do not match',
    tooShort: 'Password must be at least 6 characters',
  },
} as const

export default function RegisterForm({ lang }: { lang: Lang }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const tx = T[lang]

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
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Image src="/logo-green.png" alt="Tournable" width={44} height={44} className="w-11 h-11 object-contain" />
            <div>
              <div className="font-black text-xl tracking-tight text-gray-900" style={{ letterSpacing: '-.03em' }}>TOURNABLE</div>
              <div className="text-xs text-gray-400">{tx.tagline}</div>
            </div>
          </div>

          <h1 className="text-xl font-black text-gray-900 mb-6">{tx.title}</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
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
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {tx.hasAccount}{' '}
            <Link href={tx.loginHref} className="text-emerald-600 font-bold hover:underline">
              {tx.loginLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
