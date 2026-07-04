import { createClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/landing/LandingPage'
import { APP_URL } from '@/lib/appUrl'

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Tournable',
  url: APP_URL,
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Web',
  inLanguage: ['ru', 'kk', 'en'],
  description:
    'Сервис для создания турниров онлайн: автоматическое расписание, турнирная таблица, плей-офф, статистика игроков и Live-табло.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'KZT' },
  publisher: { '@type': 'Organization', name: 'Tournable', url: APP_URL },
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const initials = user?.email?.slice(0, 2).toUpperCase()
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <LandingPage isLoggedIn={!!user} defaultLang="ru" userInitials={initials} />
    </>
  )
}
