'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'
import { Moon, Sun, ArrowLeft, Trophy } from 'lucide-react'
import { TABS, type Block } from './content'
import s from './playbook.module.css'

/** **жирный** внутри строки — иначе пришлось бы держать контент в JSX */
function rich(text: string) {
  return text.split('**').map((part, i) =>
    i % 2 === 1 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>
  )
}

function BlockView({ b }: { b: Block }) {
  switch (b.k) {
    case 'sec':
      return (
        <>
          <h2 className={s.sec}>{b.text}</h2>
          {b.sub && <p className={s.secSub}>{b.sub}</p>}
        </>
      )

    case 'p':
      return <p className={s.body}>{rich(b.text)}</p>

    case 'callout':
      return (
        <div className={`${s.callout} ${b.warn ? s.calloutWarn : ''}`}>
          <span className={s.calloutLabel}>{b.label}</span>
          {b.paras.map((t, i) => <p key={i}>{rich(t)}</p>)}
        </div>
      )

    case 'cards':
      return (
        <div className={`${s.grid} ${b.cols === 3 ? s.g3 : s.g2}`}>
          {b.items.map((c, i) => (
            <div key={i} className={s.card}>
              {c.tag && <span className={s.cardTag}>{c.tag}</span>}
              <h3>{c.title}</h3>
              <p>{rich(c.text)}</p>
            </div>
          ))}
        </div>
      )

    case 'steps':
      return (
        <ol className={`${s.steps} ${b.check ? s.stepsCheck : ''}`}>
          {b.items.map((it, i) => (
            <li key={i}>
              <span className={s.stepDo}>{it.do}</span>
              {rich(it.text)}
            </li>
          ))}
        </ol>
      )

    case 'list':
      return (
        <ul className={s.list}>
          {b.items.map((t, i) => <li key={i}>{rich(t)}</li>)}
        </ul>
      )

    case 'table':
      return (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>{b.head.map((h, i) => <th key={i}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j}>{rich(c)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'pills':
      return (
        <div className={s.pills}>
          {b.items.map((p, i) => (
            <span key={i} className={`${s.pill} ${p.brand ? s.pillBrand : ''}`}>{p.text}</span>
          ))}
        </div>
      )

    case 'kpis':
      return (
        <div className={s.kpis}>
          {b.items.map((k, i) => (
            <div key={i} className={s.kpi}>
              <div className={s.kpiV}>{k.v}</div>
              <div className={s.kpiL}>{k.l}</div>
            </div>
          ))}
        </div>
      )

    case 'phases':
      return (
        <div className={s.phases}>
          {b.items.map((p, i) => (
            <div key={i} className={s.phase}>
              <div className={s.phaseBadge}>{p.badge}</div>
              <div>
                <h3>{p.title}</h3>
                <p>{rich(p.text)}</p>
              </div>
            </div>
          ))}
        </div>
      )
  }
}

export default function Playbook({ initialTheme }: { initialTheme: 'light' | 'dark' }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme)
  const [active, setActive] = useState(TABS[0].id)
  const tab = TABS.find(t => t.id === active) ?? TABS[0]

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`
  }

  const themeLabel = theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'

  return (
    <div className={s.root} data-hb-theme={theme} style={{ ['--accent' as string]: tab.color }}>
      <div className={s.top}>
        <div className={s.topInner}>
          <div className={s.brandRow}>
            <div className={s.brand}>
              <span className={s.logo} aria-hidden="true"><Trophy size={18} /></span>
              <div>
                <b>TOURNABLE</b>
                <span>Операционная методичка</span>
              </div>
            </div>
            <div className={s.headActions}>
              <Link href="/dashboard" className={s.iconBtn}>
                <ArrowLeft size={14} />
                Кабинет
              </Link>
              <button type="button" onClick={toggleTheme} className={s.iconBtn} title={themeLabel} aria-label={themeLabel}>
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                {theme === 'dark' ? 'Светлая' : 'Тёмная'}
              </button>
            </div>
          </div>

          <div className={s.tabs} role="tablist" aria-label="Разделы методички">
            {TABS.map(t => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.id === active}
                onClick={() => setActive(t.id)}
                className={`${s.tab} ${t.id === active ? s.tabActive : ''}`}
                style={{ ['--tabc' as string]: t.color }}
              >
                <span className={s.dot} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className={s.main} role="tabpanel">
        <div className={s.banner}>
          <div className={s.eyebrow}>{tab.eyebrow}</div>
          <h1>{tab.h1}</h1>
          <p>{tab.lead}</p>
        </div>

        {tab.blocks.map((b, i) => <BlockView key={i} b={b} />)}
      </main>

      <div className={s.foot}>
        <div className={s.footRule} />
        Приватная страница, доступна только администратору. Материалы для постинга —
        в marketing/content-calendar.xlsx и marketing/threads-bank.xlsx.
      </div>
    </div>
  )
}
