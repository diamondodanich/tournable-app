import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { Analytics } from '@vercel/analytics/next'
import { APP_URL } from '@/lib/appUrl'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

const DESCRIPTION =
  'Создавайте турниры по футболу, баскетболу, волейболу и другим видам спорта за минуту: автоматическое расписание, турнирная таблица, плей-офф сетка, статистика игроков и табло. Делитесь результатами по ссылке — без регистрации для зрителей.'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Tournable — создать турнир онлайн, турнирная таблица и расписание матчей',
    template: '%s — Tournable',
  },
  description: DESCRIPTION,
  keywords: [
    'создать турнир', 'создать турнир онлайн', 'турнирная таблица онлайн', 'расписание матчей',
    'турнир по футболу', 'турнир по баскетболу', 'плей-офф сетка', 'круговой турнир',
    'генератор турнирной сетки', 'таблица результатов', 'провести турнир', 'спортивный турнир',
    'организовать турнир', 'сетка турнира', 'швейцарская система', 'лига', 'чемпионат',
    'tournament bracket generator', 'round robin', 'league table', 'турнир', 'жарыс', 'кесте',
  ],
  applicationName: 'Tournable',
  authors: [{ name: 'Tournable' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Tournable',
    url: APP_URL,
    title: 'Tournable — создать турнир онлайн за минуту',
    description: DESCRIPTION,
    locale: 'ru_RU',
    images: [{ url: '/logo-green.png' }],
  },
  twitter: {
    card: 'summary',
    title: 'Tournable — создать турнир онлайн',
    description: DESCRIPTION,
    images: ['/logo-green.png'],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/logo-green.png',
    shortcut: '/logo-green.png',
    apple: '/logo-green.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Tournable',
    statusBarStyle: 'black-translucent',
  },
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
        <Analytics />
      </body>
    </html>
  )
}
