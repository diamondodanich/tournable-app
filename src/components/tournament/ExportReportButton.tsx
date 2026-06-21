'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import { Button } from '@/components/ui/button'
import { FileDown, Lock } from 'lucide-react'
import { captureNoPng } from '@/lib/exportCapture'
import UpgradePrompt from '@/components/billing/UpgradePrompt'
import { tx, type Lang } from '@/lib/i18n'

export default function ExportReportButton({ fileName, isPro = false, lang = 'ru' }: {
  fileName: string
  isPro?: boolean
  lang?: Lang
}) {
  const T = tx[lang]
  const [loading, setLoading] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  async function handleExport() {
    if (!isPro) { setShowUpgrade(true); return }

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
      pdf.save(`${fileName}.pdf`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {showUpgrade && (
        <UpgradePrompt featureName="Экспорт PDF" onClose={() => setShowUpgrade(false)} />
      )}
      <Button
        onClick={handleExport}
        disabled={loading}
        size="sm"
        className={`gap-2 ${isPro ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-500 border border-gray-200'}`}
      >
        {isPro ? <FileDown size={15} /> : <Lock size={14} />}
        {loading ? T.exportPdfLoading : isPro ? T.exportPdf : T.exportPdfPro}
      </Button>
    </>
  )
}
