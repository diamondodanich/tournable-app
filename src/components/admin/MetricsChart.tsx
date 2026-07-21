'use client'

import { useState, useMemo, useRef } from 'react'
import { Table2, ChartLine } from 'lucide-react'
import type { TimeseriesPoint } from '@/lib/metrics'

// Палитра проверена валидатором dataviz в обеих темах:
// light  #059669 / #2a78d6 на #ffffff — все проверки пройдены
// dark   #0ba876 / #3987e5 на #16161c — все проверки пройдены
// Значения задаются CSS-переменными в globals.css (.metrics-chart), чтобы
// тёмная тема переключалась без JS.

type Mode = 'cumulative' | 'daily'

const PERIODS = [
  { days: 7,  label: '7 дней'  },
  { days: 30, label: '30 дней' },
  { days: 90, label: '90 дней' },
] as const

const W = 720
const H = 260
const PAD = { top: 16, right: 16, bottom: 28, left: 40 }

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

function fmtDayLong(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

/**
 * Округляет верх шкалы до «чистого» ЧЁТНОГО числа: тогда средняя засечка
 * (max/2) — целое, и подписи оси идут ровным шагом (0/2/4, а не 0/3/5).
 */
function niceMax(v: number) {
  if (v <= 4) return 4
  const mag = Math.pow(10, Math.floor(Math.log10(v)))
  const m = Math.ceil(v / mag) * mag
  return m % 2 === 0 ? m : m + mag
}

export default function MetricsChart({
  data,
  days,
  onPeriodChange,
  pending,
}: {
  data: TimeseriesPoint[]
  days: number
  onPeriodChange: (days: number) => void
  pending: boolean
}) {
  const [mode, setMode] = useState<Mode>('cumulative')
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const series = useMemo(() => {
    const users = data.map(d => (mode === 'cumulative' ? d.cum_signups : d.signups))
    const tours = data.map(d => (mode === 'cumulative' ? d.cum_tournaments : d.tournaments))
    return { users, tours }
  }, [data, mode])

  const max = niceMax(Math.max(1, ...series.users, ...series.tours))

  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const x = (i: number) =>
    PAD.left + (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW)
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH

  const path = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  // Крестовина ищет ближайшую точку по X — читатель целится в дату, а не в линию
  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg || data.length === 0) return
    const rect = svg.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    const ratio = (px - PAD.left) / plotW
    const idx = Math.round(ratio * (data.length - 1))
    setHover(Math.min(Math.max(idx, 0), data.length - 1))
  }

  const ticks = [0, 0.5, 1].map(t => Math.round(max * t))
  // Не более 6 подписей по оси X, иначе они наезжают друг на друга
  const xStep = Math.max(1, Math.ceil(data.length / 6))

  const hoverPoint = hover !== null ? data[hover] : null

  return (
    <div className="metrics-chart bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* ── Управление ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-100">
        <div className="flex rounded-lg bg-gray-100 p-0.5">
          {PERIODS.map(p => (
            <button
              key={p.days}
              onClick={() => onPeriodChange(p.days)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                days === p.days ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg bg-gray-100 p-0.5">
          <button
            onClick={() => setMode('cumulative')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
              mode === 'cumulative' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Всего
          </button>
          <button
            onClick={() => setMode('daily')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
              mode === 'daily' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            За день
          </button>
        </div>

        <button
          onClick={() => setView(v => (v === 'chart' ? 'table' : 'chart'))}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          aria-label={view === 'chart' ? 'Показать таблицей' : 'Показать графиком'}
        >
          {view === 'chart' ? <Table2 size={14} /> : <ChartLine size={14} />}
          {view === 'chart' ? 'Таблица' : 'График'}
        </button>
      </div>

      {/* ── Легенда ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 pt-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
          <svg width="14" height="4" aria-hidden="true"><line x1="0" y1="2" x2="14" y2="2" stroke="var(--mc-users)" strokeWidth="2" strokeLinecap="round" /></svg>
          Пользователи
        </span>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
          <svg width="14" height="4" aria-hidden="true"><line x1="0" y1="2" x2="14" y2="2" stroke="var(--mc-tours)" strokeWidth="2" strokeLinecap="round" /></svg>
          Турниры
        </span>
      </div>

      {view === 'table' ? (
        <div className="p-4 overflow-x-auto max-h-[320px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white/95">
              <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                <th className="text-left font-bold py-2">Дата</th>
                <th className="text-right font-bold py-2">Пользователи</th>
                <th className="text-right font-bold py-2">Турниры</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={d.day} className="border-b border-gray-50 last:border-0">
                  <td className="py-1.5 text-gray-500 tabular-nums">{fmtDay(d.day)}</td>
                  <td className="py-1.5 text-right tabular-nums font-semibold text-gray-900">{series.users[i]}</td>
                  <td className="py-1.5 text-right tabular-nums text-gray-600">{series.tours[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={`p-2 transition-opacity ${pending ? 'opacity-50' : 'opacity-100'}`}>
          <div className="relative">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className="w-full h-auto touch-none"
              onPointerMove={handleMove}
              onPointerLeave={() => setHover(null)}
              role="img"
              aria-label={`График: пользователи и турниры за ${days} дней`}
            >
              {/* Сетка — рецессивная, сплошная 1px */}
              {ticks.map(t => (
                <g key={t}>
                  <line
                    x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)}
                    stroke="var(--mc-grid)" strokeWidth="1"
                  />
                  <text
                    x={PAD.left - 8} y={y(t) + 4}
                    textAnchor="end" fontSize="11" fill="var(--mc-muted)"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {t}
                  </text>
                </g>
              ))}

              {/* Подписи дат */}
              {data.map((d, i) =>
                i % xStep === 0 || i === data.length - 1 ? (
                  <text
                    key={d.day} x={x(i)} y={H - 8}
                    textAnchor="middle" fontSize="11" fill="var(--mc-muted)"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {fmtDay(d.day)}
                  </text>
                ) : null
              )}

              {/* Крестовина */}
              {hover !== null && (
                <line
                  x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH}
                  stroke="var(--mc-axis)" strokeWidth="1"
                />
              )}

              {/* Линии: 2px, скруглённые стыки */}
              <path d={path(series.tours)} fill="none" stroke="var(--mc-tours)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              <path d={path(series.users)} fill="none" stroke="var(--mc-users)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

              {/* Точки под курсором — кольцо цветом поверхности */}
              {hover !== null && (
                <>
                  <circle cx={x(hover)} cy={y(series.tours[hover])} r="5"
                    fill="var(--mc-tours)" stroke="var(--mc-surface)" strokeWidth="2" />
                  <circle cx={x(hover)} cy={y(series.users[hover])} r="5"
                    fill="var(--mc-users)" stroke="var(--mc-surface)" strokeWidth="2" />
                </>
              )}

              {/* Прямая подпись на конце — значение последней точки */}
              {data.length > 0 && hover === null && (
                <>
                  <circle cx={x(data.length - 1)} cy={y(series.users[data.length - 1])} r="4"
                    fill="var(--mc-users)" stroke="var(--mc-surface)" strokeWidth="2" />
                  <circle cx={x(data.length - 1)} cy={y(series.tours[data.length - 1])} r="4"
                    fill="var(--mc-tours)" stroke="var(--mc-surface)" strokeWidth="2" />
                </>
              )}
            </svg>

            {/* Тултип: значение ведёт, подпись следует */}
            {hoverPoint && (
              <div
                className="absolute top-2 pointer-events-none bg-white rounded-xl border border-gray-200 shadow-lg px-3 py-2 text-xs whitespace-nowrap"
                style={{
                  left: `${(x(hover!) / W) * 100}%`,
                  transform: hover! > data.length / 2 ? 'translateX(-108%)' : 'translateX(8%)',
                }}
              >
                <div className="font-bold text-gray-900 mb-1">{fmtDayLong(hoverPoint.day)}</div>
                <div className="flex items-center gap-1.5">
                  <svg width="10" height="3" aria-hidden="true"><line x1="0" y1="1.5" x2="10" y2="1.5" stroke="var(--mc-users)" strokeWidth="2" strokeLinecap="round" /></svg>
                  <span className="font-black text-gray-900 tabular-nums">{series.users[hover!]}</span>
                  <span className="text-gray-500">
                    {mode === 'cumulative' ? 'пользователей всего' : 'новых пользователей'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <svg width="10" height="3" aria-hidden="true"><line x1="0" y1="1.5" x2="10" y2="1.5" stroke="var(--mc-tours)" strokeWidth="2" strokeLinecap="round" /></svg>
                  <span className="font-black text-gray-900 tabular-nums">{series.tours[hover!]}</span>
                  <span className="text-gray-500">
                    {mode === 'cumulative' ? 'турниров всего' : 'новых турниров'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
