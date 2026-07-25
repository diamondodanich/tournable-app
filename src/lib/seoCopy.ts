// Localized title/description copy used by the public marketing surfaces
// (landing in 3 languages, sport pages, catalogues). Kept apart from `seo.ts`
// so that file stays purely structural.

import type { Lang } from '@/lib/seo'

export const LANDING_SEO: Record<Lang, { title: string; description: string }> = {
  ru: {
    title: 'Tournable — создать турнир онлайн, турнирная таблица и расписание матчей',
    description:
      'Создавайте турниры по футболу, баскетболу, волейболу и другим видам спорта за минуту: автоматическое расписание, турнирная таблица, плей-офф сетка, статистика игроков и табло. Делитесь результатами по ссылке — без регистрации для зрителей.',
  },
  kz: {
    title: 'Tournable — онлайн турнир құру, турнир кестесі және матчтар кестесі',
    description:
      'Футбол, баскетбол, волейбол және басқа спорт түрлері бойынша турнирді бір минутта құрыңыз: автоматты кесте, турнир кестесі, плей-офф торы, ойыншылар статистикасы және таблосы. Нәтижелерді сілтеме арқылы бөлісіңіз — көрермендерге тіркелудің қажеті жоқ.',
  },
  en: {
    title: 'Tournable — create a tournament online, league table and match schedule',
    description:
      'Run football, basketball, volleyball and esports tournaments in a minute: automatic fixtures, league table, playoff bracket, player statistics and a live scoreboard. Share results by link — no sign-up for spectators.',
  },
}

export const OG_LOCALE: Record<Lang, string> = { ru: 'ru_RU', kz: 'kk_KZ', en: 'en_US' }

/** hreflang value for a UI language (`kz` is a country code, Google wants `kk`). */
export const HREFLANG: Record<Lang, string> = { ru: 'ru', kz: 'kk', en: 'en' }
