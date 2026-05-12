'use client'

import { useRef } from 'react'
import { uploadTeamLogo, removeTeamLogo } from '@/app/actions/logos'
import { Camera, X } from 'lucide-react'
import { toast } from 'sonner'
import TeamAvatar from './TeamAvatar'

interface Props {
  teamId: string
  teamName: string
  tournamentId: string
  logoUrl: string | null
}

export default function TeamLogoUpload({ teamId, teamName, tournamentId, logoUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Нужно изображение'); return }

    const dataUrl = await resizeToWebP(file, 200)
    const res = await uploadTeamLogo(teamId, tournamentId, dataUrl)
    if (res?.error) toast.error(res.error)
    else toast.success('Логотип обновлён')
  }

  async function handleRemove() {
    await removeTeamLogo(teamId, tournamentId)
    toast.success('Логотип удалён')
  }

  return (
    <div className="relative inline-block">
      <TeamAvatar name={teamName} logoUrl={logoUrl} size={36} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 shadow-sm"
        title="Загрузить логотип"
      >
        <Camera size={9} className="text-gray-500" />
      </button>
      {logoUrl && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
          title="Удалить логотип"
        >
          <X size={9} className="text-white" />
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
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      const side = Math.min(img.width, img.height)
      const sx = (img.width - side) / 2
      const sy = (img.height - side) / 2
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/webp', 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}
