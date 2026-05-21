import Link from 'next/link'
import { Trophy, Zap, Users, Share2, BarChart3, Timer, Download, Check, ArrowRight } from 'lucide-react'

// ── Mock UI components ────────────────────────────────────────────────────────

function BrowserFrame({ children, url }: { children: React.ReactNode; url: string }) {
  return (
    <div className="rounded-xl shadow-2xl overflow-hidden border border-gray-200 bg-white select-none">
      <div className="bg-gray-100 px-3 py-2 flex items-center gap-2.5 border-b border-gray-200">
        <div className="flex gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded px-2 py-0.5 text-[10px] text-gray-400 text-center border border-gray-200 truncate">
            {url}
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}

function MockDashboard() {
  const tournaments = [
    { name: 'Летний кубок 2025', teams: 8, format: 'Круговой', status: 'Идёт', color: 'bg-emerald-500' },
    { name: 'Чемпионат офиса', teams: 6, format: 'Плей-офф', status: 'Завершён', color: 'bg-blue-500' },
    { name: 'Кубок района', teams: 12, format: 'Круговой', status: 'Идёт', color: 'bg-purple-500' },
  ]
  return (
    <div className="p-4 bg-gray-50 space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-gray-800">Мои турниры</span>
        <div className="bg-emerald-600 text-white text-xs px-2.5 py-1 rounded-lg font-medium">+ Создать</div>
      </div>
      {tournaments.map((t) => (
        <div key={t.name} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className={`w-9 h-9 rounded-xl ${t.color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
            {t.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-800 truncate">{t.name}</div>
            <div className="text-[10px] text-gray-400">{t.teams} команд · {t.format}</div>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            t.status === 'Идёт' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}>{t.status}</span>
        </div>
      ))}
    </div>
  )
}

function MockLiveBoard() {
  return (
    <div className="p-4 bg-gray-50">
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-center gap-1 mb-4">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-red-500 font-semibold tracking-widest uppercase">Live</span>
        </div>
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mx-auto mb-1">KC</div>
            <div className="text-[11px] font-semibold text-gray-700">Кайрат</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-gray-900 tabular-nums">2 — 1</div>
            <div className="text-emerald-600 font-mono text-[11px] font-bold mt-1">34:21 ●</div>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold mx-auto mb-1">AS</div>
            <div className="text-[11px] font-semibold text-gray-700">Астана</div>
          </div>
        </div>
        <div className="border-t pt-3 space-y-1.5">
          {[
            ['⚽', '12\'', 'А. Исмаилов', 'Кайрат'],
            ['⚽', '28\'', 'Б. Джаксыбеков', 'Кайрат'],
            ['⚽', '33\'', 'Е. Нурланов', 'Астана'],
          ].map(([icon, time, player, team], i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] text-gray-500">
              <span>{icon}</span>
              <span className="font-mono text-gray-400 w-7">{time}</span>
              <span className="font-medium text-gray-700">{player}</span>
              <span className="ml-auto text-gray-400">{team}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MockStandings() {
  const teams = [
    { rank: 1, initials: 'FA', name: 'FC Алматы', color: 'bg-emerald-500', p: 8, w: 6, d: 1, l: 1, pts: 19 },
    { rank: 2, initials: 'AS', name: 'Астана FC', color: 'bg-blue-500', p: 8, w: 5, d: 2, l: 1, pts: 17 },
    { rank: 3, initials: 'KC', name: 'Кайрат', color: 'bg-yellow-500', p: 8, w: 3, d: 1, l: 4, pts: 10 },
    { rank: 4, initials: 'TB', name: 'Тобол', color: 'bg-red-400', p: 8, w: 1, d: 0, l: 7, pts: 3 },
  ]
  return (
    <div className="p-4 bg-gray-50">
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="grid grid-cols-[20px,1fr,28px,28px,28px,32px] gap-x-2 px-3 py-2 text-[10px] font-semibold text-gray-400 border-b">
          <span>#</span><span>Команда</span><span className="text-center">И</span><span className="text-center">В</span><span className="text-center">П</span><span className="text-center">О</span>
        </div>
        {teams.map((t) => (
          <div key={t.rank} className={`grid grid-cols-[20px,1fr,28px,28px,28px,32px] gap-x-2 px-3 py-2.5 items-center border-b last:border-0 ${t.rank === 1 ? 'bg-emerald-50' : ''}`}>
            <span className="text-[10px] text-gray-400">{t.rank}</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <div className={`w-5 h-5 rounded-full ${t.color} flex items-center justify-center text-white text-[8px] font-bold shrink-0`}>{t.initials}</div>
              <span className="text-[11px] font-medium text-gray-800 truncate">{t.name}</span>
            </div>
            <span className="text-[10px] text-gray-400 text-center">{t.p}</span>
            <span className="text-[10px] text-emerald-600 font-medium text-center">{t.w}</span>
            <span className="text-[10px] text-red-400 text-center">{t.l}</span>
            <span className={`text-[11px] font-bold text-center ${t.rank === 1 ? 'text-emerald-600' : 'text-gray-800'}`}>{t.pts}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockBracket() {
  return (
    <div className="p-4 bg-gray-50">
      <div className="text-[10px] text-center text-gray-400 font-semibold tracking-widest uppercase mb-3">Плей-офф сетка</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 space-y-1.5">
          <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[7px] font-bold">FA</div>
                <span className="text-[10px] font-semibold text-gray-800">FC Алматы</span>
              </div>
              <span className="text-[11px] font-black text-emerald-600">3</span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-2 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-white text-[7px] font-bold">TB</div>
                <span className="text-[10px] text-gray-400">Тобол</span>
              </div>
              <span className="text-[11px] font-bold text-gray-300">1</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-3 border-t border-r border-gray-200 h-[18px] -mb-0.5" />
          <div className="w-3 border-b border-r border-gray-200 h-[18px] -mt-0.5" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[7px] font-bold">AS</div>
                <span className="text-[10px] font-semibold text-gray-800">Астана</span>
              </div>
              <span className="text-[11px] font-black text-blue-600">2</span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-2 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-white text-[7px] font-bold">KC</div>
                <span className="text-[10px] text-gray-400">Кайрат</span>
              </div>
              <span className="text-[11px] font-bold text-gray-300">0</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-3 border-t border-r border-gray-200 h-[18px] -mb-0.5" />
          <div className="w-3 border-b border-r border-gray-200 h-[18px] -mt-0.5" />
        </div>
        <div className="flex-1">
          <div className="bg-emerald-50 rounded-lg p-2.5 border border-emerald-200">
            <div className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wider mb-1">Финал</div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[7px] font-bold">FA</div>
              <span className="text-[10px] font-bold text-emerald-700">FC Алматы</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 opacity-60">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[7px] font-bold">AS</div>
              <span className="text-[10px] text-gray-500">Астана FC</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Pricing data ──────────────────────────────────────────────────────────────

const plans = [
  {
    name: 'Бесплатно',
    price: '0',
    period: '',
    description: 'Попробуй без регистрации карты',
    features: ['До 3 турниров', 'До 16 команд', 'Круговой и плей-офф форматы', 'Публичная ссылка для участников'],
    cta: 'Начать бесплатно',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '9',
    period: '/ мес',
    description: 'Для организаторов и клубов',
    features: [
      'До 20 турниров',
      'До 64 команд',
      'Логотипы команд и турниров',
      'Онлайн-табло в реальном времени',
      'Статистика: голы, ассисты, карточки',
      'Экспорт PDF и PNG',
      'До 5 соредакторов',
    ],
    cta: 'Попробовать Pro',
    href: '/register?plan=pro',
    highlight: true,
  },
  {
    name: 'Team',
    price: '24',
    period: '/ мес',
    description: 'Для федераций и лиг',
    features: [
      'Неограниченно турниров',
      'Без ограничений по командам',
      'До 15 соредакторов',
      'Кастомный брендинг',
      'Приоритетная поддержка',
      'Всё из Pro',
    ],
    cta: 'Связаться',
    href: 'mailto:hello@tournable.app',
    highlight: false,
  },
]

// ── Main landing page ─────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
            <span className="font-black text-lg tracking-tight text-emerald-700">TOURNABLE</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Возможности</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Цены</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 transition-colors">
              Войти
            </Link>
            <Link href="/register" className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
              Начать бесплатно
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Уже более 100 турниров создано
            </div>
            <h1 className="text-4xl sm:text-5xl font-black leading-[1.08] tracking-tight text-gray-900 mb-5">
              Управляйте<br />
              турниром.<br />
              <span className="text-emerald-600">Онлайн. Вместе.</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-8 max-w-md">
              Создайте расписание за 30 секунд, ведите счёт в реальном времени и делитесь результатами — участники следят онлайн без регистрации.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
              >
                Создать турнир бесплатно
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium px-5 py-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
              >
                Войти в аккаунт
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-emerald-50 rounded-3xl -z-10" />
            <BrowserFrame url="tournable.app/dashboard">
              <MockDashboard />
            </BrowserFrame>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
              Всё что нужно организатору
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              Один инструмент вместо Excel, WhatsApp и ручных расчётов
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">

            {/* Feature 1 — Schedule */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <BrowserFrame url="tournable.app/t/cup-2025/fixtures">
                <MockDashboard />
              </BrowserFrame>
              <div className="p-6">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-lg mb-1.5">Расписание за 30 секунд</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Выберите формат (круговой или плей-офф), добавьте команды — расписание сгенерируется автоматически. Никаких таблиц Excel.
                </p>
              </div>
            </div>

            {/* Feature 2 — Live */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <BrowserFrame url="tournable.app/t/cup-2025/live">
                <MockLiveBoard />
              </BrowserFrame>
              <div className="p-6">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center mb-3">
                  <Timer className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-bold text-lg mb-1.5">Онлайн-табло прямо с телефона</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Вводите голы, ассисты и карточки в реальном времени. Участники видят счёт мгновенно — по публичной ссылке, без регистрации.
                </p>
              </div>
            </div>

            {/* Feature 3 — Standings */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <BrowserFrame url="tournable.app/t/cup-2025/standings">
                <MockStandings />
              </BrowserFrame>
              <div className="p-6">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-1.5">Турнирная таблица и статистика</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Очки, разница мячей, бомбардиры, ассистенты — всё считается автоматически после каждого матча.
                </p>
              </div>
            </div>

            {/* Feature 4 — Playoff */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <BrowserFrame url="tournable.app/t/cup-2025/playoff">
                <MockBracket />
              </BrowserFrame>
              <div className="p-6">
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
                  <Trophy className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg mb-1.5">Плей-офф сетка</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Сетка на выбывание обновляется автоматически — победители переходят в следующий раунд без ручного ввода.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Extra features strip */}
      <section className="border-y border-gray-100 bg-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { icon: Share2, label: 'Поделиться ссылкой', desc: 'Публичный просмотр без регистрации' },
              { icon: Users, label: 'Соредакторы', desc: 'Приглашай помощников по ссылке' },
              { icon: Download, label: 'Экспорт PDF / PNG', desc: 'Таблицы, бомбардиры, сетка' },
              { icon: Trophy, label: 'Логотипы команд', desc: 'Загрузи эмблемы для каждой команды' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="font-semibold text-sm text-gray-800">{label}</div>
                <div className="text-xs text-gray-400 leading-snug">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">Как это работает</h2>
            <p className="text-gray-500 text-base">Три шага — и турнир готов</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Создай турнир',
                desc: 'Укажи название, выбери формат (круговой или плей-офф) и добавь команды. Расписание сгенерируется само.',
              },
              {
                step: '02',
                title: 'Веди матчи в реальном времени',
                desc: 'Открой табло прямо на матче. Вводи голы и карточки — таблица обновляется мгновенно.',
              },
              {
                step: '03',
                title: 'Поделись с участниками',
                desc: 'Отправь публичную ссылку — команды, болельщики и судьи следят за результатами без регистрации.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col gap-4">
                <div className="text-5xl font-black text-emerald-100 leading-none">{step}</div>
                <h3 className="font-bold text-lg text-gray-900">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">Простые и прозрачные цены</h2>
            <p className="text-gray-500 text-base">Начни бесплатно — подключи платный план когда будет нужно</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl p-6 ${
                  plan.highlight
                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 ring-2 ring-emerald-600'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-900 text-emerald-100 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Популярный
                    </span>
                  </div>
                )}
                <div className="mb-5">
                  <div className={`text-sm font-semibold mb-1 ${plan.highlight ? 'text-emerald-200' : 'text-gray-500'}`}>
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">${plan.price}</span>
                    {plan.period && (
                      <span className={`text-sm ${plan.highlight ? 'text-emerald-200' : 'text-gray-400'}`}>{plan.period}</span>
                    )}
                  </div>
                  <div className={`text-sm mt-1 ${plan.highlight ? 'text-emerald-200' : 'text-gray-400'}`}>
                    {plan.description}
                  </div>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? 'text-emerald-200' : 'text-emerald-500'}`} />
                      <span className={plan.highlight ? 'text-emerald-50' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block text-center font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm ${
                    plan.highlight
                      ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-emerald-600 py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">
            Готовы провести первый турнир?
          </h2>
          <p className="text-emerald-100 text-base mb-8">
            Регистрация занимает меньше минуты. Кредитная карта не нужна.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-3.5 rounded-xl transition-colors text-base"
          >
            Создать турнир бесплатно
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-emerald-700">TOURNABLE</span>
          </div>
          <span>© 2026 Tournable. Все права защищены.</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-gray-600 transition-colors">Войти</Link>
            <Link href="/register" className="hover:text-gray-600 transition-colors">Регистрация</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
