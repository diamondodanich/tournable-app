'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import { captureNoPng } from '@/lib/exportCapture'
import { toast } from 'sonner'
import { tx, type Lang } from '@/lib/i18n'

export default function ExportReportButton({ fileName, isPro = false, lang = 'ru' }: {
  fileName: string
  isPro?: boolean
  lang?: Lang
}) {
  const T = tx[lang]
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    const el = document.getElementById('full-report-export') as HTMLElement | null
    if (!el) return
    setLoading(true)
    try {
      const prev = el.style.cssText
      el.style.cssText = 'position:fixed;left:0;top:0;width:900px;background:white;padding:32px;z-index:-1;font-family:system-ui,-apple-system,sans-serif;'
      await new Promise<void>(r => requestAnimationFrame(() => { requestAnimationFrame(() => r()) }))
      const dataUrl = await captureNoPng(el)
      el.style.cssText = prev

      const img = new Image()
      img.src = dataUrl
      await new Promise<void>(r => { img.onload = () => r() })

      const mmW = (img.width / 2) * 0.264583
      const mmH = (img.height / 2) * 0.264583
      if (mmW <= 0 || mmH <= 0) return

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [mmW, mmH] })
      pdf.addImage(dataUrl, 'PNG', 0, 0, mmW, mmH)

      if (!isPro) {
        pdf.setFontSize(9)
        pdf.setTextColor(180, 180, 180)
        pdf.setFont('helvetica', 'italic')
        pdf.text('tournable.app', mmW - 3, mmH - 3, { align: 'right' })
      }

      pdf.save(`${fileName}.pdf`)

      if (!isPro) {
        toast.info('PDF скачан', {
          description: 'Убрать водяной знак — подключите Pro',
          action: { label: 'Pro', onClick: () => { window.location.href = '/pricing' } },
          duration: 6000,
        })
      }
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
      {loading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={15} />}
      {loading ? T.exportPdfLoading : T.exportPdf}
    </Button>
  )
}
