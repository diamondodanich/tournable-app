'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  X, ArrowRight, ArrowLeft, Sparkles, Plus, Radio, BarChart3, Share2,
  Crown, Layers, Users, FileDown, Star, Check,
} from 'lucide-react'

type Lang = 'ru' | 'kz' | 'en'
type Plan = 'free' | 'pro' | 'enterprise'

type Step = { icon: typeof Plus; accent: string; title: string; desc: string }

const T = {
  ru: {
    skip: 'Пропустить',
    back: 'Назад',
    next: 'Далее',
    done: 'Начать',
    stepOf: (a: number, b: number) => `${a} из ${b}`,
    welcome: {
      title: 'Добро пожаловать в Tournable',
      desc: 'Короткий обзор — покажем главные блоки и что доступно на вашем плане.',
    },
    create: {
      title: 'Создавайте турниры и чемпионаты',
      desc: 'Кнопка «Создать» справа сверху. Выберите вид спорта и формат, добавьте команды — расписание сгенерируется автоматически.',
    },
    live: {
      title: 'Live-табло',
      desc: 'Ведите матч в реальном времени прямо с телефона: счёт, голы, карточки. Доступно на всех планах.',
    },
    stats: {
      title: 'Таблицы и статистика',
      desc: 'Турнирная таблица и бомбардиры обновляются автоматически после каждого матча.',
    },
    share: {
      title: 'Делитесь ссылкой',
      desc: 'Отправьте ссылку — участники и болельщики следят за результатами без регистрации.',
    },
    planFree: {
      title: 'Ваш план — Free',
      desc: '1 активный турнир и до 16 команд. Про открывает безлимит, все форматы, PDF/PNG-экспорт и до 3 со-редакторов.',
    },
    planPro: {
      title: 'Ваш план — Pro',
      desc: 'Безлимит турниров, до 64 команд, все форматы, экспорт отчётов в PDF/PNG и до 3 со-редакторов.',
    },
    planEnt: {
      title: 'Ваш план — Enterprise',
      desc: 'Всё из Pro плюс Чемпионаты с сезонами, постоянные команды, профили игроков и публичные страницы, находимые в поиске.',
    },
    entChamp: {
      title: 'Чемпионаты с сезонами',
      desc: 'Блок «Чемпионаты» на дашборде: команды и игроки сохраняются между сезонами, статистика склеивается за всю историю.',
    },
  },
  kz: {
    skip: 'Өткізу',
    back: 'Артқа',
    next: 'Әрі қарай',
    done: 'Бастау',
    stepOf: (a: number, b: number) => `${b}-тен ${a}`,
    welcome: {
      title: 'Tournable-ге қош келдіңіз',
      desc: 'Қысқаша шолу — негізгі блоктарды және жоспарыңызда не бар екенін көрсетеміз.',
    },
    create: {
      title: 'Турнирлер мен чемпионаттар жасаңыз',
      desc: '«Жасау» батырмасы оң жақ жоғарыда. Спорт түрі мен форматты таңдап, командаларды қосыңыз — кесте автоматты жасалады.',
    },
    live: {
      title: 'Live-табло',
      desc: 'Матчты телефоннан нақты уақытта жүргізіңіз: есеп, голдар, карточкалар. Барлық жоспарларда қолжетімді.',
    },
    stats: {
      title: 'Кестелер мен статистика',
      desc: 'Турнир кестесі мен бомбардирлер әр матчтан кейін автоматты жаңарады.',
    },
    share: {
      title: 'Сілтемемен бөлісіңіз',
      desc: 'Сілтеме жіберіңіз — қатысушылар мен жанкүйерлер нәтижелерді тіркелусіз қадағалайды.',
    },
    planFree: {
      title: 'Жоспарыңыз — Free',
      desc: '1 белсенді турнир және 16 командаға дейін. Про шексіздік, барлық форматтар, PDF/PNG экспорт және 3 соредакторға дейін ашады.',
    },
    planPro: {
      title: 'Жоспарыңыз — Pro',
      desc: 'Шексіз турнирлер, 64 командаға дейін, барлық форматтар, PDF/PNG есеп экспорты және 3 соредакторға дейін.',
    },
    planEnt: {
      title: 'Жоспарыңыз — Enterprise',
      desc: 'Pro-дағының бәрі және Маусымдары бар Чемпионаттар, тұрақты командалар, ойыншы профильдері мен іздеуден табылатын ашық беттер.',
    },
    entChamp: {
      title: 'Маусымдары бар Чемпионаттар',
      desc: 'Дашбордтағы «Чемпионаттар» блогы: командалар мен ойыншылар маусымдар аралығында сақталады, статистика бүкіл тарих бойы жинақталады.',
    },
  },
  en: {
    skip: 'Skip',
    back: 'Back',
    next: 'Next',
    done: 'Get started',
    stepOf: (a: number, b: number) => `${a} of ${b}`,
    welcome: {
      title: 'Welcome to Tournable',
      desc: 'A quick tour — we’ll show the main blocks and what your plan unlocks.',
    },
    create: {
      title: 'Create tournaments & championships',
      desc: 'The “Create” button is top-right. Pick a sport and format, add teams — the schedule generates automatically.',
    },
    live: {
      title: 'Live scoreboard',
      desc: 'Run a match in real time from your phone: score, goals, cards. Available on all plans.',
    },
    stats: {
      title: 'Standings & stats',
      desc: 'The table and top scorers update automatically after every match.',
    },
    share: {
      title: 'Share a link',
      desc: 'Send a link — participants and fans follow results without signing up.',
    },
    planFree: {
      title: 'Your plan — Free',
      desc: '1 active tournament and up to 16 teams. Pro unlocks unlimited, all formats, PDF/PNG export and up to 3 co-editors.',
    },
    planPro: {
      title: 'Your plan — Pro',
      desc: 'Unlimited tournaments, up to 64 teams, all formats, PDF/PNG report export and up to 3 co-editors.',
    },
    planEnt: {
      title: 'Your plan — Enterprise',
      desc: 'Everything in Pro plus Championships with seasons, persistent teams, player profiles and public pages found in search.',
    },
    entChamp: {
      title: 'Championships with seasons',
      desc: 'The “Championships” block on your dashboard: teams and players carry across seasons, stats aggregate over all-time.',
    },
  },
} as const

function buildSteps(plan: Plan, tx: (typeof T)['ru']): Step[] {
  const steps: Step[] = [
    { icon: Sparkles, accent: '#10b981', title: tx.welcome.title, desc: tx.welcome.desc },
    { icon: Plus,     accent: '#10b981', title: tx.create.title,  desc: tx.create.desc },
    { icon: Radio,    accent: '#f43f5e', title: tx.live.title,    desc: tx.live.desc },
    { icon: BarChart3,accent: '#6366f1', title: tx.stats.title,   desc: tx.stats.desc },
    { icon: Share2,   accent: '#0ea5e9', title: tx.share.title,   desc: tx.share.desc },
  ]
  if (plan === 'enterprise') {
    steps.push({ icon: Crown, accent: '#a855f7', title: tx.entChamp.title, desc: tx.entChamp.desc })
    steps.push({ icon: Layers, accent: '#a855f7', title: tx.planEnt.title, desc: tx.planEnt.desc })
  } else if (plan === 'pro') {
    steps.push({ icon: FileDown, accent: '#10b981', title: tx.planPro.title, desc: tx.planPro.desc })
  } else {
    steps.push({ icon: Star, accent: '#f59e0b', title: tx.planFree.title, desc: tx.planFree.desc })
  }
  return steps
}

const STORAGE_KEY = 'tournable_dashboard_tour_v1'

export default function DashboardTour({ plan, lang = 'ru', initialSeen }: {
  plan: Plan
  lang?: Lang
  initialSeen: boolean
}) {
  const tx = T[lang]
  const steps = buildSteps(plan, T[lang] as (typeof T)['ru'])
  const [open, setOpen] = useState(false)
  const [i, setI] = useState(0)

  // Show only if the account flag is unset AND this browser hasn't dismissed it.
  useEffect(() => {
    if (initialSeen) return
    if (typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY)) return
    setOpen(true)
  }, [initialSeen])

  function finish() {
    setOpen(false)
    try { window.localStorage.setItem(STORAGE_KEY, '1') } catch {}
    // Persist to the account so it doesn't reappear on other devices (best-effort).
    const supabase = createClient()
    void supabase.auth.updateUser({ data: { dashboard_tour_seen: true } })
  }

  if (!open) return null

  const step = steps[i]
  const Icon = step.icon
  const isLast = i === steps.length - 1

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={finish} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Accent top bar */}
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${step.accent}, ${step.accent}55)` }} />

        <button
          onClick={finish}
          className="absolute top-4 right-4 text-gray-300 hover:text-gray-600 transition-colors"
          aria-label={tx.skip}
        >
          <X size={18} />
        </button>

        <div className="p-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-sm"
            style={{ background: `${step.accent}18` }}
          >
            <Icon size={26} style={{ color: step.accent }} />
          </div>

          <p className="text-[11px] font-black uppercase tracking-widest text-gray-300 mb-2">
            {tx.stepOf(i + 1, steps.length)}
          </p>
          <h2 className="text-xl font-black text-gray-900 mb-2 leading-snug">{step.title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>

          {/* Progress dots */}
          <div className="flex gap-1.5 mt-6 mb-6">
            {steps.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: idx === i ? 22 : 8,
                  background: idx === i ? step.accent : idx < i ? `${step.accent}66` : '#e5e7eb',
                }}
                aria-label={`${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            {i > 0 ? (
              <button
                onClick={() => setI(i - 1)}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={15} /> {tx.back}
              </button>
            ) : (
              <button onClick={finish} className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
                {tx.skip}
              </button>
            )}

            <button
              onClick={() => (isLast ? finish() : setI(i + 1))}
              className="inline-flex items-center gap-1.5 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
              style={{ background: step.accent }}
            >
              {isLast ? (<><Check size={15} /> {tx.done}</>) : (<>{tx.next} <ArrowRight size={15} /></>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
