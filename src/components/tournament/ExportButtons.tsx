'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileImage } from 'lucide-react'
import { captureNoPng } from '@/lib/exportCapture'
import { saveImageAsPdf } from '@/lib/reportPdf'
import { tx, type Lang } from '@/lib/i18n'

interface ExportButtonsProps {
  elementId: string
  fileName: string
  lang?: Lang
  isPro?: boolean
}

export default function ExportButtons({ elementId, fileName, lang = 'ru', isPro = false }: ExportButtonsProps) {
  const T = tx[lang]
  const [loading, setLoading] = useState<'png' | 'pdf' | null>(null)

  function getEl() {
    const el = document.getElementById(elementId)
    if (!el) throw new Error(`#${elementId} not found`)
    return el as HTMLElement
  }

  async function handlePng() {
    setLoading('png')
    try {
      const dataUrl = await captureNoPng(getEl())
      const link = document.createElement('a')
      link.download = `${fileName}.png`
      link.href = dataUrl
      link.click()
    } finally {
      setLoading(null)
    }
  }

  async function handlePdf() {
    setLoading('pdf')
    try {
      const dataUrl = await captureNoPng(getEl())
      const img = new Image()
      img.src = dataUrl
      await new Promise<void>(r => { img.onload = () => r() })

      saveImageAsPdf(dataUrl, img.width, img.height, isPro, fileName)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handlePng} disabled={loading !== null} className="text-xs gap-1.5">
        <FileImage size={14} />
        {loading === 'png' ? T.exporting : 'PNG'}
      </Button>
      <Button variant="outline" size="sm" onClick={handlePdf} disabled={loading !== null} className="text-xs gap-1.5">
        <Download size={14} />
        {loading === 'pdf' ? T.exporting : 'PDF'}
      </Button>
    </div>
  )
}
