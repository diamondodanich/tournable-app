'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, FileText, MoveHorizontal } from 'lucide-react'
import DeckThemeToggle from '../DeckThemeToggle'
import FormatDiagram from '../FormatDiagram'
import { SCREENS, COMPARISON, PILLARS, FORMATS, CAPABILITIES, STAGES, PLANS } from '../content'
import s from './slides.module.css'

/** Порядок и заголовки слайдов — заодно подписи к делениям шкалы внизу. */
const TITLES = [
  'Обложка',
  'Исходная ситуация',
  'Одна система',
  'Форматы',
  ...SCREENS.map((sc) => sc.tag),
  'Табло',
  'Организация работы',
  'Внедрение',
  'Тарифы',
  'Следующий шаг',
]

/** Задержка лестничного появления внутри слайда. */
function rise(i: number): React.CSSProperties {
  return { '--i': i } as React.CSSProperties
}

export default function SlideDeck({ initialTheme }: { initialTheme: 'light' | 'dark' }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)
  const [ready, setReady] = useState(false)
  const [moved, setMoved] = useState(false)
  const total = TITLES.length

  // Первый слайд анимируется только после монтирования — иначе он отрисуется
  // сразу в конечном состоянии и появления не будет видно
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Авторитетный номер слайда. Держим в ref, потому что при ресайзе окна
  // событие scroll успевает пересчитать позицию по УЖЕ НОВОЙ ширине ленты
  // и сбить индекс — тогда выравнивание уводит на чужой слайд
  const indexRef = useRef(0)
  const lockRef = useRef(false)

  // Позицию читаем из scrollLeft: точное значение, без порогов и гонок
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

  const goTo = useCallback((i: number, smooth = true) => {
    const track = trackRef.current
    if (!track) return
    const next = Math.max(0, Math.min(total - 1, i))
    indexRef.current = next
    setCurrent(next)          // HUD реагирует сразу, не дожидаясь конца прокрутки
    setMoved(true)
    track.scrollTo({
      left: next * track.clientWidth,
      behavior: smooth ? 'smooth' : 'auto',
    })
  }, [total])

  // При смене размера окна слайд обязан остаться тем же и встать по краю
  useEffect(() => {
    let settle: ReturnType<typeof setTimeout>
    function onResize() {
      const track = trackRef.current
      if (!track) return
      lockRef.current = true                 // глушим scroll на время перекладки
      track.scrollTo({ left: indexRef.current * track.clientWidth, behavior: 'auto' })
      clearTimeout(settle)
      settle = setTimeout(() => { lockRef.current = false }, 200)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(settle)
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return

      switch (e.key) {
        case 'ArrowRight': case 'PageDown':
          e.preventDefault(); goTo(current + 1); break
        case 'ArrowLeft': case 'PageUp':
          e.preventDefault(); goTo(current - 1); break
        case ' ':
          e.preventDefault(); goTo(current + (e.shiftKey ? -1 : 1)); break
        case 'Home':
          e.preventDefault(); goTo(0); break
        case 'End':
          e.preventDefault(); goTo(total - 1); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, goTo, total])

  // inert снимает неактивные слайды с фокуса и со скринридера разом —
  // без него ссылки соседних слайдов остаются в табуляции за краем экрана
  const slideProps = (i: number, extra = '') => ({
    className: `${s.slide} ${extra} ${ready && current === i ? s.slideActive : ''}`.trim(),
    inert: current !== i,
    'aria-label': `Слайд ${i + 1} из ${total}: ${TITLES[i]}`,
  })

  let n = 0
  const idx = { cover: n++, problem: n++, system: n++, formats: n++ }
  const screenFrom = n; n += SCREENS.length
  const rest = { board: n++, caps: n++, stages: n++, plans: n++, close: n++ }

  return (
    <div className={s.deck} data-deck-root data-deck-theme={initialTheme}>

      <div className={s.toolbar}>
        <Link href="/admin/deck" className={s.toolBtn}>
          <FileText size={16} /> Одной страницей
        </Link>
        <DeckThemeToggle initialTheme={initialTheme} className={s.toolBtn} />
      </div>

      <div className={s.track} ref={trackRef} role="region" aria-roledescription="карусель слайдов" aria-label="Презентация Tournable">

        {/* ── 1. Обложка ─────────────────────────────────────── */}
        <section {...slideProps(idx.cover, s.cover)}>
          <div className={s.coverBg} role="img" aria-label="Светодиодное табло Tournable на стадионе во время матча">
            <div className={s.coverSweep} />
          </div>
          <div className={s.inner}>
            <p className={`${s.rise} ${s.brandline}`} style={rise(0)}>
              <b>Tournable</b> <span>Платформа соревнований</span> <span className={s.num}>2026</span>
            </p>
            <h1 className={`${s.rise} ${s.display}`} style={rise(1)}>
              Соревнование<br />как <span className={s.lit}>управляемый<br />процесс</span>
            </h1>
            <p className={`${s.rise} ${s.lede}`} style={rise(2)}>
              Расписание, счёт, таблица, плей-офф, статистика и публичная страница турнира —
              в одной системе. Организатор ведёт игру, всё остальное считается само.
            </p>
          </div>
        </section>

        {/* ── 2. Исходная ситуация ───────────────────────────── */}
        <section {...slideProps(idx.problem)}>
          <div className={s.inner}>
            <p className={`${s.rise} ${s.eyebrow}`} style={rise(0)}>Исходная ситуация</p>
            <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>Турнир живёт в переписке</h2>
            <p className={`${s.rise} ${s.lede}`} style={rise(2)}>
              Соревнование существует в трёх местах сразу: таблица в Excel, расписание
              в мессенджере, результаты в голове у одного человека.
            </p>
            <div className={`${s.rise} ${s.tblscroll}`} style={rise(3)}>
              <table className={s.standings}>
                <thead>
                  <tr>
                    <th style={{ width: '24%' }}>Задача</th>
                    <th style={{ width: '38%' }}>Сейчас</th>
                    <th style={{ width: '38%' }}>В Tournable</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.task}>
                      <td><strong>{row.task}</strong></td>
                      <td className={s.now}><span className={`${s.mark} ${s.markL}`}>П</span>{row.now}</td>
                      <td><span className={`${s.mark} ${s.markW}`}>В</span>{row.then}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── 3. Одна система ────────────────────────────────── */}
        <section {...slideProps(idx.system)}>
          <div className={s.inner}>
            <p className={`${s.rise} ${s.eyebrow}`} style={rise(0)}>Что это</p>
            <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>Одна система на весь цикл</h2>
            <p className={`${s.rise} ${s.lede}`} style={rise(2)}>
              От настройки формата до публичной страницы с итогами. Веб-платформа,
              без установки, работает в браузере на телефоне и компьютере.
            </p>
            <div className={`${s.rise} ${s.grid} ${s.c2}`} style={rise(3)}>
              {PILLARS.map((c) => (
                <div className={s.cell} key={c.k}>
                  <span className={s.k}>{c.k}</span>
                  <h3>{c.h}</h3>
                  <p>{c.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Форматы ─────────────────────────────────────── */}
        <section {...slideProps(idx.formats)}>
          <div className={s.inner}>
            <p className={`${s.rise} ${s.eyebrow}`} style={rise(0)}>Форматы</p>
            <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>Регламент выбирается, не пишется</h2>
            <p className={`${s.rise} ${s.lede}`} style={rise(2)}>
              Пять схем розыгрыша покрывают почти любое соревнование. Расписание и сетка
              строятся под выбранный формат сами.
            </p>
            <div className={`${s.rise} ${s.formats}`} style={rise(3)}>
              {FORMATS.map((f) => (
                <div className={s.format} key={f.key}>
                  <FormatDiagram format={f.key} className={s.formatSvg} />
                  <span className={s.formatName}>{f.name}</span>
                  <p>{f.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5–10. Экраны продукта ──────────────────────────── */}
        {SCREENS.map((shot, i) => (
          <section {...slideProps(screenFrom + i)} key={shot.src}>
            <div className={`${s.inner} ${s.split}`}>
              <div>
                <p className={`${s.rise} ${s.tag}`} style={rise(0)}>{shot.tag}</p>
                <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>{shot.heading}</h2>
                <p className={`${s.rise} ${s.lede}`} style={rise(2)}>{shot.text}</p>
              </div>
              <div className={`${s.rise} ${s.frame}`} style={rise(3)}>
                <div className={s.bar}>
                  <i /><i /><i />
                  <span>{shot.chrome}</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={shot.src} alt={shot.alt} width={1500} height={937}
                  loading={i < 2 ? 'eager' : 'lazy'}
                />
              </div>
            </div>
          </section>
        ))}

        {/* ── 11. Табло ──────────────────────────────────────── */}
        <section {...slideProps(rest.board)}>
          <div className={`${s.inner} ${s.split}`}>
            <div>
              <p className={`${s.rise} ${s.tag}`} style={rise(0)}>Табло</p>
              <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>Табло на любом экране</h2>
              <p className={`${s.rise} ${s.lede}`} style={rise(2)}>
                Счёт, таймер, периоды и события матча выводятся на телевизор, проектор или
                светодиодный экран. Обновление идёт в реальном времени с того же устройства,
                с которого судья ведёт матч.
              </p>
            </div>
            <div className={`${s.rise} ${s.frame}`} style={rise(3)}>
              <div
                className={s.shotBoard}
                role="img"
                aria-label="Табло Tournable на светодиодном экране стадиона: счёт, таймер, лента событий матча"
              />
            </div>
          </div>
        </section>

        {/* ── 12. Организация работы ─────────────────────────── */}
        <section {...slideProps(rest.caps)}>
          <div className={s.inner}>
            <p className={`${s.rise} ${s.eyebrow}`} style={rise(0)}>Организация работы</p>
            <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>Роли, доступы, несколько турниров</h2>
            <div className={`${s.rise} ${s.grid} ${s.c3}`} style={rise(2)}>
              {CAPABILITIES.map((c) => (
                <div className={s.cell} key={c.k}>
                  <span className={s.k}>{c.k}</span>
                  <h3>{c.h}</h3>
                  <p>{c.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 13. Внедрение ──────────────────────────────────── */}
        <section {...slideProps(rest.stages)}>
          <div className={s.inner}>
            <p className={`${s.rise} ${s.eyebrow}`} style={rise(0)}>Внедрение</p>
            <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>Запуск за один цикл</h2>
            <p className={`${s.rise} ${s.lede}`} style={rise(2)}>
              Без интеграции с внутренними системами, установки и обучения. От первого
              разговора до первого сыгранного тура — недели, а не кварталы.
            </p>
            <div className={`${s.rise} ${s.stages}`} style={rise(3)}>
              {STAGES.map((st) => (
                <div className={s.stage} key={st.no}>
                  <div className={`${s.no} ${s.num}`}>{st.no}</div>
                  <div>
                    <h3>{st.h}</h3>
                    <p>{st.p}</p>
                  </div>
                  <div className={s.when}>{st.when}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 14. Тарифы ─────────────────────────────────────── */}
        <section {...slideProps(rest.plans)}>
          <div className={s.inner}>
            <p className={`${s.rise} ${s.eyebrow}`} style={rise(0)}>Условия</p>
            <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>Тарифы</h2>
            <p className={`${s.rise} ${s.lede}`} style={rise(2)}>
              Оплата в тенге, договор с казахстанским юридическим лицом, закрывающие
              документы. Годовая оплата — со скидкой 25%.
            </p>
            <div className={`${s.rise} ${s.plans}`} style={rise(3)}>
              {PLANS.map((p) => (
                <div className={`${s.plan} ${p.lead ? s.planLead : ''}`} key={p.name}>
                  <div className={s.planName}>{p.name}</div>
                  <div className={`${s.price} ${s.num}`}>{p.price}</div>
                  <div className={s.sub}>{p.sub}</div>
                  <ul>{p.items.map((i) => <li key={i}>{i}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 15. Следующий шаг ──────────────────────────────── */}
        <section {...slideProps(rest.close)}>
          <div className={s.inner}>
            <p className={`${s.rise} ${s.eyebrow}`} style={rise(0)}>Следующий шаг</p>
            <h2 className={`${s.rise} ${s.display}`} style={rise(1)}>Проведём один тур вместе</h2>
            <p className={`${s.rise} ${s.lede}`} style={rise(2)}>
              Самый короткий способ проверить платформу — взять ближайший тур вашего
              соревнования и провести его в Tournable. Настройку берём на себя.
            </p>
            <div className={s.rise} style={rise(3)}>
              <a className={s.cta} href="https://tournable.app">Открыть tournable.app</a>
            </div>
            <div className={`${s.rise} ${s.meta}`} style={rise(4)}>
              <div><b>Платформа</b>tournable.app<br />Веб-приложение, без установки</div>
              <div><b>Связь</b><a href="https://wa.me/message/YHLE2IFII4MSJ1">WhatsApp для организаций</a></div>
              <div><b>Оператор</b>ИП «Tournable.app»<br />Республика Казахстан, Астана</div>
            </div>
          </div>
        </section>

      </div>

      <div className={`${s.hint} ${moved ? s.hintHidden : ''}`} aria-hidden="true">
        <MoveHorizontal size={15} /> Свайп или стрелки
      </div>

      <nav className={s.hud} aria-label="Навигация по слайдам">
        <div className={s.counter}>
          <b>{String(current + 1).padStart(2, '0')}</b> / {String(total).padStart(2, '0')}
        </div>

        <div className={s.rail}>
          {TITLES.map((title, i) => (
            <button
              key={title + i}
              type="button"
              className={`${s.railItem} ${i <= current ? s.railOn : ''}`}
              onClick={() => goTo(i)}
              title={`${i + 1}. ${title}`}
              aria-label={`Перейти к слайду ${i + 1}: ${title}`}
              aria-current={i === current ? 'true' : undefined}
            />
          ))}
        </div>

        <div className={s.navBtns}>
          <button
            type="button" className={s.navBtn} onClick={() => goTo(current - 1)}
            disabled={current === 0} aria-label="Предыдущий слайд"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button" className={s.navBtn} onClick={() => goTo(current + 1)}
            disabled={current === total - 1} aria-label="Следующий слайд"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </nav>
    </div>
  )
}
