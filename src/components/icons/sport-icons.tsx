// Custom sport ball SVG icons — filled, currentColor
// These are complex filled SVGs designed to fill their container via CSS.
// Pass `className` with w-*/h-* Tailwind classes to size them;
// the `size` prop is kept for Lucide API compatibility but ignored in favour of className.

interface IconProps {
  size?: number
  className?: string
}

// Soccer ball — realistic hexagonal pattern (svgrepo.com)
export function SoccerBall({ className = 'w-full h-full' }: IconProps) {
  return (
    <svg
      viewBox="0 0 122.88 122.88"
      fill="currentColor" xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd" clipRule="evenodd"
        d="M61.44,0c16.97,0,32.33,6.88,43.44,18c11.12,11.12,18,26.48,18,43.44c0,16.97-6.88,32.33-18,43.44
          c-11.12,11.12-26.48,18-43.44,18S29.11,116,18,104.88C6.88,93.77,0,78.41,0,61.44C0,44.47,6.88,29.11,18,18
          C29.11,6.88,44.47,0,61.44,0L61.44,0z M76.85,117.08L76.73,117l6.89-23.09L69.41,78.15L52.66,78L39.38,94.62l6.66,22.32
          l-0.15,0.1c4.95,1.38,10.16,2.12,15.55,2.12C66.78,119.16,71.95,118.44,76.85,117.08L76.85,117.08z M12.22,91.61l24.34,0.12
          L49.28,75.8l-5.26-16.12l-21.42-9.3L3.78,64.08C4.23,74.14,7.26,83.53,12.22,91.61L12.22,91.61z M16.77,24.88l7.4,22.14
          l19.98,8.68l15.44-11.97V20.94L40.51,7.63c-7.52,2.93-14.28,7.39-19.89,13C19.27,21.98,17.98,23.4,16.77,24.88L16.77,24.88z
          M81.7,7.37L63.3,20.77V43.7L77.8,54.91l20.81-8.92l7.18-21.49c-1.12-1.35-2.3-2.64-3.54-3.88
          C96.48,14.85,89.49,10.29,81.7,7.37L81.7,7.37z M119.09,64.36l-0.02,0.01L99.09,49.82l-19.81,8.49l-6.08,18.03
          l13.73,15.23c0.06,0.06,0.09,0.13,0.11,0.21l23.6-0.11C115.56,83.65,118.59,74.34,119.09,64.36L119.09,64.36z"
      />
    </svg>
  )
}

// Basketball ball — realistic curved panel pattern (svgrepo.com)
export function BasketballBall({ className = 'w-full h-full' }: IconProps) {
  return (
    <svg
      viewBox="0 0 77.832 77.832"
      fill="currentColor" xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M38.916,0C17.458,0,0,17.458,0,38.916c0,2.489,0.245,4.923,0.693,7.284l-0.146,0.175
          c0.07,0.059,0.138,0.109,0.208,0.167c3.555,17.819,19.312,31.29,38.161,31.29
          c21.458,0,38.916-17.458,38.916-38.916S60.374,0,38.916,0z
          M72.061,25.249c-0.052,12.625-11.312,15.317-16.045,15.888
          c3.945-13.604,2.821-26.663,1.959-32.572C64.236,12.512,69.199,18.337,72.061,25.249z
          M54.559,6.658c0.653,3.375,3.119,18.577-1.675,34.318c-9.122-2.418-10.416-9.061-12.143-18.104
          c-1.169-6.126-2.491-12.99-6.694-19.474c1.594-0.217,3.217-0.339,4.869-0.339
          C44.521,3.059,49.829,4.354,54.559,6.658z
          M30.764,4.005c4.453,6.291,5.793,13.262,6.973,19.441
          c1.714,8.979,3.346,17.479,14.175,20.446c-0.799,2.201-1.749,4.398-2.877,6.562
          C26.575,39.574,12.794,22.096,9.798,18.031C14.786,11.094,22.187,6.007,30.764,4.005z
          M8.018,20.751c4.195,5.486,17.939,21.856,39.521,32.371
          c-0.844,1.407-1.773,2.791-2.789,4.147c-5.908-2.934-11.457-3.388-16.834-3.826
          c-7.44-0.607-15.128-1.256-24.354-8.571c-0.326-1.938-0.504-3.926-0.504-5.956
          C3.059,32.29,4.872,26.083,8.018,20.751z
          M4.647,49.475c8.612,5.83,15.922,6.438,23.021,7.018
          c5.113,0.417,9.972,0.82,15.12,3.232c-4.148,4.854-9.563,9.235-16.591,12.709
          C15.932,68.525,7.908,60.038,4.647,49.475z
          M30.319,73.725c6.382-3.564,11.38-7.873,15.283-12.574
          c1.639,0.906,4.851,3.021,5.688,6.066c0.497,1.805,0.046,3.756-1.312,5.803
          c-3.485,1.133-7.201,1.754-11.061,1.754C35.953,74.773,33.074,74.405,30.319,73.725z
          M54.134,71.374c0.507-1.685,0.552-3.351,0.101-4.983c-1.068-3.863-4.598-6.434-6.729-7.677
          c1.028-1.403,1.967-2.833,2.823-4.284c5.354,2.402,11.157,4.416,17.387,5.82
          C64.193,64.993,59.529,68.834,54.134,71.374z
          M69.557,57.523c-6.373-1.342-12.293-3.354-17.74-5.776
          c1.27-2.456,2.322-4.952,3.191-7.446c2.686-0.195,10.21-1.199,15.299-6.387
          c1.709-1.742,2.957-3.786,3.758-6.096c0.463,2.295,0.709,4.668,0.709,7.098
          C74.773,45.725,72.865,52.096,69.557,57.523z"
      />
    </svg>
  )
}

// Boxing glove — combat sports (rounded mitt with knuckle bumps, thumb, wrist strap)
export function MmaGlove({ size = 24, className = '' }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      {/* mitt body */}
      <path d="M8 8.3c0-2.5 2-4 4.2-4s4.3 1.5 4.3 4v3.6a3 3 0 0 1-3 3h-3a2.5 2.5 0 0 1-2.5-2.5z" />
      {/* knuckle bumps across the top */}
      <path d="M8.3 8c1.4-1 6.2-1 8.2 0" />
      {/* thumb */}
      <path d="M8 10.4H6.4A2.4 2.4 0 0 0 4 12.8v.2a2.4 2.4 0 0 0 2.4 2.4H8" />
      {/* wrist cuff */}
      <path d="M10 14.9V17a2 2 0 0 0 2 2h1.6a2 2 0 0 0 2-2v-2.1" />
      {/* strap */}
      <rect x="10.3" y="15.5" width="5" height="2.4" rx=".8" />
    </svg>
  )
}

// Tennis racket + ball — racket sports (angled strung head, handle, ball)
export function TennisRacket({ size = 24, className = '' }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      {/* head */}
      <ellipse cx="9" cy="8" rx="4.9" ry="5.8" transform="rotate(-38 9 8)" />
      {/* strings */}
      <path d="M6.2 4.4 11.4 8.7M4.7 7 10.6 10.4M8.4 3.8 10 11.2" opacity=".8" />
      <path d="M5.4 9.5 12.1 6.1" opacity=".8" />
      {/* throat + handle */}
      <path d="M12 12 18.4 19" />
      {/* grip cap */}
      <path d="M17 16.7 19.2 18.9" strokeWidth="2.6" />
      {/* ball */}
      <circle cx="6.4" cy="18" r="2.6" />
      <path d="M4.2 16.6c1.4 1 1.4 3.8 0 4.8" opacity=".7" />
    </svg>
  )
}

// Chess queen — mind sports (crowned head, flared gown, tiered base)
export function ChessPawn({ size = 24, className = '' }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      {/* crown with points */}
      <path d="M5.4 5 7 9.2h10L18.6 5l-3 2.5L12 3.6 8.4 7.5 5.4 5Z" />
      {/* collar */}
      <path d="M7 9.2h10l-.5 2H7.5z" />
      {/* flared gown */}
      <path d="M7.5 11.2c.5 3-1 5.4-2.2 7.3h13.4c-1.2-1.9-2.7-4.3-2.2-7.3" />
      {/* base */}
      <rect x="4.4" y="18.5" width="15.2" height="2.5" rx="1" />
    </svg>
  )
}

// Yurt — nomad games (domed roof, eave line, body, door)
export function Yurt({ size = 24, className = '' }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      {/* roof */}
      <path d="M3.5 11 12 4l8.5 7" />
      {/* shanyrak (crown) */}
      <path d="M10.4 4.9 12 4l1.6.9" />
      {/* eave */}
      <path d="M4 11h16" />
      {/* walls */}
      <path d="M5.2 11v9h13.6v-9" />
      {/* door */}
      <path d="M9.8 20v-4.2a2.2 2.2 0 0 1 4.4 0V20" />
    </svg>
  )
}

// American football — US sports (pointed ball with center seam and laces)
export function AmericanFootball({ size = 24, className = '' }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      {/* ball */}
      <ellipse cx="12" cy="12" rx="9" ry="5.6" transform="rotate(-35 12 12)" />
      {/* end caps */}
      <path d="M6.6 7.2 8 8.6M16 15.4l1.4 1.4" opacity=".8" />
      {/* center seam */}
      <path d="M9.7 14.3 14.3 9.7" />
      {/* laces */}
      <path d="M10.6 12.9l1.1 1.1M11.7 11.8l1.1 1.1M12.8 10.7l1.1 1.1" />
    </svg>
  )
}

// Hockey puck: flat 3D cylinder viewed from slight angle
export function HockeyPuck({ size = 24, className = '' }: IconProps) {
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
