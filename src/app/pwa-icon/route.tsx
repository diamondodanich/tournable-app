import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          borderRadius: 112,
          background: 'linear-gradient(145deg, #059669 0%, #036045 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* field arc top-left */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            left: -80,
            width: 380,
            height: 380,
            borderRadius: '50%',
            border: '5px solid rgba(255,255,255,0.07)',
            display: 'flex',
          }}
        />
        {/* field arc bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            right: -80,
            width: 380,
            height: 380,
            borderRadius: '50%',
            border: '5px solid rgba(255,255,255,0.07)',
            display: 'flex',
          }}
        />
        {/* center circle */}
        <div
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: '50%',
            border: '5px solid rgba(255,255,255,0.06)',
            display: 'flex',
          }}
        />

        {/* Big T */}
        <span
          style={{
            color: 'white',
            fontSize: 280,
            fontWeight: 900,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: 1,
            letterSpacing: '-8px',
            marginBottom: -8,
          }}
        >
          T
        </span>

        {/* Soccer ball + wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 4,
          }}
        >
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex' }} />
          <span
            style={{
              color: 'rgba(255,255,255,0.72)',
              fontSize: 38,
              fontWeight: 700,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '1.5px',
            }}
          >
            TOURNABLE
          </span>
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  )
}
