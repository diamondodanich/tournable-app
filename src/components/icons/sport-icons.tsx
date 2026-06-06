// Custom sport ball SVG icons — Lucide-compatible (24×24, stroke-based)

interface IconProps {
  size?: number
  className?: string
}

export function SoccerBall({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="12,7.5 14.8,9.6 13.8,12.9 10.2,12.9 9.2,9.6" />
      <line x1="12" y1="2" x2="12" y2="7.5" />
      <line x1="20.2" y1="7" x2="15.5" y2="9.1" />
      <line x1="17.4" y1="20.3" x2="14.5" y2="16.2" />
      <line x1="6.6" y1="20.3" x2="9.5" y2="16.2" />
      <line x1="3.8" y1="7" x2="8.5" y2="9.1" />
    </svg>
  )
}

export function BasketballBall({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2 C8.5 5.5 8.5 18.5 12 22" />
      <path d="M12 2 C15.5 5.5 15.5 18.5 12 22" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  )
}

export function HockeyPuck({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <ellipse cx="12" cy="8.5" rx="9" ry="3.5" />
      <line x1="3" y1="8.5" x2="3" y2="15.5" />
      <line x1="21" y1="8.5" x2="21" y2="15.5" />
      <path d="M3 15.5 Q3 19 12 19 Q21 19 21 15.5" />
    </svg>
  )
}
