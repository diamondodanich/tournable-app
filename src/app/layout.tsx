import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Tournable — Управление турнирами',
  description: 'Создавайте турниры, управляйте матчами и делитесь результатами',
  appleWebApp: {
    capable: true,
    title: 'Tournable',
    statusBarStyle: 'black-translucent',
  },
  applicationName: 'Tournable',
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="h-full">
      <body className={`${inter.className} min-h-full`}>
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
