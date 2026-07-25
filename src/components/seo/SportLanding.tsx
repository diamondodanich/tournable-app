import Link from 'next/link'
import Image from 'next/image'
import { createPublicClient } from '@/lib/supabase/public'
import {
  CalendarDays, ListOrdered, Network, BarChart3, MonitorPlay, Share2,
  ArrowRight, Check, Trophy,
} from 'lucide-react'
import { getSubtype, getCategoryForSport, getEventDefs, getSportTheme, type Lang } from '@/lib/sports'
import { FORMAT_LABELS, FORMAT_DESCS } from '@/lib/formats'
import { sportPageCopy, otherSports, langPrefix, type SportSeoEntry } from '@/lib/sportSeo'
import { jsonLdGraph, breadcrumbsLd, faqLd, itemListLd } from '@/lib/seo'

const FEATURE_ICONS = [CalendarDays, ListOrdered, Network, BarChart3, MonitorPlay, Share2]

/**
 * Public landing page for one discipline. Everything factual on it — formats,
 * period length, points, tracked events — is read from `lib/sports.ts`, so the
 * page can never promise a format the product does not offer for that sport.
 */
export default async function SportLanding({ entry, lang }: { entry: SportSeoEntry; lang: Lang }) {
  const subtype = getSubtype(entry.sport)
  const category = getCategoryForSport(entry.sport)
  const theme = getSportTheme(entry.sport)
  const prefix = langPrefix(lang)

  const formats = subtype?.formats ?? ['round_robin', 'playoff']
  const formatNames = formats.map(f => FORMAT_LABELS[f][lang])
  const statNames = getEventDefs(entry.sport).filter(d => d.stat).map(d => d.label[lang])
  const copy = sportPageCopy(entry, lang, formatNames, statNames)

  // Real tournaments in this discipline — internal links to pages that would
  // otherwise be reachable only from the sitemap.
  const supabase = createPublicClient()
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, slug, name, created_at')
    .eq('sport', entry.sport)
    .eq('is_public', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(12)

  const list = tournaments ?? []
  const path = `${prefix}/sports/${entry.slug}`
  const others = otherSports(entry.slug, lang)

  const L = {
    ru: { home: 'Главная', points: 'Очки за победу / ничью', tracked: 'Учитываемые события', open: 'Открыть', min: 'мин' },
    kz: { home: 'Басты бет', points: 'Жеңіс / тең ұпай', tracked: 'Есептелетін оқиғалар', open: 'Ашу', min: 'мин' },
    en: { home: 'Home', points: 'Points for win / draw', tracked: 'Tracked events', open: 'Open', min: 'min' },
  }[lang]

  const jsonLd = jsonLdGraph(
    faqLd(copy.faq),
    breadcrumbsLd([
      { name: 'Tournable', path: prefix || '/' },
      { name: copy.breadcrumbSports, path: `${prefix}/sports` },
      { name: entry.name[lang], path },
    ]),
    list.length
      ? itemListLd(list.map(t => ({ name: t.name, path: `/t/${t.slug ?? t.id}` })))
      : null,
  )

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 z-20 bg-white/85 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={prefix || '/'} className="flex items-center gap-2">
            <Image src="/logo-green.png" alt="Tournable" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="font-black text-lg tracking-tight text-emerald-700" style={{ letterSpacing: '-.03em' }}>TOURNABLE</span>
          </Link>
          <Link href="/register" className="text-sm font-bold text-white px-4 py-2 rounded-xl" style={{ background: theme.primary }}>
            {copy.ctaPrimary}
          </Link>
        </div>
      </header>

      {/* Breadcrumbs — the visible counterpart of the BreadcrumbList above */}
      <nav aria-label="breadcrumb" className="max-w-5xl mx-auto px-4 pt-5 text-xs font-semibold text-gray-400">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href={prefix || '/'} className="hover:text-gray-600">{L.home}</Link></li>
          <li aria-hidden>/</li>
          <li><Link href={`${prefix}/sports`} className="hover:text-gray-600">{copy.breadcrumbSports}</Link></li>
          <li aria-hidden>/</li>
          <li className="text-gray-700">{entry.name[lang]}</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-8 pb-12">
        <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
          style={{ background: theme.light, color: theme.primaryDark }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: theme.primary }} />
          {category?.label[lang] ?? entry.name[lang]}
        </span>
        <h1 className="mt-4 text-3xl sm:text-5xl font-black text-gray-900 leading-[1.08] tracking-tight">
          {copy.h1}
        </h1>
        <p className="mt-5 text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">{copy.intro}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/register"
            className="inline-flex items-center gap-2 text-white font-bold px-6 py-3 rounded-xl shadow-sm"
            style={{ background: theme.primary }}>
            {copy.ctaPrimary} <ArrowRight size={16} />
          </Link>
          <Link href={`${prefix}/tournaments`}
            className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
            {copy.ctaSecondary}
          </Link>
        </div>
      </section>

      {/* Formats */}
      <section className="bg-gray-50 border-y border-gray-100 py-14">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{copy.formatsHeading}</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {formats.map(f => (
              <div key={f} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-black text-gray-900">{FORMAT_LABELS[f][lang]}</h3>
                  {subtype?.recommendedFormat === f && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: theme.light, color: theme.primaryDark }}>
                      {copy.recommended}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{FORMAT_DESCS[f][lang]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Match defaults — hard facts pulled from the sport definition */}
      {subtype && (
        <section className="max-w-5xl mx-auto px-4 py-14">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{copy.rulesHeading}</h2>
          <p className="mt-2 text-sm text-gray-500">{copy.rulesLead}</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {!subtype.hideDuration && (
              <div className="rounded-2xl border border-gray-100 p-4">
                <dt className="text-xs font-bold uppercase tracking-wider text-gray-400">{subtype.periodLabel[lang]}</dt>
                <dd className="mt-1 text-2xl font-black text-gray-900">{subtype.periods}</dd>
              </div>
            )}
            {!subtype.hideDuration && (
              <div className="rounded-2xl border border-gray-100 p-4">
                <dt className="text-xs font-bold uppercase tracking-wider text-gray-400">{subtype.durationLabel[lang]}</dt>
                <dd className="mt-1 text-2xl font-black text-gray-900">{subtype.duration} <span className="text-base font-bold text-gray-400">{L.min}</span></dd>
              </div>
            )}
            <div className="rounded-2xl border border-gray-100 p-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-gray-400">{L.points}</dt>
              <dd className="mt-1 text-2xl font-black text-gray-900">
                {subtype.pts.win} / {subtype.noDraw ? '—' : subtype.pts.draw}
              </dd>
            </div>
            {/* Result-only disciplines (chess, draughts) log no match events. */}
            {statNames.length > 0 && (
              <div className="rounded-2xl border border-gray-100 p-4">
                <dt className="text-xs font-bold uppercase tracking-wider text-gray-400">{L.tracked}</dt>
                <dd className="mt-1 text-sm font-bold text-gray-800 leading-snug">{statNames.join(', ')}</dd>
              </div>
            )}
          </dl>
          {subtype.scoreNote && (
            <p className="mt-4 text-sm text-gray-500">{subtype.scoreNote[lang]}</p>
          )}
        </section>
      )}

      {/* Features */}
      <section className="bg-[#030712] py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{copy.featuresHeading}</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {copy.features.map((f, i) => {
              const Icon = FEATURE_ICONS[i] ?? Check
              return (
                <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: theme.primary }}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <h3 className="font-black text-white mb-1.5">{f.title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed">{f.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{copy.stepsHeading}</h2>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2">
          {copy.steps.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white"
                style={{ background: theme.primary }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-black text-gray-900">{s.title}</h3>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Live tournaments in this sport */}
      <section className="bg-gray-50 border-y border-gray-100 py-14">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{copy.liveHeading}</h2>
          {list.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">{copy.liveEmpty}</p>
          ) : (
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {list.map(t => (
                <li key={t.id}>
                  <Link href={`/t/${t.slug ?? t.id}`}
                    className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-gray-100 px-5 py-4 hover:border-gray-200 transition-colors">
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: theme.light }}>
                        <Trophy size={14} style={{ color: theme.primaryDark }} />
                      </span>
                      <span className="font-bold text-gray-800 truncate">{t.name}</span>
                    </span>
                    <span className="text-xs font-bold text-gray-400 shrink-0">{L.open}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* FAQ — visible text backing the FAQPage markup */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{copy.faqHeading}</h2>
        <div className="mt-8 space-y-6">
          {copy.faq.map(item => (
            <div key={item.q}>
              <h3 className="font-black text-gray-900">{item.q}</h3>
              <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cross-links to the other disciplines */}
      <section className="border-t border-gray-100 py-14">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-lg font-black text-gray-900 tracking-tight">{copy.otherHeading}</h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {others.map(o => (
              <li key={o.slug}>
                <Link href={o.path}
                  className="inline-block text-sm font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-100 px-3 py-1.5 rounded-lg">
                  {o.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-16" style={{ background: theme.gradient }}>
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{copy.h1}</h2>
          <p className="mt-3 text-white/80 text-sm leading-relaxed">{copy.description}</p>
          <Link href="/register"
            className="mt-7 inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-7 py-3 rounded-xl shadow-sm">
            {copy.ctaPrimary} <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
