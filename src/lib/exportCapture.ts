import { toPng } from 'html-to-image'

/**
 * Capture an element as PNG with no scrollbars and full content width.
 *
 * html-to-image renders via SVG foreignObject — browser scrollbars are visible
 * inside it (especially on Windows). We:
 * 1. Measure the full scrollable content size of every overflow:auto/scroll descendant
 * 2. Temporarily set them to overflow:visible so no scrollbar widget renders
 * 3. Capture at the maximum measured content width/height
 * 4. Restore original styles
 */
export async function captureNoPng(el: HTMLElement): Promise<string> {
  type Saved = {
    el: HTMLElement
    overflow: string
    overflowX: string
    overflowY: string
    scrollW: number
    scrollH: number
  }
  const saved: Saved[] = []

  el.querySelectorAll<HTMLElement>('*').forEach(child => {
    const cs = window.getComputedStyle(child)
    const scrollable =
      cs.overflow === 'auto' || cs.overflow === 'scroll' ||
      cs.overflowX === 'auto' || cs.overflowX === 'scroll' ||
      cs.overflowY === 'auto' || cs.overflowY === 'scroll'
    if (scrollable) {
      saved.push({
        el: child,
        overflow: child.style.overflow,
        overflowX: child.style.overflowX,
        overflowY: child.style.overflowY,
        scrollW: child.scrollWidth,
        scrollH: child.scrollHeight,
      })
    }
  })

  // Widest content dimension across all scrollable children + the root
  const captureW = Math.max(el.scrollWidth, ...saved.map(s => s.scrollW))
  const captureH = Math.max(el.scrollHeight, ...saved.map(s => s.scrollH))

  // Strip overflow so no scrollbar renders in the SVG foreignObject
  saved.forEach(s => {
    s.el.style.overflow = 'visible'
    s.el.style.overflowX = 'visible'
    s.el.style.overflowY = 'visible'
  })

  let dataUrl: string
  try {
    dataUrl = await toPng(el, {
      cacheBust: true,
      pixelRatio: 2,
      width: captureW,
      height: captureH,
    })
  } finally {
    // Always restore, even if toPng throws
    saved.forEach(s => {
      s.el.style.overflow = s.overflow
      s.el.style.overflowX = s.overflowX
      s.el.style.overflowY = s.overflowY
    })
  }

  return dataUrl
}
