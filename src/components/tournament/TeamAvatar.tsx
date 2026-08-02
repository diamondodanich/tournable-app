import Image from 'next/image'

interface Props {
  name: string
  logoUrl?: string | null
  size?: number
}

// A letter or a digit — anything else (quotes, brackets, dashes) must not become
// an initial. `Школа «Ұлытау»` has to read as "ШҰ", never as "Ш«".
// Unicode property escapes need ES2018, so letters are detected by case folding.
function isLetterOrDigit(c: string): boolean {
  return /[0-9]/.test(c) || c.toLowerCase() !== c.toUpperCase()
}

export default function TeamAvatar({ name, logoUrl, size = 24 }: Props) {
  const initials = name
    .split(/\s+/)
    .map(word => [...word].find(isLetterOrDigit) ?? '')
    .filter(Boolean)
    .slice(0, 2)
    .map(c => c.toUpperCase())
    .join('')

  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        unoptimized
      />
    )
  }

  const fontSize = Math.max(8, Math.floor(size * 0.38))
  return (
    <span
      className="rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center flex-shrink-0 select-none"
      style={{ width: size, height: size, fontSize }}
    >
      {initials || '?'}
    </span>
  )
}
