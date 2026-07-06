'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteAccount } from '@/app/actions/auth'
import { Trash2, X, Loader2, AlertTriangle } from 'lucide-react'

type Lang = 'ru' | 'kz' | 'en'

const CONFIRM_WORDS: Record<Lang, string> = { ru: 'УДАЛИТЬ', kz: 'ЖОЮ', en: 'DELETE' }

const T = {
  ru: {
    deleteAccount: 'Удалить аккаунт',
    confirmTitle: 'Удалить аккаунт навсегда?',
    confirmDesc: (email: string) => (
      <>Это действие необратимо. Будут безвозвратно удалены аккаунт{' '}
        <span className="font-semibold text-gray-700 break-all">{email}</span>,
        все турниры, команды, расписания и статистика. Восстановить данные будет невозможно.</>
    ),
    notConfiguredMsg: 'Автоматическое удаление пока не настроено на сервере. Отправьте запрос — мы удалим аккаунт вручную в течение 24 часов.',
    sendDeleteRequest: 'Отправить запрос на удаление',
    enterToConfirm: 'Введите',
    toConfirm: ', чтобы подтвердить',
    cancel: 'Отмена',
    deleting: 'Удаляем…',
    deleteForever: 'Удалить навсегда',
    mailSubject: 'Запрос на удаление аккаунта',
    mailBody: (email: string) => `Прошу удалить мой аккаунт.\n\nEmail: ${email}`,
  },
  kz: {
    deleteAccount: 'Аккаунтты жою',
    confirmTitle: 'Аккаунтты біржола жою керек пе?',
    confirmDesc: (email: string) => (
      <>Бұл әрекетті кері қайтару мүмкін емес. Аккаунт{' '}
        <span className="font-semibold text-gray-700 break-all">{email}</span>,
        барлық турнирлер, командалар, кестелер мен статистика біржола жойылады. Деректерді қалпына келтіру мүмкін болмайды.</>
    ),
    notConfiguredMsg: 'Автоматты жою серверде әлі бапталмаған. Сұрау жіберіңіз — аккаунтты 24 сағат ішінде қолмен жоямыз.',
    sendDeleteRequest: 'Жою сұрауын жіберу',
    enterToConfirm: 'Растау үшін',
    toConfirm: ' деп жазыңыз',
    cancel: 'Бас тарту',
    deleting: 'Жойылуда…',
    deleteForever: 'Біржола жою',
    mailSubject: 'Аккаунтты жоюға сұрау',
    mailBody: (email: string) => `Аккаунтымды жоюды сұраймын.\n\nEmail: ${email}`,
  },
  en: {
    deleteAccount: 'Delete account',
    confirmTitle: 'Delete account permanently?',
    confirmDesc: (email: string) => (
      <>This action is irreversible. The account{' '}
        <span className="font-semibold text-gray-700 break-all">{email}</span>,
        all tournaments, teams, schedules and stats will be permanently deleted. Data recovery will not be possible.</>
    ),
    notConfiguredMsg: 'Automatic deletion is not yet configured on the server. Send a request — we will delete the account manually within 24 hours.',
    sendDeleteRequest: 'Send deletion request',
    enterToConfirm: 'Type',
    toConfirm: ' to confirm',
    cancel: 'Cancel',
    deleting: 'Deleting…',
    deleteForever: 'Delete forever',
    mailSubject: 'Account deletion request',
    mailBody: (email: string) => `Please delete my account.\n\nEmail: ${email}`,
  },
} as const

export default function DeleteAccountButton({ email, lang = 'ru' }: { email: string; lang?: Lang }) {
  const tx = T[lang]
  const CONFIRM_WORD = CONFIRM_WORDS[lang]
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

  // Case-insensitive: mobile keyboards often refuse to force uppercase even with
  // the CSS `uppercase` transform, which left the button permanently disabled.
  const ready = value.trim().toLocaleUpperCase() === CONFIRM_WORD.toLocaleUpperCase()

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
        <h3 className="text-lg font-black text-gray-900 mb-1">{tx.confirmTitle}</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-5">
          {tx.confirmDesc(email)}
        </p>

        {notConfigured ? (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
              {tx.notConfiguredMsg}
            </div>
            <a
              href={`mailto:info@tournable.app?subject=${encodeURIComponent(tx.mailSubject)}&body=${encodeURIComponent(tx.mailBody(email))}`}
              className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
            >
              <Trash2 size={15} /> {tx.sendDeleteRequest}
            </a>
          </div>
        ) : (
          <>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {tx.enterToConfirm} <span className="font-black text-red-600">{CONFIRM_WORD}</span>{tx.toConfirm}
            </label>
            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
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
                {tx.cancel}
              </button>
              <button
                onClick={handleDelete}
                disabled={!ready || loading}
                className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:hover:bg-red-500 inline-flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {loading ? tx.deleting : tx.deleteForever}
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
        className="inline-flex items-center gap-2 text-red-400 hover:text-red-600 font-semibold text-sm transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        {tx.deleteAccount}
      </button>
      {modal}
    </>
  )
}
