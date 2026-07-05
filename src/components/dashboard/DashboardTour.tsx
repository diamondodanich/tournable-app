'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import {
  X, ArrowRight, ArrowLeft, Sparkles, Plus, Radio, BarChart3, Share2,
  Crown, FileDown, Star, Check, Search,
} from 'lucide-react'

type Lang = 'ru' | 'kz' | 'en'
type Plan = 'free' | 'pro' | 'enterprise'
type Step = { icon: typeof Plus; accent: string; title: string; desc: string; target?: string }

const T = {
  ru: {
    skip: 'Пропустить', back: 'Назад', next: 'Далее', done: 'Начать',
    stepOf: (a: number, b: number) => `${a} из ${b}`,
    welcome: { title: 'Добро пожаловать в Tournable', desc: 'Быстрый интерактивный тур — покажем главные блоки прямо на экране.' },
    create: { title: 'Создавайте турниры и чемпионаты', desc: 'Эта кнопка запускает мастер: спорт, формат, команды — расписание готово.' },
    search: { title: 'Поиск команд и игроков', desc: 'Найдите любую команду или игрока из ваших турниров и чемпионатов.' },
    live: { title: 'Live-табло', desc: 'Ведите матч в реальном времени с телефона: счёт, голы, карточки. На всех планах.' },
    stats: { title: 'Таблицы и статистика', desc: 'Турнирная таблица и бомбардиры обновляются автоматически после каждого матча.' },
    share: { title: 'Делитесь ссылкой', desc: 'Отправьте ссылку — участники следят за результатами без регистрации.' },
    planFree: { title: 'Ваш план — Free', desc: 'Все виды спорта и форматы доступны. Лимит: 1 турнир и до 16 команд. Pro снимает лимиты, добавляет брендированные отчёты и со-редакторов.' },
    planPro: { title: 'Ваш план — Pro', desc: 'Без лимита турниров и команд, брендированные отчёты PDF/PNG и со-редакторы.' },
    planEnt: { title: 'Ваш план — Enterprise', desc: 'Всё из Pro плюс чемпионаты с сезонами, профили игроков и публичные страницы.' },
    entChamp: { title: 'Чемпионаты с сезонами', desc: 'Здесь живут ваши чемпионаты: команды и статистика сохраняются между сезонами.' },
  },
  kz: {
    skip: 'Өткізу', back: 'Артқа', next: 'Әрі қарай', done: 'Бастау',
    stepOf: (a: number, b: number) => `${b}-тен ${a}`,
    welcome: { title: 'Tournable-ге қош келдіңіз', desc: 'Жылдам интерактивті тур — негізгі блоктарды экранда көрсетеміз.' },
    create: { title: 'Турнирлер мен чемпионаттар', desc: 'Бұл батырма шеберді ашады: спорт, формат, командалар — кесте дайын.' },
    search: { title: 'Команда мен ойыншы іздеу', desc: 'Турнирлер мен чемпионаттардан кез келген команда не ойыншыны табыңыз.' },
    live: { title: 'Live-табло', desc: 'Матчты телефоннан нақты уақытта жүргізіңіз. Барлық жоспарларда.' },
    stats: { title: 'Кестелер мен статистика', desc: 'Турнир кестесі әр матчтан кейін автоматты жаңарады.' },
    share: { title: 'Сілтемемен бөлісіңіз', desc: 'Сілтеме жіберіңіз — қатысушылар тіркелусіз қадағалайды.' },
    planFree: { title: 'Жоспарыңыз — Free', desc: 'Барлық спорт түрлері мен форматтар қолжетімді. Лимит: 1 турнир, 16 командаға дейін. Pro лимиттерді алып тастайды, брендті есептер мен қосалқы редакторлар қосады.' },
    planPro: { title: 'Жоспарыңыз — Pro', desc: 'Шексіз турнирлер мен командалар, брендті PDF/PNG есептер және қосалқы редакторлар.' },
    planEnt: { title: 'Жоспарыңыз — Enterprise', desc: 'Pro-дағының бәрі және маусымдары бар чемпионаттар, ойыншы профильдері.' },
    entChamp: { title: 'Маусымдары бар чемпионаттар', desc: 'Осында чемпионаттарыңыз: командалар мен статистика маусымдар аралығында сақталады.' },
  },
  en: {
    skip: 'Skip', back: 'Back', next: 'Next', done: 'Get started',
    stepOf: (a: number, b: number) => `${a} of ${b}`,
    welcome: { title: 'Welcome to Tournable', desc: 'A quick interactive tour — we’ll point out the main blocks on screen.' },
    create: { title: 'Create tournaments & championships', desc: 'This button opens the wizard: sport, format, teams — schedule ready.' },
    search: { title: 'Search teams & players', desc: 'Find any team or player across your tournaments and championships.' },
    live: { title: 'Live scoreboard', desc: 'Run a match in real time from your phone. Available on all plans.' },
    stats: { title: 'Standings & stats', desc: 'The table and top scorers update automatically after every match.' },
    share: { title: 'Share a link', desc: 'Send a link — participants follow results without signing up.' },
    planFree: { title: 'Your plan — Free', desc: 'All sports and formats included. Limit: 1 tournament and up to 16 teams. Pro removes limits, adds branded reports and co-editors.' },
    planPro: { title: 'Your plan — Pro', desc: 'Unlimited tournaments and teams, branded PDF/PNG reports and co-editors.' },
    planEnt: { title: 'Your plan — Enterprise', desc: 'Everything in Pro plus championships with seasons and player profiles.' },
    entChamp: { title: 'Championships with seasons', desc: 'Your championships live here: teams and stats carry across seasons.' },
  },
} as const

function buildSteps(plan: Plan, tx: (typeof T)['ru']): Step[] {
  const steps: Step[] = [
    { icon: Sparkles, accent: '#10b981', title: tx.welcome.title, desc: tx.welcome.desc },
    { icon: Plus, accent: '#10b981', title: tx.create.title, desc: tx.create.desc, target: '[data-tour="create"]' },
    { icon: Search, accent: '#0ea5e9', title: tx.search.title, desc: tx.search.desc, target: '[data-tour="search"]' },
    { icon: Radio, accent: '#f43f5e', title: tx.live.title, desc: tx.live.desc },
    { icon: BarChart3, accent: '#6366f1', title: tx.stats.title, desc: tx.stats.desc },
    { icon: Share2, accent: '#0ea5e9', title: tx.share.title, desc: tx.share.desc },
  ]
  if (plan === 'enterprise') {
    steps.push({ icon: Crown, accent: '#a855f7', title: tx.entChamp.title, desc: tx.entChamp.desc, target: '[data-tour="championships"]' })
    steps.push({ icon: Crown, accent: '#a855f7', title: tx.planEnt.title, desc: tx.planEnt.desc, target: '[data-tour="account"]' })
  } else if (plan === 'pro') {
    steps.push({ icon: FileDown, accent: '#10b981', title: tx.planPro.title, desc: tx.planPro.desc, target: '[data-tour="account"]' })
  } else {
    steps.push({ icon: Star, accent: '#f59e0b', title: tx.planFree.title, desc: tx.planFree.desc, target: '[data-tour="account"]' })
  }
  return steps
}

const STORAGE_KEY = 'tournable_dashboard_tour_v2'
type Rect = { top: number; left: number; width: number; height: number }

export default function DashboardTour({ plan, lang = 'ru', initialSeen, userId }: {
  plan: Plan
  lang?: Lang
  initialSeen: boolean
  userId?: string
}) {
  const tx = T[lang]
  const steps = buildSteps(plan, T[lang] as (typeof T)['ru'])
  const [open, setOpen] = useState(false)
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)

  // Per-account key: a global key made a brand-new account skip the tour on any
  // browser where a previous account had already dismissed it (multi-account).
  const storageKey = userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY

  useEffect(() => {
    // Source of truth is the server-side flag (per account). The local key is
    // only a fast-path guard for the same account on the same device.
    if (initialSeen) return
    if (typeof window !== 'undefined' && window.localStorage.getItem(storageKey)) return
    setOpen(true)
  }, [initialSeen, storageKey])

  const step = steps[i]

  // Locate + track the highlighted element for the current step.
  useEffect(() => {
    if (!open) return
    let raf = 0
    function measure() {
      const sel = step?.target
      if (!sel) { setRect(null); return }
      const el = document.querySelector(sel) as HTMLElement | null
      if (!el) { setRect(null); return }
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) { setRect(null); return }
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    const el = step?.target ? (document.querySelector(step.target) as HTMLElement | null) : null
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    raf = requestAnimationFrame(() => { measure(); requestAnimationFrame(measure) })
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true) }
  }, [open, i, step?.target])

  function finish() {
    setOpen(false)
    try { window.localStorage.setItem(storageKey, '1') } catch {}
    const supabase = createClient()
    void supabase.auth.updateUser({ data: { dashboard_tour_seen: true } })
  }

  if (!open || !step) return null
  const Icon = step.icon
  const isLast = i === steps.length - 1
  const pad = 8

  // Tooltip placement: below the target if there's room, else above; centered when no target.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 360
  const vh = typeof window !== 'undefined' ? window.innerHeight : 640
  const cardW = Math.min(360, vw - 24)
  let cardStyle: React.CSSProperties
  if (rect) {
    const below = rect.top + rect.height + 14
    const placeBelow = below + 220 < vh
    const top = placeBelow ? rect.top + rect.height + 14 : Math.max(12, rect.top - 14 - 220)
    let left = rect.left + rect.width / 2 - cardW / 2
    left = Math.max(12, Math.min(left, vw - cardW - 12))
    cardStyle = { position: 'fixed', top, left, width: cardW }
  } else {
    cardStyle = { position: 'fixed', top: '50%', left: '50%', width: cardW, transform: 'translate(-50%,-50%)' }
  }

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      {/* Dim overlay — with a spotlight cutout around the target */}
      {rect ? (
        <div
          className="fixed rounded-2xl pointer-events-none transition-all duration-300"
          style={{
            top: rect.top - pad, left: rect.left - pad,
            width: rect.width + pad * 2, height: rect.height + pad * 2,
            boxShadow: `0 0 0 9999px rgba(17,24,39,0.68)`,
            outline: `2px solid ${step.accent}`, outlineOffset: 2, borderRadius: 16,
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-gray-900/68" onClick={finish} />
      )}

      {/* Tooltip card */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden" style={cardStyle}>
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${step.accent}, ${step.accent}55)` }} />
        <button onClick={finish} className="absolute top-3.5 right-3.5 text-gray-300 hover:text-gray-600" aria-label={tx.skip}><X size={17} /></button>
        <div className="p-5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: `${step.accent}18` }}>
            <Icon size={22} style={{ color: step.accent }} />
          </div>
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-300 mb-1.5">{tx.stepOf(i + 1, steps.length)}</p>
          <h2 className="text-lg font-black text-gray-900 mb-1.5 leading-snug">{step.title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>

          <div className="flex gap-1.5 mt-4 mb-4">
            {steps.map((s, idx) => (
              <span key={idx} className="h-1.5 rounded-full transition-all"
                style={{ width: idx === i ? 22 : 8, background: idx === i ? step.accent : idx < i ? `${step.accent}66` : '#e5e7eb' }} />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            {i > 0 ? (
              <button onClick={() => setI(i - 1)} className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-gray-700">
                <ArrowLeft size={15} /> {tx.back}
              </button>
            ) : (
              <button onClick={finish} className="text-sm font-medium text-gray-400 hover:text-gray-600">{tx.skip}</button>
            )}
            <button onClick={() => (isLast ? finish() : setI(i + 1))}
              className="inline-flex items-center gap-1.5 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
              style={{ background: step.accent }}>
              {isLast ? (<><Check size={15} /> {tx.done}</>) : (<>{tx.next} <ArrowRight size={15} /></>)}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
