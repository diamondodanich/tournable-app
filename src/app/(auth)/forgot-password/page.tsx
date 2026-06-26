'use client'

import { useState } from 'react'
import { requestPasswordReset } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await requestPasswordReset(new FormData(e.currentTarget))
    setLoading(false)
    if (result && 'error' in result && result.error) {
      setError(result.error)
    } else {
      setSent(true)
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
              <div className="text-xs text-gray-400">Сброс пароля</div>
            </div>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
              <div>
                <p className="font-black text-gray-900 text-lg mb-1">Письмо отправлено</p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Проверьте почту и перейдите по ссылке в письме, чтобы задать новый пароль.
                  Ссылка действительна 1 час.
                </p>
              </div>
              <Link href="/login" className="inline-flex items-center gap-2 text-sm text-emerald-600 font-semibold hover:underline">
                <ArrowLeft size={14} /> Вернуться ко входу
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-black text-gray-900 mb-2">Забыли пароль?</h1>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Введите email вашего аккаунта — мы отправим ссылку для сброса пароля.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
                  <Input
                    id="email" name="email" type="email"
                    placeholder="Введите ваш email" required
                    className="rounded-xl border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
                )}
                <Button type="submit" disabled={loading} className="w-full rounded-xl h-11 font-bold text-base"
                  style={{ background: 'linear-gradient(90deg,#047857,#059669)' }}>
                  {loading ? 'Отправляем…' : 'Отправить ссылку'}
                </Button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-6">
                <Link href="/login" className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-1">
                  <ArrowLeft size={13} /> Вернуться ко входу
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
