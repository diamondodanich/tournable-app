'use client'

import { useState } from 'react'
import { signIn } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import Image from 'next/image'
import OAuthButtons from '@/components/auth/OAuthButtons'

type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: {
    tagline: 'Управление турнирами',
    title: 'Вход в аккаунт',
    email: 'Email', emailPh: 'Введите email',
    password: 'Пароль', passwordPh: 'Введите пароль',
    btn: 'Войти', btnLoading: 'Входим…',
    noAccount: 'Нет аккаунта?', registerLink: 'Зарегистрироваться',
    registerHref: '/register',
  },
  kz: {
    tagline: 'Турнирді басқару',
    title: 'Аккаунтқа кіру',
    email: 'Email', emailPh: 'Email енгізіңіз',
    password: 'Құпия сөз', passwordPh: 'Құпия сөзді енгізіңіз',
    btn: 'Кіру', btnLoading: 'Кіруде…',
    noAccount: 'Аккаунт жоқ па?', registerLink: 'Тіркелу',
    registerHref: '/register?lang=kz',
  },
  en: {
    tagline: 'Tournament Management',
    title: 'Sign in to your account',
    email: 'Email', emailPh: 'Enter your email',
    password: 'Password', passwordPh: 'Enter your password',
    btn: 'Sign in', btnLoading: 'Signing in…',
    noAccount: "Don't have an account?", registerLink: 'Sign up',
    registerHref: '/register?lang=en',
  },
} as const

export default function LoginForm({ lang }: { lang: Lang }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const tx = T[lang]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await signIn(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' }}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden">

        {/* Green top bar */}
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

          <OAuthButtons lang={lang} mode="login" />

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
            {tx.noAccount}{' '}
            <Link href={tx.registerHref} className="text-emerald-600 font-bold hover:underline">
              {tx.registerLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
