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
          borderRadius: 40,
          background: 'linear-gradient(145deg, #059669 0%, #036045 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* subtle field arc — top */}
        <div
          style={{
            position: 'absolute',
            top: -30,
            left: -30,
            width: 140,
            height: 140,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.08)',
            display: 'flex',
          }}
        />
        {/* subtle field arc — bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: -30,
            right: -30,
            width: 140,
            height: 140,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.08)',
            display: 'flex',
          }}
        />

        {/* Big T */}
        <span
          style={{
            color: 'white',
            fontSize: 96,
            fontWeight: 900,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: 1,
            letterSpacing: '-3px',
            marginBottom: -4,
          }}
        >
          T
        </span>

        {/* Soccer ball + label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 2,
          }}
        >
          <span style={{ fontSize: 22 }}>⚽</span>
          <span
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.5px',
            }}
          >
            TOURNABLE
          </span>
        </div>
      </div>
    ),
    { ...size },
  )
}
