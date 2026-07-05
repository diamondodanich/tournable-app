'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import { captureNoPng } from '@/lib/exportCapture'
import { saveImageAsPdf } from '@/lib/reportPdf'
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

      saveImageAsPdf(dataUrl, img.width, img.height, isPro, fileName)

      if (!isPro) {
        toast.info(T.pdfDownloaded, {
          description: T.removeWatermarkCta,
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
