import Link from 'next/link'
import Image from 'next/image'
import { Check, ArrowRight, MessageCircle, Phone, Trophy, Zap, BarChart3, Share2, Download, Users } from 'lucide-react'

// ── Device frames ─────────────────────────────────────────────────────────────

function LaptopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative select-none">
      {/* Screen */}
      <div className="relative bg-[#1a1a1a] rounded-t-xl pt-2 px-2 shadow-2xl" style={{ aspectRatio: '16/10' }}>
        {/* Browser bar */}
        <div className="bg-[#2c2c2c] rounded-t-lg px-3 py-1.5 flex items-center gap-2 mb-0.5">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/80" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
            <div className="w-2 h-2 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 mx-3">
            <div className="bg-[#3a3a3a] rounded px-2 py-0.5 text-[9px] text-gray-400 text-center">
              tournable-app.vercel.app
            </div>
          </div>
        </div>
        {/* App content */}
        <div className="bg-white rounded-b-lg overflow-hidden h-[calc(100%-28px)]">
          {children}
        </div>
      </div>
      {/* Laptop base */}
      <div className="bg-[#2a2a2a] h-3 rounded-b-xl mx-0 shadow-xl" />
      <div className="bg-[#222] h-1.5 rounded-b-2xl mx-4 shadow-lg" />
    </div>
  )
}

function PhoneFrame({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`relative select-none mx-auto ${dark ? '' : ''}`} style={{ width: '200px' }}>
      <div className={`relative rounded-[32px] ${dark ? 'bg-[#1a1a1a]' : 'bg-[#111]'} p-2 shadow-2xl`}
        style={{ border: '2px solid #333' }}>
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-4 bg-[#111] rounded-full z-10" />
        {/* Screen */}
        <div className="bg-white rounded-[24px] overflow-hidden" style={{ minHeight: '360px' }}>
          {children}
        </div>
        {/* Home bar */}
        <div className="flex justify-center mt-2 mb-1">
          <div className="w-16 h-1 bg-gray-600 rounded-full" />
        </div>
      </div>
    </div>
  )
}

// ── App UI mockups (pixel-accurate to real code) ──────────────────────────────

function AppStandings() {
  const teams = [
    { r: 1, color: 'bg-emerald-500', init: 'ФА', name: 'FC Алматы', p: 8, w: 6, d: 1, l: 1, gf: 18, ga: 7, gd: '+11', pts: 19, form: ['W','W','W','D','W'] },
    { r: 2, color: 'bg-blue-500',    init: 'АС', name: 'Астана',     p: 8, w: 5, d: 2, l: 1, gf: 14, ga: 8, gd: '+6', pts: 17, form: ['W','D','W','W','D'] },
    { r: 3, color: 'bg-yellow-500',  init: 'КА', name: 'Кайрат',     p: 8, w: 3, d: 1, l: 4, gf: 11, ga: 14, gd: '-3', pts: 10, form: ['L','W','L','W','L'] },
    { r: 4, color: 'bg-purple-500',  init: 'ОР', name: 'Ордабасы',   p: 7, w: 2, d: 2, l: 3, gf: 9,  ga: 11, gd: '-2', pts: 8,  form: ['D','L','W','D','L'] },
    { r: 5, color: 'bg-orange-500',  init: 'ТО', name: 'Тобол',      p: 7, w: 1, d: 0, l: 6, gf: 5,  ga: 17, gd: '-12', pts: 3, form: ['L','L','L','W','L'] },
  ]
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-3 py-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
          <span className="text-white text-[10px] font-black">Л</span>
        </div>
        <div>
          <div className="text-[10px] font-black text-gray-900 leading-tight">Летний кубок 2025</div>
          <div className="text-[8px] text-emerald-600 font-medium">Круговой · 2 круга</div>
        </div>
        <span className="ml-auto text-[8px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">Активен</span>
      </div>
      {/* Tabs */}
      <div className="flex bg-gray-50 border-b border-gray-100 overflow-x-auto scrollbar-hide">
        {['Настройка','Матчи','Таблица','Плей-офф','Статистика'].map((t, i) => (
          <div key={t} className={`px-2.5 py-1.5 text-[8px] font-semibold whitespace-nowrap ${
            i === 2 ? 'bg-emerald-600 text-white rounded-md mx-0.5 my-0.5' : 'text-gray-500'
          }`}>{t}</div>
        ))}
      </div>
      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <div className="grid px-2 py-1 text-[7px] font-bold text-emerald-700 bg-emerald-50"
          style={{ gridTemplateColumns: '16px 1fr 18px 18px 18px 18px 40px 20px 20px 20px 22px' }}>
          <span className="text-center">#</span>
          <span>Команда</span>
          <span className="text-center">И</span>
          <span className="text-center">В</span>
          <span className="text-center">Н</span>
          <span className="text-center">П</span>
          <span className="text-center">Форма</span>
          <span className="text-center">ЗМ</span>
          <span className="text-center">ПМ</span>
          <span className="text-center">РМ</span>
          <span className="text-center font-black">О</span>
        </div>
        {teams.map((t, i) => (
          <div key={t.r} className={`grid px-2 py-1.5 items-center border-b border-gray-50 text-[7px] ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
            style={{ gridTemplateColumns: '16px 1fr 18px 18px 18px 18px 40px 20px 20px 20px 22px' }}>
            <span className="text-center font-bold text-gray-400">{t.r}</span>
            <div className="flex items-center gap-1 min-w-0">
              <div className={`w-4 h-4 rounded-full ${t.color} flex items-center justify-center text-white shrink-0`} style={{ fontSize: '5px', fontWeight: 900 }}>{t.init}</div>
              <span className="font-bold text-gray-900 truncate">{t.name}</span>
            </div>
            <span className="text-center text-gray-500">{t.p}</span>
            <span className="text-center text-emerald-600 font-medium">{t.w}</span>
            <span className="text-center text-gray-400">{t.d}</span>
            <span className="text-center text-red-400">{t.l}</span>
            <div className="flex gap-0.5 justify-center">
              {t.form.map((f, j) => (
                <span key={j} className={`w-3 h-3 rounded flex items-center justify-center text-white font-black ${f === 'W' ? 'bg-emerald-500' : f === 'D' ? 'bg-amber-400' : 'bg-red-500'}`} style={{ fontSize: '5px' }}>
                  {f === 'W' ? 'В' : f === 'D' ? 'Н' : 'П'}
                </span>
              ))}
            </div>
            <span className="text-center text-gray-500">{t.gf}</span>
            <span className="text-center text-gray-500">{t.ga}</span>
            <span className={`text-center font-bold ${t.gd.startsWith('+') ? 'text-emerald-600' : 'text-red-400'}`}>{t.gd}</span>
            <span className="text-center font-black text-emerald-700 text-[8px]">{t.pts}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AppLivePhone() {
  return (
    <div className="bg-gray-950 min-h-full flex flex-col pt-8">
      {/* Live badge */}
      <div className="flex justify-center mt-2 mb-3">
        <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 text-[9px] font-bold tracking-widest uppercase">Live</span>
        </div>
      </div>
      {/* Match info */}
      <div className="text-center px-4 mb-4">
        <div className="text-gray-500 text-[9px] font-medium uppercase tracking-wider mb-2">Тур 3 · Матч 2</div>
        <div className="flex items-center justify-center gap-3">
          <div className="text-center flex-1">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-black mx-auto mb-1" style={{ fontSize: '11px' }}>КА</div>
            <div className="text-white text-[10px] font-semibold leading-tight">Кайрат</div>
          </div>
          <div className="text-center">
            <div className="text-white font-black leading-none" style={{ fontSize: '38px' }}>2<span className="text-gray-500 mx-1">:</span>1</div>
            <div className="text-emerald-400 font-mono text-[10px] font-bold mt-1">43:17 ●</div>
          </div>
          <div className="text-center flex-1">
            <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black mx-auto mb-1" style={{ fontSize: '11px' }}>АС</div>
            <div className="text-white text-[10px] font-semibold leading-tight">Астана</div>
          </div>
        </div>
      </div>
      {/* Events */}
      <div className="bg-gray-900 rounded-t-2xl flex-1 px-3 pt-3 pb-1">
        <div className="text-gray-500 text-[8px] font-semibold uppercase tracking-wider mb-2">События</div>
        {[
          { icon: '⚽', min: "12'", name: 'А. Исмаилов', team: 'Кайрат', color: 'text-blue-400' },
          { icon: '⚽', min: "31'", name: 'Б. Джаксыбеков', team: 'Кайрат', color: 'text-blue-400' },
          { icon: '⚽', min: "38'", name: 'Е. Нурланов', team: 'Астана', color: 'text-emerald-400' },
          { icon: '🟨', min: "40'", name: 'М. Сейткали', team: 'Кайрат', color: 'text-yellow-400' },
        ].map((e, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-800 last:border-0">
            <span className="text-[10px]">{e.icon}</span>
            <span className="text-gray-500 font-mono text-[8px] w-6">{e.min}</span>
            <span className={`text-[9px] font-semibold ${e.color}`}>{e.name}</span>
            <span className="ml-auto text-gray-600 text-[8px]">{e.team}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AppPlayoffPhone() {
  return (
    <div className="bg-white min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-3 py-2 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-purple-500 flex items-center justify-center">
          <Trophy className="w-3 h-3 text-white" />
        </div>
        <span className="text-[10px] font-black text-gray-900">Кубок района</span>
        <span className="ml-auto text-[8px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">Активен</span>
      </div>
      {/* Tabs */}
      <div className="flex bg-gray-50 border-b border-gray-100 px-1 py-0.5 gap-0.5">
        {['Матчи','Таблица','Плей-офф','Стат.'].map((t, i) => (
          <div key={t} className={`px-2 py-1 text-[8px] font-semibold rounded ${i === 2 ? 'bg-emerald-600 text-white' : 'text-gray-400'}`}>{t}</div>
        ))}
      </div>
      {/* Bracket */}
      <div className="p-3">
        <div className="text-[8px] text-gray-400 font-semibold uppercase tracking-wider mb-2 text-center">1/2 финала</div>
        <div className="space-y-3">
          {/* Match 1 */}
          <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
            <div className="flex items-center px-2.5 py-2 border-b border-gray-100">
              <div className="flex items-center gap-1.5 flex-1">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black" style={{ fontSize: '7px' }}>ФА</div>
                <span className="text-[9px] font-bold text-gray-800">FC Алматы</span>
              </div>
              <span className="text-[11px] font-black text-emerald-700">3</span>
            </div>
            <div className="flex items-center px-2.5 py-2">
              <div className="flex items-center gap-1.5 flex-1">
                <div className="w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center text-white font-black" style={{ fontSize: '7px' }}>ТО</div>
                <span className="text-[9px] text-gray-400">Тобол</span>
              </div>
              <span className="text-[11px] font-bold text-gray-300">1</span>
            </div>
          </div>
          {/* Match 2 */}
          <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
            <div className="flex items-center px-2.5 py-2 border-b border-gray-100">
              <div className="flex items-center gap-1.5 flex-1">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white font-black" style={{ fontSize: '7px' }}>АС</div>
                <span className="text-[9px] font-bold text-gray-800">Астана</span>
              </div>
              <span className="text-[11px] font-black text-emerald-700">2</span>
            </div>
            <div className="flex items-center px-2.5 py-2">
              <div className="flex items-center gap-1.5 flex-1">
                <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-white font-black" style={{ fontSize: '7px' }}>КА</div>
                <span className="text-[9px] text-gray-400">Кайрат</span>
              </div>
              <span className="text-[11px] font-bold text-gray-300">0</span>
            </div>
          </div>
        </div>
        <div className="mt-3 text-center">
          <div className="text-[8px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Финал</div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
            <div className="text-[8px] text-emerald-600 font-semibold mb-1.5">Финалисты</div>
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black" style={{ fontSize: '7px' }}>ФА</div>
                <span className="text-[9px] font-bold text-emerald-700">FC Алматы</span>
              </div>
              <span className="text-gray-300 text-[10px]">vs</span>
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white font-black" style={{ fontSize: '7px' }}>АС</div>
                <span className="text-[9px] font-semibold text-gray-600">Астана</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AppDashboard() {
  const items = [
    { name: 'Летний кубок 2025', teams: 8, format: 'Круговой', active: true, color: 'bg-emerald-500', init: 'Л' },
    { name: 'Кубок района', teams: 12, format: 'Плей-офф', active: true, color: 'bg-purple-500', init: 'К' },
    { name: 'Чемпионат офиса', teams: 6, format: 'Круговой', active: false, color: 'bg-blue-500', init: 'Ч' },
  ]
  return (
    <div className="bg-gray-50 h-full">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center">
            <span className="text-white text-[8px] font-black">Т</span>
          </div>
          <span className="text-[11px] font-black text-emerald-700">TOURNABLE</span>
        </div>
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[9px] font-bold">А</div>
      </div>
      {/* Content */}
      <div className="px-3 py-3">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-black text-gray-800">Мои турниры</span>
          <div className="bg-emerald-600 text-white text-[8px] font-bold px-2 py-1 rounded-lg">+ Создать</div>
        </div>
        <div className="space-y-2">
          {items.map(t => (
            <div key={t.name} className="bg-white rounded-xl px-3 py-2.5 border border-gray-100 shadow-sm flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl ${t.color} flex items-center justify-center text-white font-black shrink-0`} style={{ fontSize: '12px' }}>{t.init}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-gray-800 truncate">{t.name}</div>
                <div className="text-[8px] text-gray-400">{t.teams} команд · {t.format}</div>
              </div>
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${t.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {t.active ? 'Идёт' : 'Завершён'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Pricing ───────────────────────────────────────────────────────────────────

const plans = [
  {
    name: 'Бесплатно',
    price: '0',
    sub: 'Навсегда бесплатно',
    features: [
      'До 3 турниров за всё время',
      'До 16 команд в каждом',
      'Круговой и плей-офф форматы',
      'Публичная ссылка для просмотра',
      'Статистика: голы, ассисты, карточки',
      'Логотипы команд и турниров',
      'Экспорт PDF и PNG',
    ],
    cta: 'Начать бесплатно',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Платный',
    price: '4 990',
    currency: '₸',
    period: '/ мес',
    annual: '−30% при оплате за год',
    sub: 'Для серьёзных организаторов',
    features: [
      'Бесконечные турниры',
      'До 64 команд в каждом',
      'Онлайн-табло в реальном времени',
      'До 3 соредакторов',
      'Все форматы (Лига чемпионов, Чемпионат мира, кастомные…)',
      'Приоритетная поддержка',
      'Всё из бесплатного плана',
    ],
    cta: 'Попробовать',
    href: '/register?plan=pro',
    highlight: true,
  },
]

// ── Main component ────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Tournable" width={32} height={32} className="w-8 h-8" />
            <span className="font-black text-lg tracking-tight text-emerald-700">TOURNABLE</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Возможности</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Тарифы</a>
            <a href="#contact" className="hover:text-gray-900 transition-colors">Контакты</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 transition-colors hidden sm:block">
              Войти
            </Link>
            <Link href="/register" className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
              Начать бесплатно
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-16 lg:pt-20 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black leading-[1.08] tracking-tight text-gray-900 mb-5">
              Управляйте<br />
              турниром.<br />
              <span className="text-emerald-600">Онлайн. Вместе.</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-8 max-w-md">
              Создайте расписание за 30 секунд, ведите счёт в реальном времени и делитесь результатами — участники следят онлайн без регистрации.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/register" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2">
                Создать турнир бесплатно
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium px-5 py-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                Войти
              </Link>
            </div>
          </div>
          {/* Laptop mockup */}
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-br from-emerald-50 to-transparent rounded-3xl -z-10" />
            <LaptopFrame>
              <AppStandings />
            </LaptopFrame>
          </div>
        </div>
      </section>

      {/* ── Live section — dark, WOW ── */}
      <section className="bg-gray-950 py-20 lg:py-28 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Phones */}
            <div className="flex justify-center gap-4 lg:gap-6 order-2 lg:order-1">
              <div className="mt-8">
                <PhoneFrame dark>
                  <AppLivePhone />
                </PhoneFrame>
              </div>
              <div className="-mt-4">
                <PhoneFrame dark>
                  <AppPlayoffPhone />
                </PhoneFrame>
              </div>
            </div>
            {/* Text */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                Онлайн-табло в реальном времени
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4 tracking-tight">
                Счёт обновляется<br />
                <span className="text-emerald-400">мгновенно</span>
              </h2>
              <p className="text-gray-400 text-base leading-relaxed mb-6">
                Ведите матч прямо с телефона. Голы, ассисты, карточки — все участники видят обновления в реальном времени по публичной ссылке, без регистрации.
              </p>
              <ul className="space-y-3">
                {[
                  'Таймер матча с накопленным временем',
                  'Голы, ассисты, жёлтые и красные карточки',
                  'Публичная ссылка — без регистрации для зрителей',
                  'Плей-офф сетка обновляется автоматически',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dashboard preview ── */}
      <section className="bg-gray-50 py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 leading-tight">
                Все турниры<br />в одном месте
              </h2>
              <p className="text-gray-500 text-base leading-relaxed mb-6">
                Дашборд показывает все ваши турниры. Создавайте новые за 30 секунд — просто задайте название, формат и добавьте команды.
              </p>
              <ul className="space-y-3">
                {[
                  'Круговой, плей-офф и комбинированные форматы',
                  'Автоматическое расписание матчей',
                  'Логотипы для каждой команды',
                  'Экспорт таблиц и статистики в PDF и PNG',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-emerald-50 rounded-3xl -z-10" />
              <PhoneFrame>
                <AppDashboard />
              </PhoneFrame>
              <div className="absolute -top-3 -right-3 bg-white rounded-2xl shadow-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-800">Турнир завершён</div>
                    <div className="text-[10px] text-emerald-600 font-semibold">🏆 Победитель: FC Алматы</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features strip ── */}
      <section id="features" className="border-y border-gray-100 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
            {[
              { icon: Zap,         label: 'Расписание\nавтоматически' },
              { icon: BarChart3,   label: 'Таблица\nи статистика' },
              { icon: Trophy,      label: 'Плей-офф\nсетка' },
              { icon: Share2,      label: 'Публичная\nссылка' },
              { icon: Users,       label: 'Соредакторы\nпо приглашению' },
              { icon: Download,    label: 'Экспорт\nPDF и PNG' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="font-semibold text-xs text-gray-700 leading-snug whitespace-pre-line">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">Как это работает</h2>
            <p className="text-gray-500 text-base">Три шага — и турнир готов</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Создай турнир', desc: 'Укажи название, выбери формат — круговой или плей-офф — и добавь команды. Расписание сгенерируется автоматически.' },
              { step: '02', title: 'Веди счёт в реальном времени', desc: 'Открой онлайн-табло прямо на матче. Вводи голы и карточки — таблица обновляется мгновенно у всех участников.' },
              { step: '03', title: 'Поделись с участниками', desc: 'Отправь публичную ссылку — команды и болельщики следят за результатами без регистрации, с любого устройства.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col gap-3">
                <div className="text-5xl font-black text-emerald-100 leading-none">{step}</div>
                <h3 className="font-bold text-lg text-gray-900">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-gray-50 py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">Простые цены</h2>
            <p className="text-gray-500 text-base">Начни бесплатно — перейди на платный когда понадобится</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 items-stretch max-w-2xl mx-auto">
            {plans.map(plan => (
              <div key={plan.name} className={`relative flex flex-col rounded-2xl p-7 ${
                plan.highlight
                  ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 ring-2 ring-emerald-600'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-900 text-emerald-100 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                      Самый популярный
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <div className={`text-sm font-semibold mb-2 ${plan.highlight ? 'text-emerald-200' : 'text-gray-500'}`}>
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-1 flex-wrap">
                    <span className="text-4xl font-black">{plan.price}</span>
                    {plan.currency && <span className={`text-xl font-bold ${plan.highlight ? 'text-emerald-200' : 'text-gray-400'}`}>{plan.currency}</span>}
                    {plan.period && <span className={`text-sm ${plan.highlight ? 'text-emerald-200' : 'text-gray-400'}`}>{plan.period}</span>}
                  </div>
                  {plan.annual && (
                    <div className={`text-xs mt-1 font-semibold ${plan.highlight ? 'text-emerald-200' : 'text-emerald-600'}`}>
                      {plan.annual}
                    </div>
                  )}
                  <div className={`text-sm mt-1 ${plan.highlight ? 'text-emerald-200' : 'text-gray-400'}`}>
                    {plan.sub}
                  </div>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? 'text-emerald-200' : 'text-emerald-500'}`} />
                      <span className={plan.highlight ? 'text-emerald-50' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={`block text-center font-semibold px-5 py-3 rounded-xl transition-colors ${
                  plan.highlight
                    ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-20 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">Остались вопросы?</h2>
          <p className="text-gray-500 text-base mb-10">Напишите напрямую — отвечаю быстро</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://wa.me/message/YHLE2IFII4MSJ1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bc5a] text-white font-semibold px-8 py-4 rounded-2xl transition-colors shadow-lg shadow-green-200"
            >
              <MessageCircle className="w-5 h-5" />
              Написать в WhatsApp
            </a>
            <a
              href="tel:+77064092021"
              className="flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-4 rounded-2xl transition-colors"
            >
              <Phone className="w-5 h-5" />
              +7 (706) 409-20-21
            </a>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-emerald-600 py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">
            Готовы провести первый турнир?
          </h2>
          <p className="text-emerald-100 text-base mb-8">
            Регистрация — меньше минуты. Карта не нужна.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-3.5 rounded-xl transition-colors text-base">
            Начать бесплатно
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Tournable" width={24} height={24} className="w-6 h-6" />
            <span className="font-bold text-emerald-700">TOURNABLE</span>
          </div>
          <span>© 2026 Tournable. Все права защищены.</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-gray-600 transition-colors">Войти</Link>
            <Link href="/register" className="hover:text-gray-600 transition-colors">Регистрация</Link>
            <a href="#contact" className="hover:text-gray-600 transition-colors">Контакты</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
