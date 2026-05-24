import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 38,
          background: 'linear-gradient(145deg, #047857 0%, #059669 55%, #10b981 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
            display: 'flex',
          }}
        />
        {/* Glow blob top-left */}
        <div
          style={{
            position: 'absolute',
            top: -20,
            left: -20,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
          }}
        />

        {/* T letter — bold, clean */}
        <span
          style={{
            color: 'white',
            fontSize: 100,
            fontWeight: 900,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: 1,
            letterSpacing: '-4px',
            marginBottom: 2,
          }}
        >
          T
        </span>

        {/* Brand name */}
        <span
          style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
          }}
        >
          TOURNABLE
        </span>
      </div>
    ),
    { ...size },
  )
}
