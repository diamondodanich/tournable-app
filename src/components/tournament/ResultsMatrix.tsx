import { Team, Fixture } from '@/types'

type CellResult = { scores: string[]; outcome: 'W' | 'D' | 'L' | null }

function buildMatrix(teams: Team[], fixtures: Fixture[]): Map<string, CellResult> {
  // key = `${homeId}|${awayId}`
  const map = new Map<string, CellResult>()

  fixtures
    .filter(f => f.played && !f.is_bye && f.home_team_id && f.away_team_id)
    .sort((a, b) => a.matchday - b.matchday)
    .forEach(f => {
      const key = `${f.home_team_id}|${f.away_team_id}`
      const score = `${f.home_score}:${f.away_score}`
      const outcome: 'W' | 'D' | 'L' =
        f.home_score! > f.away_score! ? 'W' :
        f.home_score! < f.away_score! ? 'L' : 'D'

      if (!map.has(key)) map.set(key, { scores: [], outcome: null })
      const cell = map.get(key)!
      cell.scores.push(score)
      // last result wins for color
      cell.outcome = outcome
    })

  return map
}

const CELL_COLORS = {
  W: 'bg-emerald-50 text-emerald-700',
  D: 'bg-amber-50 text-amber-700',
  L: 'bg-red-50 text-red-600',
}

export default function ResultsMatrix({ teams, fixtures }: { teams: Team[]; fixtures: Fixture[] }) {
  if (teams.length < 2) return null

  const matrix = buildMatrix(teams, fixtures)
  const hasAnyResult = matrix.size > 0

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {/* top-left empty cell */}
            <th className="border border-gray-200 bg-gray-50 p-2 min-w-[100px] text-left text-xs text-gray-400 font-medium">
              Дом \ Гость
            </th>
            {teams.map(t => (
              <th
                key={t.id}
                className="border border-gray-200 bg-gray-50 p-2 text-center text-xs font-bold text-gray-700 min-w-[72px]"
              >
                {t.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map(home => (
            <tr key={home.id}>
              <td className="border border-gray-200 bg-gray-50 p-2 text-xs font-bold text-gray-700 whitespace-nowrap">
                {home.name}
              </td>
              {teams.map(away => {
                if (home.id === away.id) {
                  return (
                    <td key={away.id} className="border border-gray-200 bg-gray-200 text-center text-gray-400">
                      —
                    </td>
                  )
                }
                const cell = matrix.get(`${home.id}|${away.id}`)
                if (!cell || !hasAnyResult) {
                  return (
                    <td key={away.id} className="border border-gray-200 text-center text-gray-300 py-2">
                      ·
                    </td>
                  )
                }
                return (
                  <td
                    key={away.id}
                    className={`border border-gray-200 text-center font-mono font-bold py-2 px-1 ${CELL_COLORS[cell.outcome!]}`}
                  >
                    {cell.scores.join(' / ')}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {hasAnyResult && (
        <p className="text-xs text-gray-400 mt-1">
          Строка = хозяева, столбец = гости. Цвет с позиции хозяев: зелёный — победа, жёлтый — ничья, красный — поражение.
        </p>
      )}
    </div>
  )
}
