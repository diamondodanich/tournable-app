import jsPDF from 'jspdf'

// Shared PDF builder for exported reports/standings.
// - Adds a uniform page margin so content never touches (or overruns) the edge.
// - On the Free tier, stamps a diagonal tiled "TOURNABLE" watermark plus a crisp
//   corner attribution. Pro/Enterprise exports are clean.
export function saveImageAsPdf(
  dataUrl: string,
  imgWpx: number,
  imgHpx: number,
  isPro: boolean,
  fileName: string,
) {
  // html-to-image captures at pixelRatio 2 → divide by 2 back to CSS px, then → mm.
  const mmW = (imgWpx / 2) * 0.264583
  const mmH = (imgHpx / 2) * 0.264583
  if (mmW <= 0 || mmH <= 0) return

  const margin = 10
  const pageW = mmW + margin * 2
  const pageH = mmH + margin * 2

  const pdf = new jsPDF({ orientation: pageW > pageH ? 'landscape' : 'portrait', unit: 'mm', format: [pageW, pageH] })
  pdf.addImage(dataUrl, 'PNG', margin, margin, mmW, mmH)

  if (!isPro) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyPdf = pdf as any
    try { anyPdf.setGState(anyPdf.GState({ opacity: 0.07 })) } catch {}
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(17, 24, 39)
    pdf.setFontSize(26)
    const stepX = 78
    const stepY = 52
    for (let y = 6; y < pageH + stepY; y += stepY) {
      for (let x = -12; x < pageW; x += stepX) {
        pdf.text('TOURNABLE', x, y, { angle: 28 })
      }
    }
    try { anyPdf.setGState(anyPdf.GState({ opacity: 1 })) } catch {}
    pdf.setFontSize(9)
    pdf.setTextColor(150, 150, 150)
    pdf.setFont('helvetica', 'italic')
    pdf.text('Создано в Tournable · tournable.app', pageW - margin, pageH - 4, { align: 'right' })
  }

  pdf.save(`${fileName}.pdf`)
}
