'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, FileText, Moon, Sun, MoveHorizontal } from 'lucide-react'
import {
  SLIDES, CATEGORY_STATS, CATEGORY_PROOF, FRAGMENTS, PROBLEM_POINTS, SOLUTION_STEPS,
  PRODUCT_FACTS, PRODUCT_SHOTS, PRODUCT_READY, MARKET_MAP, MAP_CONCLUSION,
  MARKET_TIERS, MARKET_POINT, SEGMENT_PHASES, MODEL_HEAD, MODEL_SUB, PLANS,
  MODEL_ECONOMICS, NEXT_HEAD, NEXT_SUB, NEXT_TRACKS, ROADMAP,
  TEMPO_HEAD, TEMPO_SUB, TEMPO_STATS, TEMPO_POINT, ASK_HEAD, ASK_ITEMS, ASK_CLOSING,
} from './content'
import s from './pitch.module.css'

const TOTAL = SLIDES.length
const rise = (i: number) => ({ '--i': i }) as React.CSSProperties

/** Фоновая графика слайда. Вынесена наружу: объявление внутри рендера
    создавало бы новый тип компонента на каждый кадр и перезапускало анимации. */
function Bg() {
  return (
    <div className={s.bg} aria-hidden="true">
      <div className={s.mesh} />
      <div className={`${s.aura} ${s.auraA}`} />
      <div className={`${s.aura} ${s.auraB}`} />
    </div>
  )
}

/** Число набегает при появлении слайда. При reduced-motion показывается сразу. */
function Counter({
  value, decimals = 0, prefix = '', suffix = '', active,
}: {
  value: number; decimals?: number; prefix?: string; suffix?: string; active: boolean
}) {
  const [shown, setShown] = useState(0)
  const done = useRef(false)

  useEffect(() => {
    if (!active || done.current) return
    done.current = true

    let raf = 0

    // При отключённой анимации ставим конечное значение — но всё равно через кадр,
    // чтобы не дёргать setState синхронно в теле эффекта
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      raf = requestAnimationFrame(() => setShown(value))
      return () => cancelAnimationFrame(raf)
    }

    const DURATION = 1100
    let start = 0
    const step = (t: number) => {
      if (!start) start = t
      const p = Math.min(1, (t - start) / DURATION)
      // easeOutCubic — быстрый старт, мягкая остановка
      setShown(value * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [active, value])

  const text = shown.toLocaleString('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return <span className={s.num}>{prefix}{text}{suffix}</span>
}

export default function PitchDeck({ initialTheme }: { initialTheme: 'light' | 'dark' }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef(0)
  const lockRef = useRef(false)
  const [current, setCurrent] = useState(0)
  const [ready, setReady] = useState(false)
  const [moved, setMoved] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme)

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Позиция берётся из scrollLeft — точное значение без порогов
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let frame = 0
    function onScroll() {
      if (frame || lockRef.current) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const el = trackRef.current
        if (!el || el.clientWidth === 0 || lockRef.current) return
        const i = Math.round(el.scrollLeft / el.clientWidth)
        indexRef.current = i
        setCurrent((prev) => (prev === i ? prev : i))
      })
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      track.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  const goTo = useCallback((i: number) => {
    const track = trackRef.current
    if (!track) return
    const next = Math.max(0, Math.min(TOTAL - 1, i))
    indexRef.current = next
    setCurrent(next)
    setMoved(true)
    track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' })
  }, [])

  // При ресайзе scroll успел бы пересчитать индекс по новой ширине и увести на чужой слайд
  useEffect(() => {
    let settle: ReturnType<typeof setTimeout>
    function onResize() {
      const track = trackRef.current
      if (!track) return
      lockRef.current = true
      track.scrollTo({ left: indexRef.current * track.clientWidth, behavior: 'auto' })
      clearTimeout(settle)
      settle = setTimeout(() => { lockRef.current = false }, 200)
    }
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); clearTimeout(settle) }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1) }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goTo(current - 1) }
      else if (e.key === ' ') { e.preventDefault(); goTo(current + (e.shiftKey ? -1 : 1)) }
      else if (e.key === 'Home') { e.preventDefault(); goTo(0) }
      else if (e.key === 'End') { e.preventDefault(); goTo(TOTAL - 1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, goTo])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`
  }

  const at = (id: string) => SLIDES.findIndex((x) => x.id === id)
  const on = (id: string) => ready && current === at(id)

  const slide = (id: string, extra = '') => ({
    className: `${s.slide} ${extra} ${on(id) ? s.slideActive : ''}`.trim(),
    inert: current !== at(id),
    'aria-label': `Слайд ${at(id) + 1} из ${TOTAL}: ${SLIDES[at(id)].nav}`,
  })

  return (
    <div className={s.deck} data-pitch-root data-pitch-theme={theme}>

      <div className={s.toolbar}>
        <Link href="/admin/deck" className={s.toolBtn}>
          <FileText size={15} /> Клиентская
        </Link>
        <button type="button" onClick={toggleTheme} className={s.toolBtn}
          aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      <div className={s.track} ref={trackRef} role="region"
        aria-roledescription="карусель слайдов" aria-label="Питч Tournable">

        {/* 01 ── Обложка ─────────────────────────────────────── */}
        <section {...slide('cover', s.cover)}>
          <div className={s.bg} aria-hidden="true">
            <div className={s.coverGrid} />
            <div className={`${s.aura} ${s.auraA}`} />
          </div>
          <div className={s.inner}>
            <p className={`${s.rise} ${s.brandline}`} style={rise(0)}>
              <span className={s.dotmark} /> <b>Tournable</b> <span>Казахстан · 2026</span>
            </p>
            <h1 className={`${s.rise} ${s.display}`} style={rise(1)}>
              Операционная система<br /><span className={s.brand}>соревнований</span>
            </h1>
            <p className={`${s.rise} ${s.lede}`} style={rise(2)}>
              Платформа, которая ведёт соревнование любого масштаба от первого матча
              до итоговой таблицы — и сохраняет его историю на годы вперёд.
            </p>
            <div className={`${s.rise} ${s.coverFoot}`} style={rise(3)}>
              <div><b>Стадия</b>Продукт запущен, платежи приняты</div>
              <div><b>Рынок</b>$1,44 млрд, рост 10,3% в год</div>
              <div><b>Запрос</b>Менторы, партнёры, выходы</div>
            </div>
          </div>
        </section>

        {/* 02 ── Категория ───────────────────────────────────── */}
        <section {...slide('category')}>
          <Bg />
          <div className={s.inner}>
            <p className={`${s.rise} ${s.eyebrow}`} style={rise(0)}>Категория</p>
            <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>
              Треть планеты соревнуется
            </h2>
            <p className={`${s.rise} ${s.lede}`} style={rise(2)}>
              Спорт — не ниша. Это постоянная человеческая активность, у которой есть
              собственный рынок программного обеспечения, и он растёт двузначными темпами.
            </p>
            <div className={`${s.rise} ${s.stats} ${s.stats3}`} style={rise(3)}>
              {CATEGORY_STATS.map((st) => (
                <div className={s.statCell} key={st.label}>
                  <span className={s.stat}>
                    <Counter value={st.value} decimals={st.decimals} prefix={st.prefix}
                      suffix={st.suffix} active={on('category')} />
                  </span>
                  <span className={s.statLabel}>{st.label}</span>
                </div>
              ))}
            </div>
            <div className={`${s.rise} ${s.cards} ${s.c3}`} style={rise(4)}>
              {CATEGORY_PROOF.map((p) => (
                <div className={s.card} key={p.name}>
                  <span className={s.tag}>{p.name}</span>
                  <h3>{p.fact}</h3>
                  <p>{p.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 03 ── Проблема ────────────────────────────────────── */}
        <section {...slide('problem')}>
          <Bg />
          <div className={s.inner}>
            <p className={`${s.rise} ${s.eyebrow}`} style={rise(0)}>Проблема</p>
            <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>
              Соревнование разорвано<br />на четыре части
            </h2>
            <div className={s.fragWrap}>
              <div className={`${s.rise} ${s.fragBoard}`} style={rise(2)}>
                {FRAGMENTS.map((f) => (
                  <div className={s.fragItem} key={f.tool}>
                    <b>{f.tool}</b><span>{f.where}</span>
                  </div>
                ))}
              </div>
              {/* без модификатора колонок: внутри правой части тезисы идут столбцом */}
              <div className={`${s.rise} ${s.cards}`} style={rise(3)}>
                {PROBLEM_POINTS.map((p) => (
                  <div className={s.card} key={p.head}>
                    <h3>{p.head}</h3>
                    <p>{p.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 04 ── Решение ─────────────────────────────────────── */}
        <section {...slide('solution')}>
          <Bg />
          <div className={s.inner}>
            <p className={`${s.rise} ${s.eyebrow}`} style={rise(0)}>Решение</p>
            <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>
              Один продукт<br />на весь цикл соревнования
            </h2>
            <p className={`${s.rise} ${s.lede}`} style={rise(2)}>
              От выбора формата до публичной страницы с итогами. Без переноса данных
              между сервисами и без потери истории после финала.
            </p>
            <div className={`${s.rise} ${s.cards} ${s.c3}`} style={rise(3)}>
              {SOLUTION_STEPS.map((st) => (
                <div className={s.card} key={st.k}>
                  <span className={s.tag}>{st.k}</span>
                  <p>{st.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 05 ── Продукт ─────────────────────────────────────── */}
        <section {...slide('product')}>
          <Bg />
          <div className={s.inner}>
            <p className={`${s.rise} ${s.eyebrow}`} style={rise(0)}>Продукт</p>
            <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>
              Это работает <span className={s.brand}>сейчас</span>
            </h2>
            <div className={`${s.rise} ${s.shots}`} style={rise(2)}>
              {PRODUCT_SHOTS.map((sh) => (
                <figure className={s.shot} key={sh.src} style={{ margin: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sh.src} alt={sh.alt} width={1500} height={937} />
                  <figcaption className={s.shotCap}>{sh.cap}</figcaption>
                </figure>
              ))}
            </div>
            <div className={`${s.rise} ${s.chips}`} style={rise(3)}>
              {PRODUCT_FACTS.map((f) => (
                <span className={s.chip} key={f.label}><b>{f.value}</b>{f.label}</span>
              ))}
              {PRODUCT_READY.map((r) => <span className={s.chip} key={r}>{r}</span>)}
            </div>
          </div>
        </section>

        {/* 06 ── Карта рынка ─────────────────────────────────── */}
        <section {...slide('map')}>
          <Bg />
          <div className={s.inner}>
            <p className={`${s.rise} ${s.eyebrow}`} style={rise(0)}>Конкурентная среда</p>
            <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>
              Каждый силён в своём
            </h2>
            <p className={`${s.rise} ${s.lede}`} style={rise(2)}>
              Рынок поделён по специализациям. Мы не спорим с этим — мы занимаем место,
              которое остаётся свободным.
            </p>
            <div className={`${s.rise} ${s.mapRows}`} style={rise(3)}>
              {MARKET_MAP.map((m) => (
                <div className={s.mapRow} key={m.name}>
                  <div className={s.mapName}>{m.name}</div>
                  <div className={s.mapFocus}>{m.focus}</div>
                  <div className={s.mapUs}>{m.us}</div>
                </div>
              ))}
            </div>
            <div className={`${s.rise} ${s.mapNote}`} style={rise(4)}>{MAP_CONCLUSION}</div>
          </div>
        </section>

        {/* 07 ── Рынок ───────────────────────────────────────── */}
        <section {...slide('market')}>
          <Bg />
          <div className={s.inner}>
            <p className={`${s.rise} ${s.eyebrow}`} style={rise(0)}>Рынок</p>
            <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>
              Глобальный по построению
            </h2>
            <div className={`${s.rise} ${s.tiers}`} style={rise(2)}>
              {MARKET_TIERS.map((t, i) => (
                <div className={`${s.tier} ${i === 1 ? s.tierLead : ''}`} key={t.tag}>
                  <span className={s.tierTag}>{t.tag}</span>
                  <div className={s.tierValue}>{t.value}</div>
                  <div className={s.tierLabel}>{t.label}</div>
                  <div className={s.tierNote}>{t.note}</div>
                  <div className={s.tierBar}>
                    <div className={s.tierFill} style={{ '--w': `${100 - i * 28}%` } as React.CSSProperties} />
                  </div>
                </div>
              ))}
            </div>
            <div className={`${s.rise} ${s.mapNote}`} style={rise(3)}>{MARKET_POINT}</div>
          </div>
        </section>

        {/* 08 ── Сегменты ────────────────────────────────────── */}
        <section {...slide('segments')}>
          <Bg />
          <div className={s.inner}>
            <p className={`${s.rise} ${s.eyebrow}`} style={rise(0)}>Целевая аудитория</p>
            <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>
              Идём волнами, а не веером
            </h2>
            <p className={`${s.rise} ${s.lede}`} style={rise(2)}>
              Начинаем там, где решение принимают быстро, и расширяемся к тем,
              кто платит больше и остаётся дольше.
            </p>
            <div className={`${s.rise} ${s.phases}`} style={rise(3)}>
              {SEGMENT_PHASES.map((p) => (
                <div className={s.phase} key={p.phase}>
                  <div className={s.phaseTop}>
                    <span className={s.phaseDot} />
                    <span className={s.phaseTag}>{p.phase}</span>
                  </div>
                  <h3>{p.title}</h3>
                  <p className={s.phaseWhy}>{p.why}</p>
                  <div className={s.phaseSpeed}>{p.speed}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 09 ── Бизнес-модель ───────────────────────────────── */}
        <section {...slide('model')}>
          <Bg />
          <div className={s.inner}>
            <p className={`${s.rise} ${s.eyebrow}`} style={rise(0)}>Бизнес-модель</p>
            <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>{MODEL_HEAD}</h2>
            <p className={`${s.rise} ${s.lede}`} style={rise(2)}>{MODEL_SUB}</p>
            <div className={`${s.rise} ${s.planRow}`} style={rise(3)}>
              {PLANS.map((p) => (
                <div className={`${s.plan} ${p.lead ? s.planLead : ''}`} key={p.name}>
                  <div className={s.planName}>{p.name}</div>
                  <span className={s.planPrice}>{p.price}</span>
                  <div className={s.planSub}>{p.sub}</div>
                </div>
              ))}
            </div>
            <div className={`${s.rise} ${s.cards} ${s.c3}`} style={rise(4)}>
              {MODEL_ECONOMICS.map((e) => (
                <div className={s.card} key={e.k}>
                  <span className={s.tag}>{e.k}</span>
                  <h3 className={s.brand}>{e.v}</h3>
                  <p>{e.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10 ── Развитие ────────────────────────────────────── */}
        <section {...slide('next')}>
          <Bg />
          <div className={s.inner}>
            <p className={`${s.rise} ${s.eyebrow}`} style={rise(0)}>Куда идём</p>
            <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>{NEXT_HEAD}</h2>
            <p className={`${s.rise} ${s.lede}`} style={rise(2)}>{NEXT_SUB}</p>
            <div className={`${s.rise} ${s.tracks}`} style={rise(3)}>
              {NEXT_TRACKS.map((t) => (
                <div className={s.trackCell} key={t.tag}>
                  <span className={s.tag}>{t.tag}</span>
                  <h3>{t.head}</h3>
                  <p>{t.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 11 ── Дорожная карта ──────────────────────────────── */}
        <section {...slide('roadmap')}>
          <Bg />
          <div className={s.inner}>
            <p className={`${s.rise} ${s.eyebrow}`} style={rise(0)}>Дорожная карта</p>
            <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>
              Четыре квартала до выхода за границу
            </h2>
            <div className={`${s.rise} ${s.road}`} style={rise(2)}>
              <div className={s.roadLine} aria-hidden="true" />
              <div className={s.roadFill} aria-hidden="true" />
              <div className={s.roadGrid}>
                {ROADMAP.map((r, i) => (
                  <div className={s.roadStep} key={r.q} style={{ '--n': i } as React.CSSProperties}>
                    <span className={s.qLabel}>{r.q}</span>
                    <h3>{r.title}</h3>
                    <div className={s.roadGoal}>{r.goal}</div>
                    <ul>{r.items.map((it) => <li key={it}>{it}</li>)}</ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 12 ── Темп ────────────────────────────────────────── */}
        <section {...slide('tempo')}>
          <Bg />
          <div className={s.inner}>
            <p className={`${s.rise} ${s.eyebrow}`} style={rise(0)}>Темп</p>
            <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>{TEMPO_HEAD}</h2>
            <p className={`${s.rise} ${s.lede}`} style={rise(2)}>{TEMPO_SUB}</p>
            <div className={`${s.rise} ${s.stats} ${s.stats4}`} style={rise(3)}>
              {TEMPO_STATS.map((t) => (
                <div className={s.statCell} key={t.label}>
                  <span className={s.stat}><Counter value={t.value} active={on('tempo')} /></span>
                  <span className={s.statLabel}>{t.label}</span>
                </div>
              ))}
            </div>
            <div className={`${s.rise} ${s.mapNote}`} style={rise(4)}>{TEMPO_POINT}</div>
          </div>
        </section>

        {/* 13 ── Запрос ──────────────────────────────────────── */}
        <section {...slide('ask')}>
          <Bg />
          <div className={s.inner}>
            <p className={`${s.rise} ${s.eyebrow}`} style={rise(0)}>Что нужно</p>
            <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>{ASK_HEAD}</h2>
            <div className={`${s.rise} ${s.cards} ${s.c3}`} style={rise(2)}>
              {ASK_ITEMS.map((a) => (
                <div className={s.card} key={a.tag}>
                  <span className={s.tag}>{a.tag}</span>
                  <h3>{a.head}</h3>
                  <p>{a.body}</p>
                </div>
              ))}
            </div>
            <div className={`${s.rise} ${s.askClose}`} style={rise(3)}>{ASK_CLOSING}</div>
            <div className={`${s.rise} ${s.contacts}`} style={rise(4)}>
              <div><b>Продукт</b><a href="https://tournable.app">tournable.app</a></div>
              <div><b>Связь</b><a href="https://wa.me/message/YHLE2IFII4MSJ1">WhatsApp</a></div>
              <div><b>Оператор</b>ИП «Tournable.app», Астана</div>
            </div>
          </div>
        </section>

      </div>

      <div className={`${s.hint} ${moved ? s.hintHidden : ''}`} aria-hidden="true">
        <MoveHorizontal size={14} /> Свайп или стрелки
      </div>

      <nav className={s.hud} aria-label="Навигация по слайдам">
        <div className={s.counter}>
          <b>{String(current + 1).padStart(2, '0')}</b> / {String(TOTAL).padStart(2, '0')}
        </div>
        <div className={s.rail}>
          {SLIDES.map((sl, i) => (
            <button key={sl.id} type="button"
              className={`${s.railItem} ${i <= current ? s.railOn : ''}`}
              onClick={() => goTo(i)} title={`${i + 1}. ${sl.nav}`}
              aria-label={`Перейти к слайду ${i + 1}: ${sl.nav}`}
              aria-current={i === current ? 'true' : undefined} />
          ))}
        </div>
        <div className={s.navBtns}>
          <button type="button" className={s.navBtn} onClick={() => goTo(current - 1)}
            disabled={current === 0} aria-label="Предыдущий слайд"><ChevronLeft size={17} /></button>
          <button type="button" className={s.navBtn} onClick={() => goTo(current + 1)}
            disabled={current === TOTAL - 1} aria-label="Следующий слайд"><ChevronRight size={17} /></button>
        </div>
      </nav>
    </div>
  )
}
