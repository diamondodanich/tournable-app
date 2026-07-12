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

// MMA / boxing glove — combat sports (fist-forward, four finger ridges + thumb + wrist strap)
export function MmaGlove({ size = 24, className = '' }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      {/* glove shell */}
      <path d="M8 6.4A2.5 2.5 0 0 1 10.5 4h4.2A4.3 4.3 0 0 1 19 8.3v5.1A2.6 2.6 0 0 1 16.4 16H9.6A2.6 2.6 0 0 1 7 13.4v-2" />
      {/* thumb */}
      <path d="M8 6.4 6.4 7.2A2.4 2.4 0 0 0 5 9.4v1.8A2 2 0 0 0 7 13.2" />
      {/* finger ridges */}
      <path d="M10.6 4.2v3.5M13.2 4v3.7" />
      {/* knuckle crease */}
      <path d="M7.6 7.7h9.7" />
      {/* wrist cuff */}
      <path d="M9.4 16v2.3A1.7 1.7 0 0 0 11.1 20h3.4a1.7 1.7 0 0 0 1.7-1.7V16" />
      {/* strap */}
      <rect x="10.6" y="16.4" width="3.6" height="2.4" rx=".7" />
    </svg>
  )
}

// Tennis racket — racket sports (angled head with strings + handle)
export function TennisRacket({ size = 24, className = '' }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      {/* head */}
      <ellipse cx="9.6" cy="8" rx="5.1" ry="5.9" transform="rotate(-40 9.6 8)" />
      {/* strings — one way */}
      <path d="M7 4.7 12.2 9M5.2 7.3 10.9 10.6M8.7 3.7 10.6 11.2" opacity=".85" />
      {/* strings — cross way */}
      <path d="M5.8 9.7 12.6 6.4M7.8 12.1 13.3 8.6" opacity=".85" />
      {/* throat */}
      <path d="M12.3 12.3 14.9 15" />
      {/* handle */}
      <path d="M14.4 14.5 18.9 19.3" />
      {/* grip cap */}
      <path d="M17.4 17.3 19.4 19.5" strokeWidth="2.6" />
    </svg>
  )
}

// Chess pawn — mind sports (canonical: sphere head, collar, bell body, tiered base)
export function ChessPawn({ size = 24, className = '' }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      {/* head */}
      <circle cx="12" cy="5.2" r="2.6" />
      {/* collar under the head */}
      <path d="M9.3 8.4a4 4 0 0 0 5.4 0" />
      {/* bell body */}
      <path d="M9.9 9.3c.2 2.1-1.3 3.6-2.2 5.3M14.1 9.3c-.2 2.1 1.3 3.6 2.2 5.3" />
      {/* mid ring */}
      <path d="M7.7 14.6h8.6" />
      {/* flared skirt */}
      <path d="M8.3 14.6c-.3 1.5-1 2.6-1.8 3.9h11c-.8-1.3-1.5-2.4-1.8-3.9" />
      {/* base */}
      <rect x="5.9" y="18.5" width="12.2" height="2.6" rx="1.1" />
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
