'use client'

import { useRef, useState } from 'react'
import { X, ImageIcon, Trash2, Upload, LayoutTemplate } from 'lucide-react'
import { toast } from 'sonner'
import { COVER_THEMES, getThemesForSport, getCoverStyle, isCoverThemeUrl } from '@/lib/cover-themes'
import { uploadTournamentCover, removeTournamentCover, setTournamentCoverTheme } from '@/app/actions/logos'

interface Props {
  sport: string | null
  currentCoverUrl: string | null | undefined
  // Immediate save mode (SetupTab) — provide tournamentId
  tournamentId?: string
  // Draft mode (wizard) — provide onChange callback
  onChange?: (value: string | null) => void
}

export default function TournamentCoverPicker({ sport, currentCoverUrl, tournamentId, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const themes = getThemesForSport(sport)

  async function applyTheme(themeId: string) {
    if (tournamentId) {
      setSaving(true)
      const res = await setTournamentCoverTheme(tournamentId, themeId)
      setSaving(false)
      if (res?.error) { toast.error(res.error); return }
      toast.success('Тема обложки сохранена')
    } else {
      onChange?.(`theme:${themeId}`)
    }
    setOpen(false)
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Нужно изображение'); return }
    const base64 = await resizeToCoverWebP(file)
    if (tournamentId) {
      setSaving(true)
      const res = await uploadTournamentCover(tournamentId, base64)
      setSaving(false)
      if (res?.error) { toast.error(res.error); return }
      toast.success('Обложка загружена')
    } else {
      onChange?.(base64)
    }
    setOpen(false)
  }

  async function handleRemove() {
    if (tournamentId) {
      setSaving(true)
      await removeTournamentCover(tournamentId)
      setSaving(false)
      toast.success('Обложка удалена')
    } else {
      onChange?.(null)
    }
    setOpen(false)
  }

  const hasCover = !!currentCoverUrl
  const currentStyle = getCoverStyle(currentCoverUrl)
  const isCustomImg = hasCover && !isCoverThemeUrl(currentCoverUrl!)

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={saving}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 text-sm text-gray-500 hover:text-emerald-700 transition-all disabled:opacity-50"
      >
        {hasCover ? (
          <>
            <div className="w-6 h-4 rounded flex-shrink-0 overflow-hidden">
              {currentStyle
                ? <div className="w-full h-full" style={currentStyle} />
                : isCustomImg
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={currentCoverUrl!} alt="" className="w-full h-full object-cover" />
                  : null}
            </div>
            <span className="font-medium">Изменить обложку</span>
          </>
        ) : (
          <>
            <LayoutTemplate size={15} />
            <span className="font-medium">Добавить обложку</span>
          </>
        )}
      </button>

      {/* Bottom-sheet overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 pb-8 max-h-[88vh] overflow-y-auto">
            {/* Drag handle */}
            <div className="sm:hidden flex justify-center -mt-1 mb-4">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-black text-gray-900 text-base">Обложка турнира</p>
                <p className="text-xs text-gray-400 mt-0.5">Выберите тему или загрузите своё изображение</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 text-sm text-gray-600 hover:text-emerald-700 font-medium transition-all"
              >
                <Upload size={14} /> Загрузить фото
              </button>
              {hasCover && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 hover:bg-red-50 text-sm text-red-500 hover:text-red-700 font-medium transition-all"
                >
                  <Trash2 size={14} /> Удалить обложку
                </button>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
            />

            {/* Theme grid */}
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Темы</p>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(theme => {
                const isActive = currentCoverUrl === `theme:${theme.id}`
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => applyTheme(theme.id)}
                    className={`rounded-xl overflow-hidden text-left transition-all border-2 ${
                      isActive ? 'border-white shadow-lg ring-2 ring-emerald-500' : 'border-transparent hover:border-white/60'
                    }`}
                  >
                    {/* Preview — 3:1 banner */}
                    <div
                      className="w-full"
                      style={{ height: 52, background: theme.gradient }}
                    />
                    <div className="px-2 py-1.5 bg-gray-50">
                      <p className="text-[11px] font-semibold text-gray-700 truncate">{theme.label}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Resize & center-crop to 1440×480 banner format
function resizeToCoverWebP(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const TW = 1440, TH = 480
      const scale = Math.max(TW / img.width, TH / img.height)
      const sw = TW / scale, sh = TH / scale
      const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2
      const canvas = document.createElement('canvas')
      canvas.width = TW; canvas.height = TH
      canvas.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, TW, TH)
      resolve(canvas.toDataURL('image/webp', 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}
