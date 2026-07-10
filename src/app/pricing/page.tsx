import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { Check, X, Zap, Trophy, Star, ArrowRight, Building2 } from 'lucide-react'
import type { Metadata } from 'next'

type Lang = 'ru' | 'kz' | 'en'
type Feature = { text: string; included: boolean }
type FaqItem = { q: string; a: string }

const T = {
  ru: {
    metaTitle: 'Тарифы — Tournable',
    metaDescription: 'Выберите подходящий план: бесплатный Старт или профессиональный Про с Табло и неограниченными турнирами.',
    login: 'Войти',
    startFree: 'Начать бесплатно',
    badge: 'Тарифы',
    heroTitle: 'Простые и честные цены',
    heroSubtitle: 'Начните бесплатно. Переходите на Про, когда готовы к большему.',
    freeFeatures: [
      { text: '1 активный турнир', included: true },
      { text: 'До 16 команд в турнире', included: true },
      { text: 'Круговой и плей-офф форматы', included: true },
      { text: 'Публичная страница для участников', included: true },
      { text: 'Статистика игроков и команд', included: true },
      { text: 'Табло в реальном времени', included: true },
      { text: 'Экспорт PDF и PNG', included: true },
      { text: 'Неограниченные турниры', included: false },
      { text: 'До 64 команд в турнире', included: false },
      { text: 'До 3 соредакторов', included: false },
    ] as Feature[],
    proFeatures: [
      { text: 'Неограниченные турниры', included: true },
      { text: 'До 64 команд в турнире', included: true },
      { text: 'Все форматы (круговой, плей-офф, групповой)', included: true },
      { text: 'Публичная страница для участников', included: true },
      { text: 'Статистика игроков и команд', included: true },
      { text: 'Экспорт PDF и PNG', included: true },
      { text: 'Табло в реальном времени', included: true },
      { text: 'До 3 соредакторов', included: true },
      { text: 'Приоритетная поддержка', included: true },
    ] as Feature[],
    enterpriseFeatures: [
      { text: 'Всё из тарифа Про', included: true },
      { text: 'Чемпионаты с сезонами', included: true },
      { text: 'Публичные страницы чемпионата', included: true },
      { text: 'Профили команд и игроков', included: true },
      { text: 'Составы и история сезонов', included: true },
      { text: 'Таблица бомбардиров по сезонам', included: true },
      { text: 'Выделенная поддержка', included: true },
    ] as Feature[],
    faq: [
      {
        q: 'Можно ли сменить план позже?',
        a: 'Да. Начните бесплатно, а на Про или Enterprise можно перейти в любой момент — оплата картой прямо на сайте, доступ открывается сразу после оплаты.',
      },
      {
        q: 'Что даёт Enterprise?',
        a: 'Чемпионаты с сезонами и постоянными командами, профили команд и игроков, составы к матчам, углублённая статистика и публичные страницы, которые находятся в поисковиках.',
      },
      {
        q: 'Что происходит, когда заканчивается подписка?',
        a: 'Ваши турниры и данные остаются целыми. До продления ограничиваются только платные возможности — всё созданное никуда не пропадает.',
      },
      {
        q: 'Как оплатить?',
        a: 'Банковской картой прямо на сайте — подписка активируется автоматически и продлевается сама. Нужен счёт на организацию? Напишите нам в WhatsApp.',
      },
      {
        q: 'Есть ли скидка на год?',
        a: 'Да. Годовая подписка выгоднее на 25%: Про — 44 990 ₸/год, Enterprise — 349 990 ₸/год.',
      },
    ] as FaqItem[],
    planFree: 'Старт',
    planFreePrice: '0 ₸',
    planFreeCaption: 'Всегда бесплатно',
    planPro: 'Про',
    recommended: 'Рекомендуем',
    planProPrice: '4 990 ₸',
    perMonth: '/ месяц',
    planProCaption: '44 990 ₸/год · скидка −25%',
    planEnterprise: 'Enterprise',
    planEnterprisePrice: 'от 39 990 ₸',
    planEnterpriseCaption: '349 990 ₸/год · скидка −25%',
    ctaGoPro: 'Перейти на Про',
    ctaGoEnterprise: 'Подключить Enterprise',
    ctaContactUs: 'Связаться с нами',
    ctaWhatsApp: 'Оформить в WhatsApp',
    faqTitle: 'Частые вопросы',
    ctaTitle: 'Готовы провести турнир?',
    ctaSubtitle: 'Зарегистрируйтесь бесплатно и создайте первый турнир за 2 минуты.',
    footerLegal: '© 2026 Tournable. Все права защищены.',
    footerPrivacy: 'Конфиденциальность',
    footerTerms: 'Условия',
    footerDashboard: 'Кабинет',
  },
  kz: {
    metaTitle: 'Тарифтер — Tournable',
    metaDescription: 'Қажетті жоспарды таңдаңыз: тегін Старт немесе тақтасы мен шексіз турнирлері бар кәсіби Про.',
    login: 'Кіру',
    startFree: 'Тегін бастау',
    badge: 'Тарифтер',
    heroTitle: 'Қарапайым және әділ бағалар',
    heroSubtitle: 'Тегін бастаңыз. Дайын болғанда Про-ға өтіңіз.',
    freeFeatures: [
      { text: '1 белсенді турнир', included: true },
      { text: 'Турнирде 16 командаға дейін', included: true },
      { text: 'Дөңгелек және плей-офф форматтары', included: true },
      { text: 'Қатысушыларға арналған жалпыға ортақ бет', included: true },
      { text: 'Ойыншылар мен командалар статистикасы', included: true },
      { text: 'Нақты уақыттағы тақта', included: true },
      { text: 'PDF және PNG экспорты', included: true },
      { text: 'Шексіз турнирлер', included: false },
      { text: 'Турнирде 64 командаға дейін', included: false },
      { text: '3 соредакторға дейін', included: false },
    ] as Feature[],
    proFeatures: [
      { text: 'Шексіз турнирлер', included: true },
      { text: 'Турнирде 64 командаға дейін', included: true },
      { text: 'Барлық форматтар (дөңгелек, плей-офф, топтық)', included: true },
      { text: 'Қатысушыларға арналған жалпыға ортақ бет', included: true },
      { text: 'Ойыншылар мен командалар статистикасы', included: true },
      { text: 'PDF және PNG экспорты', included: true },
      { text: 'Нақты уақыттағы тақта', included: true },
      { text: '3 соредакторға дейін', included: true },
      { text: 'Басым қолдау', included: true },
    ] as Feature[],
    enterpriseFeatures: [
      { text: 'Про тарифінің бәрі', included: true },
      { text: 'Маусымдары бар чемпионаттар', included: true },
      { text: 'Чемпионаттың жалпыға ортақ беттері', included: true },
      { text: 'Команда мен ойыншы профильдері', included: true },
      { text: 'Құрамдар және маусым тарихы', included: true },
      { text: 'Маусым бойынша бомбардирлер кестесі', included: true },
      { text: 'Арнайы қолдау', included: true },
    ] as Feature[],
    faq: [
      {
        q: 'Жоспарды кейін ауыстыруға бола ма?',
        a: 'Иә. Тегін бастаңыз, ал Про немесе Enterprise-ке кез келген уақытта өтуге болады — төлем картамен тікелей сайтта, қолжетімділік бірден ашылады.',
      },
      {
        q: 'Enterprise не береді?',
        a: 'Маусымдары мен тұрақты командалары бар чемпионаттар, команда мен ойыншы профильдері, матч құрамдары, тереңдетілген статистика және іздеу жүйелерінде табылатын жалпыға ортақ беттер.',
      },
      {
        q: 'Жазылым аяқталғанда не болады?',
        a: 'Турнирлеріңіз бен деректеріңіз сақталады. Жаңартқанға дейін тек ақылы мүмкіндіктер шектеледі — жасалғанның бәрі орнында қалады.',
      },
      {
        q: 'Қалай төлеуге болады?',
        a: 'Банк картасымен тікелей сайтта — жазылым автоматты белсендіріледі және өздігінен ұзарады. Ұйымға шот керек пе? WhatsApp-та жазыңыз.',
      },
      {
        q: 'Жылдық жеңілдік бар ма?',
        a: 'Иә. Жылдық жазылым 25% тиімді: Про — 44 990 ₸/жыл, Enterprise — 349 990 ₸/жыл.',
      },
    ] as FaqItem[],
    planFree: 'Старт',
    planFreePrice: '0 ₸',
    planFreeCaption: 'Әрқашан тегін',
    planPro: 'Про',
    recommended: 'Ұсынамыз',
    planProPrice: '4 990 ₸',
    perMonth: '/ ай',
    planProCaption: '44 990 ₸/жыл · −25% жеңілдік',
    planEnterprise: 'Enterprise',
    planEnterprisePrice: '39 990 ₸-дан',
    planEnterpriseCaption: '349 990 ₸/жыл · −25% жеңілдік',
    ctaGoPro: 'Про-ға өту',
    ctaGoEnterprise: 'ҚОСУ',
    ctaContactUs: 'Бізбен байланысу',
    ctaWhatsApp: 'WhatsApp арқылы рәсімдеу',
    faqTitle: 'Жиі қойылатын сұрақтар',
    ctaTitle: 'Турнир өткізуге дайынсыз ба?',
    ctaSubtitle: 'Тегін тіркеліп, 2 минутта алғашқы турнирді жасаңыз.',
    footerLegal: '© 2026 Tournable. Барлық құқықтар қорғалған.',
    footerPrivacy: 'Құпиялылық',
    footerTerms: 'Шарттар',
    footerDashboard: 'Кабинет',
  },
  en: {
    metaTitle: 'Pricing — Tournable',
    metaDescription: 'Choose the right plan: the free Starter or the professional Pro plan with a real-time scoreboard and unlimited tournaments.',
    login: 'Sign In',
    startFree: 'Start free',
    badge: 'Pricing',
    heroTitle: 'Simple, honest pricing',
    heroSubtitle: 'Start free. Upgrade to Pro when you are ready for more.',
    freeFeatures: [
      { text: '1 active tournament', included: true },
      { text: 'Up to 16 teams per tournament', included: true },
      { text: 'Round-robin and playoff formats', included: true },
      { text: 'Public page for participants', included: true },
      { text: 'Player and team statistics', included: true },
      { text: 'Real-time scoreboard', included: true },
      { text: 'PDF and PNG export', included: true },
      { text: 'Unlimited tournaments', included: false },
      { text: 'Up to 64 teams per tournament', included: false },
      { text: 'Up to 3 co-editors', included: false },
    ] as Feature[],
    proFeatures: [
      { text: 'Unlimited tournaments', included: true },
      { text: 'Up to 64 teams per tournament', included: true },
      { text: 'All formats (round-robin, playoff, group stage)', included: true },
      { text: 'Public page for participants', included: true },
      { text: 'Player and team statistics', included: true },
      { text: 'PDF and PNG export', included: true },
      { text: 'Real-time scoreboard', included: true },
      { text: 'Up to 3 co-editors', included: true },
      { text: 'Priority support', included: true },
    ] as Feature[],
    enterpriseFeatures: [
      { text: 'Everything in Pro', included: true },
      { text: 'Championships with seasons', included: true },
      { text: 'Public championship pages', included: true },
      { text: 'Team and player profiles', included: true },
      { text: 'Lineups and season history', included: true },
      { text: 'Top scorers table by season', included: true },
      { text: 'Dedicated support', included: true },
    ] as Feature[],
    faq: [
      {
        q: 'Can I change plans later?',
        a: 'Yes. Start free and upgrade to Pro or Enterprise any time — pay by card right on the site, access unlocks immediately.',
      },
      {
        q: 'What does Enterprise include?',
        a: 'Championships with seasons and persistent teams, team and player profiles, match lineups, advanced statistics and public pages that show up in search engines.',
      },
      {
        q: 'What happens when my subscription ends?',
        a: 'Your tournaments and data stay intact. Only the paid features are limited until you renew — nothing you created is lost.',
      },
      {
        q: 'How do I pay?',
        a: 'By bank card right on the site — the subscription activates automatically and renews itself. Need an invoice for your organisation? Message us on WhatsApp.',
      },
      {
        q: 'Is there an annual discount?',
        a: 'Yes. Annual billing saves 25%: Pro — 44,990 ₸/yr, Enterprise — 349,990 ₸/yr.',
      },
    ] as FaqItem[],
    planFree: 'Starter',
    planFreePrice: '0 ₸',
    planFreeCaption: 'Always free',
    planPro: 'Pro',
    recommended: 'Recommended',
    planProPrice: '4,990 ₸',
    perMonth: '/ month',
    planProCaption: '44,990 ₸/yr · −25% discount',
    planEnterprise: 'Enterprise',
    planEnterprisePrice: 'from 39,990 ₸',
    planEnterpriseCaption: '349,990 ₸/yr · −25% discount',
    ctaGoPro: 'Go Pro',
    ctaGoEnterprise: 'Get Enterprise',
    ctaContactUs: 'Contact us',
    ctaWhatsApp: 'Order via WhatsApp',
    faqTitle: 'Frequently asked questions',
    ctaTitle: 'Ready to run a tournament?',
    ctaSubtitle: 'Sign up for free and create your first tournament in 2 minutes.',
    footerLegal: '© 2026 Tournable. All rights reserved.',
    footerPrivacy: 'Privacy',
    footerTerms: 'Terms',
    footerDashboard: 'Dashboard',
  },
} as const

async function getLang(): Promise<Lang> {
  const cookieStore = await cookies()
  const langRaw = cookieStore.get('lang')?.value ?? 'ru'
  return (['ru', 'kz', 'en'] as Lang[]).includes(langRaw as Lang) ? (langRaw as Lang) : 'ru'
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang()
  const tx = T[lang]
  return {
    title: tx.metaTitle,
    description: tx.metaDescription,
  }
}

export default async function PricingPage() {
  const lang = await getLang()
  const tx = T[lang]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background: 'linear-gradient(90deg,#047857,#059669)', boxShadow: '0 2px 20px rgba(4,120,87,.25)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-white.png" alt="Tournable" width={32} height={32} className="w-8 h-8 object-contain" />
            <span className="font-black text-white text-base" style={{ letterSpacing: '-.02em' }}>TOURNABLE</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-emerald-100 hover:text-white transition-colors"
            >
              {tx.login}
            </Link>
            <Link
              href="/register"
              className="text-sm font-black bg-white text-emerald-700 px-4 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors shadow-sm"
            >
              {tx.startFree}
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20 text-center px-4">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">{tx.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4" style={{ letterSpacing: '-.03em' }}>
            {tx.heroTitle}
          </h1>
          <p className="text-gray-500 text-lg max-w-lg mx-auto">
            {tx.heroSubtitle}
          </p>
        </section>

        {/* ── Plans ──────────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">

            {/* Free */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="font-black text-lg text-gray-900">{tx.planFree}</span>
                </div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-black text-gray-900">{tx.planFreePrice}</span>
                </div>
                <p className="text-sm text-gray-400">{tx.planFreeCaption}</p>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {tx.freeFeatures.map(f => (
                  <li key={f.text} className="flex items-start gap-2.5 text-sm">
                    {f.included ? (
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                    )}
                    <span className={f.included ? 'text-gray-700' : 'text-gray-400'}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-black py-3 rounded-xl transition-colors text-sm"
              >
                {tx.startFree}
              </Link>
            </div>

            {/* Pro */}
            <div
              className="rounded-2xl p-8 flex flex-col shadow-xl relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg,#047857,#10b981)' }}
            >
              {/* Recommended badge */}
              <div className="absolute top-4 right-4">
                <span className="text-[10px] font-black bg-yellow-400 text-yellow-900 px-2.5 py-1 rounded-full uppercase tracking-wide">
                  {tx.recommended}
                </span>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" fill="currentColor" />
                  </div>
                  <span className="font-black text-lg text-white">{tx.planPro}</span>
                </div>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-4xl font-black text-white">{tx.planProPrice}</span>
                  <span className="text-emerald-200 text-sm mb-1.5">{tx.perMonth}</span>
                </div>
                <p className="text-emerald-200 text-sm">{tx.planProCaption}</p>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {tx.proFeatures.map(f => (
                  <li key={f.text} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                    <span className="text-emerald-50">{f.text}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 text-emerald-700 font-black py-3 rounded-xl transition-colors text-sm shadow-md"
              >
                {tx.ctaGoPro}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Enterprise */}
            <div id="enterprise" className="bg-white rounded-2xl border-2 border-purple-200 shadow-sm p-8 flex flex-col relative overflow-hidden scroll-mt-20">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-700" />
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-black text-lg text-gray-900">{tx.planEnterprise}</span>
                </div>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-3xl font-black text-gray-900">{tx.planEnterprisePrice}</span>
                  <span className="text-gray-400 text-sm mb-1">{tx.perMonth}</span>
                </div>
                <p className="text-sm text-gray-400">{tx.planEnterpriseCaption}</p>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {tx.enterpriseFeatures.map(f => (
                  <li key={f.text} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-gray-700">{f.text}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/checkout/enterprise"
                className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-black py-3 rounded-xl transition-colors text-sm"
              >
                {tx.ctaGoEnterprise}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-24">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-10" style={{ letterSpacing: '-.02em' }}>
            {tx.faqTitle}
          </h2>
          <div className="space-y-4">
            {tx.faq.map(item => (
              <div key={item.q} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-black text-gray-900 mb-2 text-sm">{item.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────────── */}
        <section className="pb-24 px-4">
          <div
            className="max-w-2xl mx-auto rounded-2xl p-10 text-center text-white"
            style={{ background: 'linear-gradient(135deg,#047857,#10b981)' }}
          >
            <h2 className="text-2xl font-black mb-3" style={{ letterSpacing: '-.02em' }}>
              {tx.ctaTitle}
            </h2>
            <p className="text-emerald-200 text-sm mb-8 max-w-sm mx-auto">
              {tx.ctaSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-emerald-700 font-black px-7 py-3 rounded-xl hover:bg-emerald-50 transition-colors text-sm shadow-md"
              >
                {tx.startFree}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="https://wa.me/message/YHLE2IFII4MSJ1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/40 text-white font-bold px-7 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
              >
                {tx.ctaContactUs}
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>{tx.footerLegal}</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">{tx.footerPrivacy}</Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">{tx.footerTerms}</Link>
            <Link href="/dashboard" className="hover:text-gray-600 transition-colors">{tx.footerDashboard}</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
