// Custom sport ball SVG icons — Lucide-compatible (24×24, stroke-based)

interface IconProps {
  size?: number
  className?: string
}

// Soccer ball: circle + filled central pentagon + 5 seam lines toward edge
export function SoccerBall({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      {/* central pentagon — filled to look like the black patch */}
      <polygon
        points="12,7 15.5,9.6 14.2,13.7 9.8,13.7 8.5,9.6"
        fill="currentColor" strokeWidth="1.25"
      />
      {/* seam lines from each pentagon vertex to circle edge */}
      <line x1="12"   y1="7"    x2="12"   y2="2"    />
      <line x1="15.5" y1="9.6"  x2="20.3" y2="7.2"  />
      <line x1="14.2" y1="13.7" x2="17.6" y2="20.6" />
      <line x1="9.8"  y1="13.7" x2="6.4"  y2="20.6" />
      <line x1="8.5"  y1="9.6"  x2="3.7"  y2="7.2"  />
    </svg>
  )
}

// Basketball ball: circle + horizontal seam + two side arcs (parentheses)
export function BasketballBall({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      {/* horizontal equator seam */}
      <line x1="2" y1="12" x2="22" y2="12" />
      {/* left-side arc — curves outward to the left */}
      <path d="M4.93 4.93 Q1 12 4.93 19.07" />
      {/* right-side arc — curves outward to the right */}
      <path d="M19.07 4.93 Q23 12 19.07 19.07" />
    </svg>
  )
}

// Hockey puck: flat 3D cylinder viewed from slight angle
export function HockeyPuck({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.75"
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
