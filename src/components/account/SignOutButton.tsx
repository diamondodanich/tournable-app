'use client'

import { useState } from 'react'
import { signOut } from '@/app/actions/auth'
import { LogOut } from 'lucide-react'

type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: {
    confirmTitle: 'Выйти из аккаунта?',
    confirmDesc: 'Вы выйдете с этого устройства. Чтобы вернуться, потребуется снова войти.',
    cancel: 'Отмена',
    signOut: 'Выйти',
    signOutFull: 'Выйти из аккаунта',
  },
  kz: {
    confirmTitle: 'Аккаунттан шығасыз ба?',
    confirmDesc: 'Осы құрылғыдан шығасыз. Қайта кіру үшін қайта тіркелу қажет болады.',
    cancel: 'Бас тарту',
    signOut: 'Шығу',
    signOutFull: 'Аккаунттан шығу',
  },
  en: {
    confirmTitle: 'Sign out of your account?',
    confirmDesc: 'You will be signed out on this device. You will need to sign in again to come back.',
    cancel: 'Cancel',
    signOut: 'Sign out',
    signOutFull: 'Sign out of account',
  },
} as const

export default function SignOutButton({
  variant = 'full',
  title,
  lang = 'ru',
}: {
  variant?: 'full' | 'icon'
  title?: string
  lang?: Lang
}) {
  const tx = T[lang]
  const [open, setOpen] = useState(false)

  const modal = open && (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <style>{`@keyframes so-up{0%{transform:translateY(100%)}100%{transform:translateY(0)}}@keyframes so-fade{0%{opacity:0}100%{opacity:1}}`}</style>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" style={{ animation: 'so-fade .2s ease-out' }} onClick={() => setOpen(false)} />
      <div
        className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border-t border-gray-100 p-6 pb-8"
        style={{ animation: 'so-up .28s cubic-bezier(.2,.8,.2,1)' }}
      >
        <div className="sm:hidden flex justify-center -mt-2 mb-4"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>

        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <LogOut className="w-6 h-6 text-gray-500" />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-1">{tx.confirmTitle}</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          {tx.confirmDesc}
        </p>

        <div className="flex gap-2.5">
          <button
            onClick={() => setOpen(false)}
            className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {tx.cancel}
          </button>
          <form action={signOut} className="flex-1">
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors inline-flex items-center justify-center gap-2"
            >
              <LogOut size={15} /> {tx.signOut}
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title={title}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <LogOut className="w-4 h-4 text-emerald-100" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-gray-50 text-gray-600 hover:text-gray-900 font-bold px-5 py-3.5 rounded-2xl transition-colors text-sm border border-gray-200 shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          {tx.signOutFull}
        </button>
      )}
      {modal}
    </>
  )
}
