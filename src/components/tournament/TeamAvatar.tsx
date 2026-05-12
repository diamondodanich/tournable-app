import Image from 'next/image'

interface Props {
  name: string
  logoUrl?: string | null
  size?: number
}

export default function TeamAvatar({ name, logoUrl, size = 24 }: Props) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
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
