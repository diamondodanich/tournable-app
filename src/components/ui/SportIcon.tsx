// Shared sport event icons — used in FixturesTab, PlayoffTab, LiveBoard

export function SoccerBallIcon({ size = 13, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="9.5" />
      {/* Center pentagon (white) */}
      <polygon points="10,6 13.8,8.8 12.4,13.2 7.6,13.2 6.2,8.8" fill="white" opacity="0.9" />
      {/* 5 seam lines from pentagon vertices to circle edge */}
      <line x1="10" y1="6" x2="10" y2="0.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="13.8" y1="8.8" x2="19" y2="7.1" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="12.4" y1="13.2" x2="15.7" y2="17.6" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="7.6" y1="13.2" x2="4.3" y2="17.6" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="6.2" y1="8.8" x2="1" y2="7.1" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
    </svg>
  )
}

export function AssistIcon({ size = 13, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center font-black leading-none shrink-0 ${className}`}
      style={{ fontSize: Math.round(size * 0.92), lineHeight: 1, width: size, height: size }}
      aria-hidden="true"
    >
      A
    </span>
  )
}
