'use client'

import { useState } from 'react'
import { createInviteLink } from '@/app/actions/members'
import { Button } from '@/components/ui/button'
import { Share2, Copy, Check, Link2, Tv2 } from 'lucide-react'
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
    setTimeout(() => setCopiedId(null), 2000)
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

  const liveUrl = `${publicUrl}/live`

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(o => !o)}
        className="gap-1.5 text-xs"
      >
        <Share2 size={13} /> Поделиться
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-4 bottom-4 sm:absolute sm:inset-x-auto sm:right-0 sm:bottom-auto sm:top-10 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:w-72 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Поделиться</p>

            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <Link2 size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600 flex-1 truncate">{publicUrl.replace(/^https?:\/\//, '')}</span>
              <button onClick={handleNativeShare} className="text-emerald-600 hover:text-emerald-700 flex-shrink-0">
                {copiedId === 'public' ? <Check size={14} /> : <Share2 size={14} />}
              </button>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <Tv2 size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600 flex-1 truncate">Live-табло</span>
              <button onClick={() => copy(liveUrl, 'live')} className="text-emerald-600 hover:text-emerald-700 flex-shrink-0">
                {copiedId === 'live' ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>

            <div className="border-t pt-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Пригласить</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => handleInvite('editor')}
                  disabled={creating === 'editor'}
                  className="text-xs"
                >
                  {creating === 'editor' ? '…' : copiedId === 'invite-editor' ? <><Check size={11} /> Скопировано</> : '✏️ Редактор'}
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => handleInvite('viewer')}
                  disabled={creating === 'viewer'}
                  className="text-xs"
                >
                  {creating === 'viewer' ? '…' : copiedId === 'invite-viewer' ? <><Check size={11} /> Скопировано</> : '👁️ Просмотр'}
                </Button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Ссылка скопируется автоматически</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
