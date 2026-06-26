'use client'

import { useState } from 'react'
import { changePassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [done, setDone]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await changePassword(new FormData(e.currentTarget))
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setDone(true)
    }
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
              <div className="text-xs text-gray-400">Новый пароль</div>
            </div>
          </div>

          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
              <div>
                <p className="font-black text-gray-900 text-lg mb-1">Пароль обновлён</p>
                <p className="text-sm text-gray-500">Теперь вы можете войти с новым паролем.</p>
              </div>
              <Link href="/dashboard"
                className="inline-block w-full text-center py-2.5 rounded-xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(90deg,#047857,#059669)' }}>
                Перейти в кабинет
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-black text-gray-900 mb-2">Новый пароль</h1>
              <p className="text-sm text-gray-500 mb-6">Введите новый пароль для вашего аккаунта.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Новый пароль</Label>
                  <Input
                    id="password" name="password" type="password"
                    placeholder="Минимум 6 символов" required minLength={6}
                    className="rounded-xl border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm" className="text-sm font-semibold text-gray-700">Повторите пароль</Label>
                  <Input
                    id="confirm" name="confirm" type="password"
                    placeholder="Повторите пароль" required minLength={6}
                    className="rounded-xl border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
                )}
                <Button type="submit" disabled={loading} className="w-full rounded-xl h-11 font-bold text-base"
                  style={{ background: 'linear-gradient(90deg,#047857,#059669)' }}>
                  {loading ? 'Сохраняем…' : 'Сохранить пароль'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
