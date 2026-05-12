'use client'

import { useState } from 'react'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { Button } from '@/components/ui/button'
import { Download, FileImage } from 'lucide-react'

interface ExportButtonsProps {
  elementId: string
  fileName: string
}

export default function ExportButtons({ elementId, fileName }: ExportButtonsProps) {
  const [loading, setLoading] = useState<'png' | 'pdf' | null>(null)

  async function getElement() {
    const el = document.getElementById(elementId)
    if (!el) throw new Error('Element not found')
    return el
  }

  async function handlePng() {
    setLoading('png')
    try {
      const el = await getElement()
      const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: 2 })
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
      const el = await getElement()
      const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: 2 })
      const img = new Image()
      img.src = dataUrl
      await new Promise(r => { img.onload = r })

      const pxW = img.width
      const pxH = img.height
      const mmW = (pxW / 2) * 0.264583   // pixelRatio=2, 1px = 0.264583mm
      const mmH = (pxH / 2) * 0.264583

      const orientation = mmW > mmH ? 'landscape' : 'portrait'
      const pdf = new jsPDF({ orientation, unit: 'mm', format: [mmW, mmH] })
      pdf.addImage(dataUrl, 'PNG', 0, 0, mmW, mmH)
      pdf.save(`${fileName}.pdf`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePng}
        disabled={loading !== null}
        className="text-xs gap-1.5"
      >
        <FileImage size={14} />
        {loading === 'png' ? 'Экспорт…' : 'PNG'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePdf}
        disabled={loading !== null}
        className="text-xs gap-1.5"
      >
        <Download size={14} />
        {loading === 'pdf' ? 'Экспорт…' : 'PDF'}
      </Button>
    </div>
  )
}
