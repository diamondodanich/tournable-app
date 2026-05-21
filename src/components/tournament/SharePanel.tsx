'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createInviteLink, removeMember } from '@/app/actions/members'
import { TournamentMember } from '@/types'
import {
  Share2, Copy, Check, Link2, X,
  Eye, Pencil, ChevronLeft, Clock, UserX,
} from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  tournamentId: string
  tournamentName: string
  publicUrl: string
  members: TournamentMember[]
}

type Mode = null | 'view' | 'edit'

// ─────────────────────────────────────────────────────────────
export default function SharePanel({ tournamentId, tournamentName, publicUrl, members: initial }: Props) {
  const [open, setOpen]           = useState(false)
  const [mode, setMode]           = useState<Mode>(null)
  const [copiedId, setCopiedId]   = useState<string | null>(null)
  const [creating, setCreating]   = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [members, setMembers]     = useState(initial)
  const [mounted, setMounted]     = useState(false)
  const [dropPos, setDropPos]     = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => setMounted(true), [])

  // Lock body scroll while open on mobile
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else       document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function handleOpen() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
    }
    setMode(null)
    setInviteUrl(null)
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
    setMode(null)
    setInviteUrl(null)
  }

  async function copy(text: string, id: string) {
    try { await navigator.clipboard.writeText(text) } catch { return }
    setCopiedId(id)
    toast.success('Скопировано!')
    setTimeout(() => setCopiedId(null), 2500)
  }

  async function handleShare(url: string) {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: tournamentName, url }) } catch {}
    } else {
      await copy(url, 'share-fallback')
    }
  }

  async function selectEditMode() {
    setMode('edit')
    setCreating(true)
    const res = await createInviteLink(tournamentId, 'editor')
    if (res?.error) { toast.error(res.error); setCreating(false); return }
    if ('token' in res) {
      setInviteUrl(`${window.location.origin}/invite/${res.token}`)
    }
    setCreating(false)
  }

  async function handleRemove(memberId: string) {
    setMembers(prev => prev.filter(m => m.id !== memberId))
    await removeMember(memberId, tournamentId)
    toast.success('Доступ отозван')
  }

  const displayUrl      = publicUrl.replace(/^https?:\/\//, '')
  const acceptedEditors = members.filter(m => m.role === 'editor' && m.status === 'accepted')
  const acceptedViewers = members.filter(m => m.role === 'viewer' && m.status === 'accepted')
  const pendingCount    = members.filter(m => m.status === 'pending').length

  // ── Content renderer ──────────────────────────────────────────
  function renderContent() {
    return (
      <div className="p-5 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-2">
          {mode !== null && (
            <button
              onClick={() => { setMode(null); setInviteUrl(null) }}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
            >
              <ChevronLeft size={14} className="text-gray-600" />
            </button>
          )}
          <p className="text-sm font-black text-gray-900 flex-1">
            {mode === null   ? 'Поделиться'     :
             mode === 'view' ? 'Ссылка для просмотра' :
                               'Ссылка для редактора'}
          </p>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
            aria-label="Закрыть"
          >
            <X size={13} className="text-gray-500" />
          </button>
        </div>

        {/* ── Mode picker ──────────────────────────────────────── */}
        {mode === null && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              {/* View */}
              <button
                onClick={() => setMode('view')}
                className="flex flex-col gap-2 p-4 rounded-2xl border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/60 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                  <Eye size={16} className="text-gray-500 group-hover:text-emerald-700 transition-colors" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-800">Просмотр</p>
                  <p className="text-[10px] text-gray-400 leading-tight mt-0.5">Только чтение, без регистрации</p>
                </div>
              </button>

              {/* Edit */}
              <button
                onClick={selectEditMode}
                className="flex flex-col gap-2 p-4 rounded-2xl border-2 border-gray-200 hover:border-violet-400 hover:bg-violet-50/60 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-violet-100 flex items-center justify-center transition-colors">
                  <Pencil size={16} className="text-gray-500 group-hover:text-violet-700 transition-colors" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-800">Редактирование</p>
                  <p className="text-[10px] text-gray-400 leading-tight mt-0.5">Ввод результатов, нужна регистрация</p>
                </div>
              </button>
            </div>

            {/* Members section */}
            {members.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Доступ</p>

                {/* Accepted editors */}
                {acceptedEditors.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wide">
                      Редакторы · {acceptedEditors.length}
                    </p>
                    {acceptedEditors.map(m => (
                      <MemberRow key={m.id} member={m} onRemove={handleRemove} />
                    ))}
                  </div>
                )}

                {/* Accepted viewers */}
                {acceptedViewers.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                      Зрители · {acceptedViewers.length}
                    </p>
                    {acceptedViewers.map(m => (
                      <MemberRow key={m.id} member={m} onRemove={handleRemove} />
                    ))}
                  </div>
                )}

                {/* Pending invites */}
                {pendingCount > 0 && (
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
                    <Clock size={11} className="shrink-0" />
                    {pendingCount} {pendingCount === 1 ? 'ссылка ожидает' : pendingCount < 5 ? 'ссылки ожидают' : 'ссылок ожидают'} подтверждения
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── View mode ────────────────────────────────────────── */}
        {mode === 'view' && (
          <div className="space-y-3">
            {/* URL display */}
            <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
              <Link2 size={13} className="text-gray-400 shrink-0" />
              <span className="text-xs text-gray-600 flex-1 truncate font-mono min-w-0">{displayUrl}</span>
            </div>

            {/* Action buttons */}
            <button
              onClick={() => copy(publicUrl, 'view-copy')}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors"
            >
              {copiedId === 'view-copy'
                ? <><Check size={15} /> Скопировано</>
                : <><Copy size={15} /> Скопировать ссылку</>
              }
            </button>
            <button
              onClick={() => handleShare(publicUrl)}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors"
            >
              <Share2 size={15} /> Поделиться
            </button>

            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              Не требует регистрации · Только просмотр
            </p>
          </div>
        )}

        {/* ── Edit mode ────────────────────────────────────────── */}
        {mode === 'edit' && (
          <div className="space-y-3">
            {creating ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-violet-600 rounded-full animate-spin" />
                Генерируем ссылку…
              </div>
            ) : inviteUrl ? (
              <>
                {/* Invite URL display */}
                <div className="flex items-center gap-2.5 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5">
                  <Link2 size={13} className="text-violet-400 shrink-0" />
                  <span className="text-xs text-violet-700 flex-1 truncate font-mono min-w-0">
                    {inviteUrl.replace(/^https?:\/\//, '')}
                  </span>
                </div>

                {/* Action buttons */}
                <button
                  onClick={() => copy(inviteUrl, 'edit-copy')}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors"
                >
                  {copiedId === 'edit-copy'
                    ? <><Check size={15} /> Скопировано</>
                    : <><Copy size={15} /> Скопировать ссылку</>
                  }
                </button>
                <button
                  onClick={() => handleShare(inviteUrl)}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors"
                >
                  <Share2 size={15} /> Поделиться
                </button>

                <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                  Одноразовая ссылка · Нужна регистрация
                </p>

                {/* Generate another */}
                <button
                  onClick={selectEditMode}
                  className="w-full text-center text-[11px] text-violet-600 hover:text-violet-700 font-semibold py-1 transition-colors"
                >
                  + Создать ещё одну ссылку
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>
    )
  }

  // ── Portal panel ──────────────────────────────────────────────
  const portalContent = open && (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/40 sm:bg-black/10 backdrop-blur-[1px] sm:backdrop-blur-none"
        onClick={handleClose}
      />

      {/* Mobile: bottom sheet */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-[9999]">
        <div
          className="bg-white rounded-t-3xl shadow-2xl border-t border-gray-200/80 flex flex-col"
          style={{ maxHeight: 'calc(100dvh - 60px - env(safe-area-inset-top))' }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-0 shrink-0">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
          {/* Scrollable content */}
          <div
            className="overflow-y-auto flex-1"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
          >
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Desktop: positioned dropdown */}
      <div
        className="hidden sm:block fixed z-[9999] w-80"
        style={{ top: dropPos.top, right: dropPos.right }}
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
             style={{ maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
          {renderContent()}
        </div>
      </div>
    </>
  )

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all shadow-sm"
      >
        <Share2 size={13} /> Поделиться
      </button>

      {mounted && createPortal(portalContent, document.body)}
    </>
  )
}

// ── Member row sub-component ──────────────────────────────────
function MemberRow({ member, onRemove }: {
  member: TournamentMember
  onRemove: (id: string) => void
}) {
  const initials = member.user_id
    ? member.user_id.slice(0, 2).toUpperCase()
    : '?'

  const joinedAt = new Date(member.created_at).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short',
  })

  return (
    <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-black text-gray-600 shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-700 truncate">Участник</p>
        <p className="text-[10px] text-gray-400">с {joinedAt}</p>
      </div>
      <button
        onClick={() => onRemove(member.id)}
        className="w-6 h-6 rounded-full hover:bg-red-100 flex items-center justify-center transition-colors group shrink-0"
        title="Отозвать доступ"
      >
        <UserX size={12} className="text-gray-400 group-hover:text-red-500 transition-colors" />
      </button>
    </div>
  )
}
