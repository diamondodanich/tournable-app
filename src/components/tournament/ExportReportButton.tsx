'use client'

import { useState } from 'react'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'

export default function ExportReportButton({ fileName }: { fileName: string }) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    const el = document.getElementById('full-report-export')
    if (!el) return
    setLoading(true)
    try {
      // html-to-image cannot capture off-screen elements (getBoundingClientRect returns 0 height).
      // Temporarily position the element on-screen but behind page content.
      const prev = el.style.cssText
      el.style.cssText = [
        'position:fixed',
        'left:0',
        'top:0',
        'width:900px',
        'background:white',
        'padding:32px',
        'z-index:-1',
        'font-family:system-ui,-apple-system,sans-serif',
      ].join(';')

      // Two animation frames so the browser repaints before we capture
      await new Promise<void>(r => requestAnimationFrame(() => { requestAnimationFrame(() => r()) }))

      const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: 2 })

      // Restore original hidden position
      el.style.cssText = prev

      const img = new Image()
      img.src = dataUrl
      await new Promise<void>(r => { img.onload = () => r() })

      const pxW = img.width
      const pxH = img.height
      const mmW = (pxW / 2) * 0.264583
      const mmH = (pxH / 2) * 0.264583

      if (mmW <= 0 || mmH <= 0) {
        console.error('Export failed: element has zero dimensions')
        return
      }

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [mmW, mmH] })
      pdf.addImage(dataUrl, 'PNG', 0, 0, mmW, mmH)
      pdf.save(`${fileName}.pdf`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={loading}
      size="sm"
      className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
    >
      <FileDown size={15} />
      {loading ? 'Формируем PDF…' : 'Скачать полный отчёт PDF'}
    </Button>
  )
}
