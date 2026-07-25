import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import type { Lang } from '@/lib/sports'
import { sportsByCategory, langPrefix } from '@/lib/sportSeo'
import { jsonLdGraph, breadcrumbsLd, itemListLd } from '@/lib/seo'

const COPY = {
  ru: {
    h1: 'Виды спорта: создать турнир онлайн',
    intro: 'Выберите дисциплину — Tournable подставит формат, длительность матча и правила начисления очков, построит расписание, турнирную таблицу и сетку плей-офф. Все виды спорта доступны на бесплатном тарифе.',
    home: 'Главная',
    sports: 'Виды спорта',
    cta: 'Создать турнир бесплатно',
  },
  kz: {
    h1: 'Спорт түрлері: онлайн турнир құру',
    intro: 'Пәнді таңдаңыз — Tournable форматты, матч ұзақтығын және ұпай ережелерін қойып, кесте, турнир кестесі мен плей-офф торын құрады. Барлық спорт түрлері тегін тарифте қолжетімді.',
    home: 'Басты бет',
    sports: 'Спорт түрлері',
    cta: 'Тегін турнир құру',
  },
  en: {
    h1: 'Sports: create a tournament online',
    intro: 'Pick a discipline — Tournable fills in the format, match length and points rules, then builds the fixtures, league table and playoff bracket. Every sport is available on the free plan.',
    home: 'Home',
    sports: 'Sports',
    cta: 'Create a tournament for free',
  },
} as const

export default function SportsIndex({ lang }: { lang: Lang }) {
  const t = COPY[lang]
  const prefix = langPrefix(lang)
  const groups = sportsByCategory(lang)
  const all = groups.flatMap(g => g.items)

  const jsonLd = jsonLdGraph(
    itemListLd(all.map(i => ({ name: i.name, path: i.path }))),
    breadcrumbsLd([
      { name: 'Tournable', path: prefix || '/' },
      { name: t.sports, path: `${prefix}/sports` },
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
          <li className="text-gray-700">{t.sports}</li>
        </ol>
      </nav>

      <section className="max-w-5xl mx-auto px-4 pt-8 pb-12">
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 leading-[1.08] tracking-tight">{t.h1}</h1>
        <p className="mt-5 text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">{t.intro}</p>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-20 space-y-10">
        {groups.map(group => (
          <div key={group.id}>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">{group.label}</h2>
            <p className="mt-1 text-sm text-gray-500">{group.tagline}</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map(item => (
                <li key={item.slug}>
                  <Link href={item.path}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 px-5 py-4 hover:border-emerald-200 hover:bg-emerald-50/40 transition-colors">
                    <span className="font-bold text-gray-800">{item.name}</span>
                    <ArrowRight size={15} className="text-gray-300 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  )
}
