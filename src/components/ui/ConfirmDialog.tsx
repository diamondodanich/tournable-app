'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, AlertTriangle } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Reusable in-app confirmation dialog. Replaces native window.confirm() so
// destructive/irreversible actions get a branded, translated prompt.
// Native dialogs are still fine for critical browser events (e.g. beforeunload).
// ─────────────────────────────────────────────────────────────────────────────
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  loading = false,
  tone = 'danger',
}: {
  open: boolean
  title: string
  description?: React.ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  tone?: 'danger' | 'default'
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !loading) onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, loading, onCancel])

  if (!open || !mounted) return null
  const danger = tone === 'danger'

  const node = (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center">
      <style>{`@keyframes cd-up{0%{transform:translateY(100%)}100%{transform:translateY(0)}}@keyframes cd-fade{0%{opacity:0}100%{opacity:1}}`}</style>
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        style={{ animation: 'cd-fade .2s ease-out' }}
        onClick={() => { if (!loading) onCancel() }}
      />
      <div
        className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border-t border-gray-100 p-6 pb-8 sm:pb-6"
        style={{ animation: 'cd-up .28s cubic-bezier(.2,.8,.2,1)' }}
      >
        <div className="sm:hidden flex justify-center -mt-2 mb-4"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${danger ? 'bg-red-50' : 'bg-emerald-50'}`}>
          <AlertTriangle className={`w-6 h-6 ${danger ? 'text-red-500' : 'text-emerald-500'}`} />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-1">{title}</h3>
        {description && <div className="text-sm text-gray-500 leading-relaxed mb-5">{description}</div>}
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 h-11 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
