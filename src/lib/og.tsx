// ─────────────────────────────────────────────────────────────────────────────
// Shared renderer for opengraph-image routes.
//
// Satori (the engine behind ImageResponse) ships no Cyrillic glyphs, so every
// card must be handed a font that has them: assets/Geist-Regular.ttf (SIL OFL,
// see assets/Geist-OFL.txt). Only the regular weight is bundled — emphasis comes
// from size and colour, never from `fontWeight`, which Satori cannot synthesize.
//
// `process.cwd()` is the project root at build and at request time; the file is
// pulled into the serverless bundle by `outputFileTracingIncludes` in next.config.
// ─────────────────────────────────────────────────────────────────────────────

import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ReactElement } from 'react'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

let fontCache: Buffer | null = null

async function ogFont(): Promise<Buffer> {
  if (!fontCache) fontCache = await readFile(join(process.cwd(), 'assets', 'Geist-Regular.ttf'))
  return fontCache
}

export interface OgCard {
  /** Small uppercase line above the title: sport, "Чемпионат", competition name. */
  eyebrow?: string | null
  /** The headline — tournament name, "Team A 2:1 Team B", player name. */
  title: string
  /** One supporting line: format, city, teams count. */
  subtitle?: string | null
  /** Right-hand chip: score, position, jersey number. */
  badge?: string | null
  /** Accent colour, normally the sport's primary. */
  accent?: string
  /** Deep background gradient, normally the sport theme's `heroDark`. */
  background?: string
}

const DEFAULT_ACCENT = '#10b981'
const DEFAULT_BG = 'linear-gradient(135deg,#04120d 0%,#062e22 45%,#031a13 100%)'

/** Keeps long names from overflowing the card while staying readable. */
function titleSize(title: string): number {
  if (title.length <= 24) return 88
  if (title.length <= 40) return 72
  if (title.length <= 60) return 58
  return 46
}

function clamp(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`
}

export async function renderOgCard(card: OgCard): Promise<ImageResponse> {
  const accent = card.accent ?? DEFAULT_ACCENT
  const title = clamp(card.title, 90)

  const element: ReactElement = (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        background: card.background ?? DEFAULT_BG,
        color: '#ffffff',
        fontFamily: 'Geist',
      }}
    >
      {/* Accent rule instead of a heavy header block */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 14, height: 14, borderRadius: 7, background: accent, display: 'flex' }} />
        <div style={{ fontSize: 30, letterSpacing: 6, color: 'rgba(255,255,255,.82)' }}>TOURNABLE</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Eyebrow stays near-white: several sport accents (football green,
            hockey cyan) sit too close to their own dark background to be read. */}
        {card.eyebrow && (
          <div style={{ fontSize: 28, letterSpacing: 3, color: 'rgba(255,255,255,.78)', marginBottom: 18 }}>
            {clamp(card.eyebrow.toUpperCase(), 48)}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32 }}>
          <div style={{ fontSize: titleSize(title), lineHeight: 1.06, letterSpacing: -1.5, flex: 1 }}>
            {title}
          </div>
          {card.badge && (
            <div
              style={{
                display: 'flex',
                fontSize: 52,
                padding: '14px 28px',
                borderRadius: 24,
                background: accent,
                color: '#04120d',
                letterSpacing: -1,
              }}
            >
              {clamp(card.badge, 12)}
            </div>
          )}
        </div>
        {card.subtitle && (
          <div style={{ fontSize: 32, color: 'rgba(255,255,255,.62)', marginTop: 22 }}>
            {clamp(card.subtitle, 80)}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 26, color: 'rgba(255,255,255,.45)' }}>tournable.app</div>
        <div style={{ width: 180, height: 5, borderRadius: 3, background: accent, display: 'flex' }} />
      </div>
    </div>
  )

  return new ImageResponse(element, {
    ...OG_SIZE,
    fonts: [{ name: 'Geist', data: await ogFont(), style: 'normal', weight: 400 }],
  })
}
