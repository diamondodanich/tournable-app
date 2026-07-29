/**
 * Ключи схем совпадают со значениями `Format` из src/lib/sports.ts —
 * тип живёт здесь, потому что владелец рисунков именно этот компонент,
 * а списки форматов в презентациях могут показывать лишь часть набора.
 */
export type FormatKey =
  | 'round_robin' | 'playoff' | 'double_elim'
  | 'groups_playoff' | 'league_playoff' | 'swiss' | 'leaderboard'

/**
 * Схемы турнирных форматов. Общий viewBox 120×72 у всех пяти, чтобы в ряду
 * они читались как один набор. Цвета берутся из currentColor и --deck-board,
 * поэтому схема сама подстраивается под тему.
 */

const NODE = 'var(--deck-board)'

function RoundRobin() {
  const cx = 60, cy = 36, r = 26
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) }
  })
  const chords: React.ReactElement[] = []
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      chords.push(
        <line
          key={`${i}-${j}`}
          x1={pts[i].x} y1={pts[i].y} x2={pts[j].x} y2={pts[j].y}
          stroke="currentColor" strokeWidth="1" opacity=".38"
        />,
      )
    }
  }
  return (
    <>
      {chords}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="5" fill={NODE} />
      ))}
    </>
  )
}

function Bar({ x, y, w = 24, h = 8, lead = false }: { x: number; y: number; w?: number; h?: number; lead?: boolean }) {
  return (
    <rect
      x={x} y={y} width={w} height={h} rx="2.5"
      fill={lead ? NODE : 'currentColor'}
      opacity={lead ? 1 : .28}
    />
  )
}

const LINE = { stroke: 'currentColor', strokeWidth: 1.4, fill: 'none', opacity: .5 } as const

function Playoff() {
  return (
    <>
      <Bar x={6} y={6} /><Bar x={6} y={20} /><Bar x={6} y={40} /><Bar x={6} y={54} />
      <Bar x={48} y={13} /><Bar x={48} y={47} />
      <Bar x={90} y={30} lead />
      <path d="M30 10 H39 V24 H30" {...LINE} />
      <path d="M39 17 H48" {...LINE} />
      <path d="M30 44 H39 V58 H30" {...LINE} />
      <path d="M39 51 H48" {...LINE} />
      <path d="M72 17 H81 V51 H72" {...LINE} />
      <path d="M81 34 H90" {...LINE} />
    </>
  )
}

function GroupBox({ y, label }: { y: number; label: string }) {
  return (
    <>
      <rect x={4} y={y} width={42} height={26} rx="4" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".38" />
      <text x={9} y={y + 11} fontSize="8" fill="currentColor" opacity=".75" fontWeight="700">{label}</text>
      <rect x={9} y={y + 15} width={20} height={3} rx="1.5" fill={NODE} />
      <rect x={9} y={y + 20} width={28} height={3} rx="1.5" fill="currentColor" opacity=".28" />
    </>
  )
}

function GroupsPlayoff() {
  return (
    <>
      <GroupBox y={6} label="A" />
      <GroupBox y={40} label="B" />
      <Bar x={62} y={14} w={20} /><Bar x={62} y={50} w={20} />
      <Bar x={96} y={32} w={20} lead />
      <path d="M46 19 H62" {...LINE} />
      <path d="M46 53 H62" {...LINE} />
      <path d="M82 18 H89 V54 H82" {...LINE} />
      <path d="M89 36 H96" {...LINE} />
    </>
  )
}

function LeaguePlayoff() {
  const rows = [8, 18, 28, 38, 48]
  return (
    <>
      {rows.map((y, i) => (
        <rect
          key={y} x={4} y={y} width={44} height={7} rx="2"
          fill={i < 2 ? NODE : 'currentColor'} opacity={i < 2 ? 1 : .24}
        />
      ))}
      <Bar x={88} y={11} w={26} h={10} lead />
      <path d="M48 11.5 H68 V21.5 H48" {...LINE} />
      <path d="M68 16.5 H88" {...LINE} />
    </>
  )
}

/** Две сетки: проигравший в верхней падает в нижнюю и получает второй шанс. */
function DoubleElim() {
  return (
    <>
      {/* верхняя сетка */}
      <Bar x={4} y={4} w={20} h={7} /><Bar x={4} y={15} w={20} h={7} />
      <Bar x={40} y={9} w={20} h={7} />
      <Bar x={92} y={30} w={24} h={9} lead />
      <path d="M24 7.5 H32 V18.5 H24" {...LINE} />
      <path d="M32 13 H40" {...LINE} />
      <path d="M60 13 H76 V32 H92" {...LINE} />
      {/* падение в нижнюю сетку */}
      <path d="M14 22 V38" stroke="currentColor" strokeWidth="1.2" fill="none"
        opacity=".42" strokeDasharray="2.5 2.5" />
      <path d="M14 40 l-2.4 -4 h4.8 z" fill="currentColor" opacity=".42" transform="rotate(180 14 38)" />
      {/* нижняя сетка */}
      <Bar x={4} y={44} w={20} h={7} /><Bar x={4} y={55} w={20} h={7} />
      <Bar x={40} y={49} w={20} h={7} />
      <path d="M24 47.5 H32 V58.5 H24" {...LINE} />
      <path d="M32 53 H40" {...LINE} />
      <path d="M60 53 H76 V37 H92" {...LINE} />
    </>
  )
}

/** Ранжирование по сумме очков, без пар: гонки, battle royale, лёгкая атлетика. */
function Leaderboard() {
  const rows = [10, 22, 34, 46, 58]
  return (
    <>
      {rows.map((y, i) => (
        <g key={y}>
          <circle cx={9} cy={y + 3.5} r="3.5" fill={i === 0 ? NODE : 'currentColor'} opacity={i === 0 ? 1 : .26} />
          <rect x={18} y={y} width={62 - i * 9} height={7} rx="2"
            fill={i === 0 ? NODE : 'currentColor'} opacity={i === 0 ? 1 : .26} />
          <rect x={102} y={y} width={12} height={7} rx="2"
            fill="currentColor" opacity={i === 0 ? .5 : .2} />
        </g>
      ))}
    </>
  )
}

function Swiss() {
  return (
    <>
      <Bar x={6} y={6} w={22} /><Bar x={6} y={20} w={22} />
      <Bar x={6} y={44} w={22} /><Bar x={6} y={58} w={22} />
      <Bar x={92} y={6} w={22} lead /><Bar x={92} y={20} w={22} />
      <Bar x={92} y={44} w={22} /><Bar x={92} y={58} w={22} />
      <path d="M28 10 H92" {...LINE} />
      <path d="M28 24 C 55 24, 65 48, 92 48" {...LINE} />
      <path d="M28 48 C 55 48, 65 24, 92 24" {...LINE} />
      <path d="M28 62 H92" {...LINE} />
    </>
  )
}

const SHAPES: Record<FormatKey, () => React.ReactElement> = {
  round_robin: RoundRobin,
  playoff: Playoff,
  double_elim: DoubleElim,
  groups_playoff: GroupsPlayoff,
  league_playoff: LeaguePlayoff,
  swiss: Swiss,
  leaderboard: Leaderboard,
}

export default function FormatDiagram({ format, className }: { format: FormatKey; className?: string }) {
  const Shape = SHAPES[format]
  return (
    <svg viewBox="0 0 120 72" className={className} role="presentation" focusable="false">
      <Shape />
    </svg>
  )
}
