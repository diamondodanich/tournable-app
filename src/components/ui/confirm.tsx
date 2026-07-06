'use client'

import { useSyncExternalStore } from 'react'
import ConfirmDialog from './ConfirmDialog'

// ─────────────────────────────────────────────────────────────────────────────
// Imperative, promise-based confirmation. Lets call sites keep the ergonomic
// `if (!(await confirmDialog({...}))) return` shape while rendering our own
// branded dialog instead of the native window.confirm().
//
// Mount <ConfirmHost /> once (dashboard layout). Anywhere else:
//   if (!(await confirmDialog({ title, lang, tone: 'danger' }))) return
// ─────────────────────────────────────────────────────────────────────────────

type Lang = 'ru' | 'kz' | 'en'

const DEFAULT_LABELS: Record<Lang, { yes: string; no: string }> = {
  ru: { yes: 'Подтвердить', no: 'Отмена' },
  kz: { yes: 'Растау', no: 'Бас тарту' },
  en: { yes: 'Confirm', no: 'Cancel' },
}

type ConfirmRequest = {
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  lang?: Lang
}

type ActiveRequest = ConfirmRequest & { resolve: (v: boolean) => void }

let current: ActiveRequest | null = null
const listeners = new Set<() => void>()

function emit() { listeners.forEach(l => l()) }
function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } }
function getSnapshot() { return current }
function getServerSnapshot(): ActiveRequest | null { return null }

export function confirmDialog(req: ConfirmRequest): Promise<boolean> {
  // If a dialog is already open, resolve it as cancelled before opening a new one.
  if (current) current.resolve(false)
  return new Promise<boolean>(resolve => {
    current = { ...req, resolve }
    emit()
  })
}

export function ConfirmHost() {
  const active = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  function settle(value: boolean) {
    const req = current
    current = null
    emit()
    req?.resolve(value)
  }

  const lang: Lang = active?.lang ?? 'ru'
  const labels = DEFAULT_LABELS[lang]

  return (
    <ConfirmDialog
      open={!!active}
      title={active?.title ?? ''}
      description={active?.description}
      confirmLabel={active?.confirmLabel ?? labels.yes}
      cancelLabel={active?.cancelLabel ?? labels.no}
      tone={active?.tone ?? 'danger'}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  )
}
