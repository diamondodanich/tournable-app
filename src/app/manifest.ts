import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tournable',
    short_name: 'Tournable',
    description: 'Управление спортивными турнирами',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#059669',
    theme_color: '#059669',
    icons: [
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/pwa-icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
