'use client'

import { getCoverStyle } from '@/lib/cover-themes'

interface Props {
  coverUrl: string | null | undefined
  className?: string
}

export default function TournamentCoverBanner({ coverUrl, className = 'h-24 sm:h-36' }: Props) {
  if (!coverUrl) return null

  const style = getCoverStyle(coverUrl)

  if (style) {
    return <div className={`w-full ${className}`} style={style} />
  }

  // Custom uploaded image
  return (
    <div className={`w-full overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={coverUrl} alt="" className="w-full h-full object-cover" />
    </div>
  )
}
