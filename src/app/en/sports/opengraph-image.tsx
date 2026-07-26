import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Sports — Tournable'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return renderOgCard({
    eyebrow: 'Sports',
    title: 'A tournament in any discipline',
    subtitle: 'Football, basketball, volleyball, hockey, tennis, chess, MMA, esports',
  })
}
