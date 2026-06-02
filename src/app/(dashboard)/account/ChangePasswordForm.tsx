'use client'

import { useState } from 'react'
import { changePassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyRound, Check, X } from 'lucide-react'

export default function ChangePasswordForm() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (password.length < 6) { setError('Пароль должен быть не менее 6 символов'); setLoading(false); return }
    if (password !== confirm) { setError('Пароли не совпадают'); setLoading(false); return }

    const result = await changePassword(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    form.reset()
    setLoading(false)
    setDone(true)
    setOpen(false)
  }

  if (!open) {
    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-700">Пароль</div>
          <div className="text-xs text-gray-400">
            {done ? 'Пароль успешно изменён' : '••••••••••••'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setOpen(true); setDone(false) }}
          className="shrink-0 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <KeyRound className="w-3.5 h-3.5" />
          Сменить
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-xl space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="new-password" className="text-sm font-semibold text-gray-700">Новый пароль</Label>
        <Input
          id="new-password" name="password" type="password" autoComplete="new-password"
          placeholder="Минимум 6 символов" required
          className="bg-white rounded-xl border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password" className="text-sm font-semibold text-gray-700">Повторите пароль</Label>
        <Input
          id="confirm-password" name="confirm" type="password" autoComplete="new-password"
          placeholder="Ещё раз новый пароль" required
          className="bg-white rounded-xl border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="submit" disabled={loading}
          className="rounded-xl h-10 font-bold text-sm px-5"
          style={{ background: 'linear-gradient(90deg,#047857,#059669)' }}
        >
          <Check className="w-4 h-4 mr-1.5" />
          {loading ? 'Сохраняем…' : 'Сохранить пароль'}
        </Button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null) }}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
          Отмена
        </button>
      </div>
    </form>
  )
}
