'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteAccount } from '@/app/actions/auth'
import { Trash2, X, Loader2, AlertTriangle } from 'lucide-react'

const CONFIRM_WORD = 'УДАЛИТЬ'

export default function DeleteAccountButton({ email }: { email: string }) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [value, setValue]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [notConfigured, setNotConfigured] = useState(false)

  function close() {
    if (loading) return
    setOpen(false); setValue(''); setError(null); setNotConfigured(false)
  }

  async function handleDelete() {
    setLoading(true); setError(null)
    const res = await deleteAccount(value.trim())
    if (res?.error) {
      setLoading(false)
      if (res.error === 'NOT_CONFIGURED') { setNotConfigured(true); return }
      setError(res.error)
      return
    }
    router.push('/login?deleted=1')
  }

  const ready = value.trim() === CONFIRM_WORD

  const modal = open && (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <style>{`@keyframes da-up{0%{transform:translateY(100%)}100%{transform:translateY(0)}}@keyframes da-fade{0%{opacity:0}100%{opacity:1}}`}</style>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" style={{ animation: 'da-fade .2s ease-out' }} onClick={close} />
      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border-t border-gray-100 p-6 pb-8 max-h-[88vh] overflow-y-auto"
        style={{ animation: 'da-up .28s cubic-bezier(.2,.8,.2,1)' }}
      >
        <div className="sm:hidden flex justify-center -mt-2 mb-4"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>

        <button onClick={close}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
          <X size={15} />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-1">Удалить аккаунт навсегда?</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-5">
          Это действие необратимо. Будут безвозвратно удалены аккаунт <span className="font-semibold text-gray-700 break-all">{email}</span>,
          все турниры, команды, расписания и статистика. Восстановить данные будет невозможно.
        </p>

        {notConfigured ? (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
              Автоматическое удаление пока не настроено на сервере. Отправьте запрос — мы удалим аккаунт вручную в течение 24 часов.
            </div>
            <a
              href={`mailto:tournable.webapp@gmail.com?subject=${encodeURIComponent('Запрос на удаление аккаунта')}&body=${encodeURIComponent(`Прошу удалить мой аккаунт.\n\nEmail: ${email}`)}`}
              className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
            >
              <Trash2 size={15} /> Отправить запрос на удаление
            </a>
          </div>
        ) : (
          <>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Введите <span className="font-black text-red-600">{CONFIRM_WORD}</span>, чтобы подтвердить
            </label>
            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder={CONFIRM_WORD}
              className="w-full h-11 rounded-xl border border-gray-200 px-3.5 text-sm font-bold tracking-wide uppercase focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all mb-3"
            />

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-3">
                {error}
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                onClick={close}
                disabled={loading}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={!ready || loading}
                className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:hover:bg-red-500 inline-flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {loading ? 'Удаляем…' : 'Удалить навсегда'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 font-bold px-5 py-3 rounded-xl transition-colors text-sm border border-red-100"
      >
        <Trash2 className="w-4 h-4" />
        Удалить аккаунт
      </button>
      {modal}
    </>
  )
}
