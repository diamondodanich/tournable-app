import Link from 'next/link'
import Image from 'next/image'
import { createPublicClient } from '@/lib/supabase/public'
import { Trophy, ArrowRight } from 'lucide-react'
import { getSubtype, getSportTheme, type Lang } from '@/lib/sports'
import { sportPathFor, langPrefix } from '@/lib/sportSeo'
import { jsonLdGraph, breadcrumbsLd, itemListLd } from '@/lib/seo'

type Mode = 'tournaments' | 'leagues'

const COPY = {
  ru: {
    home: 'Главная',
    tournaments: {
      crumb: 'Турниры',
      h1: 'Турниры и соревнования онлайн',
      intro: 'Публичные турниры, созданные на Tournable: таблицы, расписание матчей и результаты открыты по ссылке — без регистрации. Откройте любой, чтобы посмотреть, как выглядит турнир, или создайте свой.',
      empty: 'Публичных турниров пока нет.',
    },
    leagues: {
      crumb: 'Чемпионаты',
      h1: 'Чемпионаты и лиги',
      intro: 'Многосезонные чемпионаты на Tournable: постоянные страницы команд и игроков, статистика за всю историю, архив сезонов и текущая турнирная таблица.',
      empty: 'Публичных чемпионатов пока нет.',
    },
    bySport: 'Турниры по видам спорта',
    cta: 'Создать турнир бесплатно',
    open: 'Открыть',
  },
  kz: {
    home: 'Басты бет',
    tournaments: {
      crumb: 'Турнирлер',
      h1: 'Онлайн турнирлер мен жарыстар',
      intro: 'Tournable-де құрылған ашық турнирлер: кестелер, матчтар кестесі мен нәтижелер сілтеме арқылы тіркеусіз ашық. Кез келгенін ашып көріңіз немесе өзіңіздікін құрыңыз.',
      empty: 'Әзірге ашық турнирлер жоқ.',
    },
    leagues: {
      crumb: 'Чемпионаттар',
      h1: 'Чемпионаттар мен лигалар',
      intro: 'Tournable-дегі көп маусымды чемпионаттар: командалар мен ойыншылардың тұрақты беттері, бүкіл тарих статистикасы, маусымдар мұрағаты және ағымдағы турнир кестесі.',
      empty: 'Әзірге ашық чемпионаттар жоқ.',
    },
    bySport: 'Спорт түрлері бойынша турнирлер',
    cta: 'Тегін турнир құру',
    open: 'Ашу',
  },
  en: {
    home: 'Home',
    tournaments: {
      crumb: 'Tournaments',
      h1: 'Online tournaments and competitions',
      intro: 'Public tournaments built on Tournable: standings, fixtures and results are open by link, no account needed. Open any of them to see what a tournament looks like, or create your own.',
      empty: 'No public tournaments yet.',
    },
    leagues: {
      crumb: 'Championships',
      h1: 'Championships and leagues',
      intro: 'Multi-season championships on Tournable: permanent team and player pages, all-time statistics, a season archive and the current league table.',
      empty: 'No public championships yet.',
    },
    bySport: 'Tournaments by sport',
    cta: 'Create a tournament for free',
    open: 'Open',
  },
} as const

/** Shared catalogue for /tournaments and /leagues — the internal-link hubs that
 *  make individual tournament, team and player pages crawlable at all. */
export default async function CatalogPage({ mode, lang }: { mode: Mode; lang: Lang }) {
  const t = COPY[lang]
  const section = t[mode]
  const prefix = langPrefix(lang)
  const supabase = createPublicClient()

  const rows = mode === 'tournaments'
    ? (await supabase
        .from('tournaments')
        .select('id, slug, name, sport, created_at')
        .eq('is_public', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200)).data ?? []
    : (await supabase
        .from('leagues')
        .select('id, slug, name, sport, city, created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(200)).data ?? []

  const items = rows.map(r => ({
    id: r.id as string,
    name: r.name as string,
    sport: (r.sport as string | null) ?? null,
    city: ('city' in r ? (r.city as string | null) : null),
    path: mode === 'tournaments'
      ? `/t/${(r as { slug?: string | null }).slug ?? r.id}`
      : `/leagues/${(r as { slug: string }).slug}`,
  }))

  // Sports that actually have something to show, for the cross-link row.
  const sportsPresent = [...new Set(items.map(i => i.sport).filter(Boolean) as string[])]
    .map(s => ({ sport: s, name: getSubtype(s)?.label[lang] ?? s, path: sportPathFor(s, lang) }))
    .filter(s => !!s.path)

  const jsonLd = jsonLdGraph(
    items.length ? itemListLd(items.map(i => ({ name: i.name, path: i.path }))) : null,
    breadcrumbsLd([
      { name: 'Tournable', path: prefix || '/' },
      { name: section.crumb, path: `${prefix}/${mode}` },
    ]),
  )

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <header className="border-b border-gray-100 sticky top-0 z-20 bg-white/85 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={prefix || '/'} className="flex items-center gap-2">
            <Image src="/logo-green.png" alt="Tournable" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="font-black text-lg tracking-tight text-emerald-700" style={{ letterSpacing: '-.03em' }}>TOURNABLE</span>
          </Link>
          <Link href="/register" className="text-sm font-bold text-white bg-emerald-600 px-4 py-2 rounded-xl">
            {t.cta}
          </Link>
        </div>
      </header>

      <nav aria-label="breadcrumb" className="max-w-5xl mx-auto px-4 pt-5 text-xs font-semibold text-gray-400">
        <ol className="flex items-center gap-1.5">
          <li><Link href={prefix || '/'} className="hover:text-gray-600">{t.home}</Link></li>
          <li aria-hidden>/</li>
          <li className="text-gray-700">{section.crumb}</li>
        </ol>
      </nav>

      <section className="max-w-5xl mx-auto px-4 pt-8 pb-10">
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 leading-[1.08] tracking-tight">{section.h1}</h1>
        <p className="mt-5 text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">{section.intro}</p>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-14">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">{section.empty}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map(item => {
              const theme = getSportTheme(item.sport)
              return (
                <li key={item.id}>
                  <Link href={item.path}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 px-5 py-4 hover:border-gray-200 transition-colors">
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: theme.light }}>
                        <Trophy size={15} style={{ color: theme.primaryDark }} />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold text-gray-800 truncate">{item.name}</span>
                        <span className="block text-xs font-semibold text-gray-400 truncate">
                          {[item.sport ? getSubtype(item.sport)?.label[lang] ?? item.sport : null, item.city]
                            .filter(Boolean).join(' · ')}
                        </span>
                      </span>
                    </span>
                    <ArrowRight size={15} className="text-gray-300 shrink-0" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {sportsPresent.length > 0 && (
        <section className="border-t border-gray-100 py-12">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-lg font-black text-gray-900 tracking-tight">{t.bySport}</h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {sportsPresent.map(s => (
                <li key={s.sport}>
                  <Link href={s.path!}
                    className="inline-block text-sm font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-100 px-3 py-1.5 rounded-lg">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
