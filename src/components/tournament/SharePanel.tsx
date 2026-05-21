'use client'

import { useState } from 'react'
import { createInviteLink } from '@/app/actions/members'
import { Share2, Copy, Check, Link2, X, Eye, Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  tournamentId: string
  tournamentName: string
  publicUrl: string
}

export default function SharePanel({ tournamentId, tournamentName, publicUrl }: Props) {
  const [open, setOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [creating, setCreating] = useState<string | null>(null)

  async function copy(text: string, id: string) {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Скопировано!')
    setTimeout(() => setCopiedId(null), 2500)
  }

  async function handleNativeShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: tournamentName, url: publicUrl }) } catch {}
    } else {
      await copy(publicUrl, 'public')
    }
  }

  async function handleInvite(role: 'editor' | 'viewer') {
    setCreating(role)
    const res = await createInviteLink(tournamentId, role)
    if (res?.error) { toast.error(res.error); setCreating(null); return }
    if ('token' in res) {
      const link = `${window.location.origin}/invite/${res.token}`
      await copy(link, `invite-${role}`)
    }
    setCreating(null)
  }

  const displayUrl = publicUrl.replace(/^https?:\/\//, '')

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all shadow-sm"
      >
        <Share2 size={13} /> Поделиться
      </button>

      {open && (
        <>
          {/* Backdrop: dimmed overlay on mobile, invisible click-catcher on desktop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 sm:bg-transparent"
            onClick={() => setOpen(false)}
          />

          {/* Panel:
              - mobile: fixed bottom sheet spanning full width, stays above safe area
              - desktop: absolute dropdown anchored below button, right-aligned  */}
          <div className="fixed inset-x-0 bottom-0 z-50 sm:absolute sm:inset-x-auto sm:right-0 sm:bottom-auto sm:top-10 sm:w-72">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl sm:shadow-xl border-t border-x sm:border border-gray-200/80">

              {/* Drag handle — mobile only */}
              <div className="flex justify-center pt-3 sm:hidden">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Content area */}
              <div
                className="p-5 sm:p-4 space-y-5 sm:space-y-4"
                style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
              >

                {/* Header row */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-gray-900">Поделиться</p>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    aria-label="Закрыть"
                  >
                    <X size={13} className="text-gray-500" />
                  </button>
                </div>

                {/* Public page link */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Публичная страница</p>
                  <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                    <Link2 size={13} className="text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-600 flex-1 truncate min-w-0 font-mono">{displayUrl}</span>
                    <button
                      onClick={handleNativeShare}
                      className="shrink-0 text-emerald-600 hover:text-emerald-700 transition-colors"
                      title="Поделиться или скопировать"
                    >
                      {copiedId === 'public'
                        ? <Check size={14} className="text-emerald-600" />
                        : <Share2 size={14} />
                      }
                    </button>
                  </div>
                </div>

                {/* Invite links */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Пригласить</p>
                  <div className="space-y-2">

                    {/* Editor invite */}
                    <button
                      onClick={() => handleInvite('editor')}
                      disabled={!!creating}
                      className="w-full flex items-center gap-3 bg-gray-50 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/60 rounded-xl px-3 py-2.5 transition-all disabled:opacity-50 text-left group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center shrink-0 transition-colors">
                        <Pencil size={13} className="text-emerald-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 leading-none mb-0.5">Редактор</p>
                        <p className="text-[10px] text-gray-400 leading-none">Может вводить результаты</p>
                      </div>
                      <span className="shrink-0 transition-all">
                        {creating === 'editor'
                          ? <span className="text-[10px] text-gray-400 font-medium">…</span>
                          : copiedId === 'invite-editor'
                            ? <Check size={13} className="text-emerald-600" />
                            : <Copy size={13} className="text-gray-400 group-hover:text-emerald-600" />
                        }
                      </span>
                    </button>

                    {/* Viewer invite */}
                    <button
                      onClick={() => handleInvite('viewer')}
                      disabled={!!creating}
                      className="w-full flex items-center gap-3 bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50/60 rounded-xl px-3 py-2.5 transition-all disabled:opacity-50 text-left group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center shrink-0 transition-colors">
                        <Eye size={13} className="text-blue-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 leading-none mb-0.5">Наблюдатель</p>
                        <p className="text-[10px] text-gray-400 leading-none">Только просмотр</p>
                      </div>
                      <span className="shrink-0 transition-all">
                        {creating === 'viewer'
                          ? <span className="text-[10px] text-gray-400 font-medium">…</span>
                          : copiedId === 'invite-viewer'
                            ? <Check size={13} className="text-emerald-600" />
                            : <Copy size={13} className="text-gray-400 group-hover:text-blue-600" />
                        }
                      </span>
                    </button>

                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                    Ссылка-приглашение скопируется автоматически
                  </p>
                </div>

              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
