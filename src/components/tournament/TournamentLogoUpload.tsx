'use client'

import { useRef } from 'react'
import { uploadTournamentLogo, removeTournamentLogo } from '@/app/actions/logos'
import { Camera, X } from 'lucide-react'
import { toast } from 'sonner'
import TeamAvatar from './TeamAvatar'
import { tx, type Lang } from '@/lib/i18n'

interface Props {
  tournamentId: string
  tournamentName: string
  logoUrl: string | null
  size?: number
  lang?: Lang
}

export default function TournamentLogoUpload({ tournamentId, tournamentName, logoUrl, size = 64, lang = 'ru' }: Props) {
  const T = tx[lang]
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error(T.needImage); return }
    const dataUrl = await resizeToWebP(file, 200)
    const res = await uploadTournamentLogo(tournamentId, dataUrl)
    if (res?.error) toast.error(res.error)
    else toast.success(T.logoUpdated)
  }

  async function handleRemove(e: React.MouseEvent) {
    e.stopPropagation()
    await removeTournamentLogo(tournamentId)
    toast.success(T.logoRemoved)
  }

  return (
    <div className="relative inline-block flex-shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="block rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-emerald-400 transition-colors"
        title={T.uploadTournamentLogoTitle}
      >
        <TeamAvatar name={tournamentName} logoUrl={logoUrl} size={size} />
      </button>

      {/* Camera badge */}
      <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center shadow pointer-events-none">
        <Camera size={12} className="text-white" />
      </span>

      {/* Remove button */}
      {logoUrl && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 shadow"
          title={T.removeLogoTitle}
        >
          <X size={10} className="text-white" />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
      />
    </div>
  )
}

function resizeToWebP(file: File, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size; canvas.height = size
      const ctx = canvas.getContext('2d')!
      const side = Math.min(img.width, img.height)
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/webp', 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}
