import { Team, Fixture } from '@/types'
import TeamAvatar from './TeamAvatar'
import { computeStandings } from './StandingsTable'
import { tx, type Lang } from '@/lib/i18n'

type PointsConfig = { win?: number; draw?: number; loss?: number }

/**
 * Cross-table of results: rows = home team, columns = away team.
 * Teams are ordered by current standings so the matrix lines up with the table.
 */
export default function MatchMatrix({
  teams, fixtures, pointsWin, pointsDraw, pointsLoss, lang = 'ru',
}: {
  teams: Team[]
  fixtures: Fixture[]
  pointsWin?: number
  pointsDraw?: number
  pointsLoss?: number
  lang?: Lang
}) {
  const T = tx[lang]
  const pts: PointsConfig = { win: pointsWin, draw: pointsDraw, loss: pointsLoss }

  // Order teams by standings rank for a readable triangular layout.
  const ranked = computeStandings(teams, fixtures, pts)
  const ordered = ranked
    .map(r => teams.find(t => t.id === r.teamId))
    .filter((t): t is Team => !!t)

  if (ordered.length < 2) return null

  // Lookup: played, non-bye fixture for a given (home, away) pair.
  const byPair = new Map<string, Fixture>()
  fixtures
    .filter(f => f.played && !f.is_bye && f.home_team_id && f.away_team_id)
    .forEach(f => { byPair.set(`${f.home_team_id}|${f.away_team_id}`, f) })

  const hasAnyResult = byPair.size > 0
  if (!hasAnyResult) return null

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-sm text-gray-500 font-medium">{T.matrixTitle}</span>
        <span className="text-xs text-gray-400">— {T.matrixHint}</span>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-2">
        <table className="border-separate" style={{ borderSpacing: 2 }}>
          <thead>
            <tr>
              {/* Corner */}
              <th className="sticky left-0 z-10 bg-white" />
              {ordered.map((t, j) => (
                <th key={t.id} className="w-11 h-9 align-bottom pb-1">
                  <div className="flex flex-col items-center gap-0.5" title={t.name}>
                    <TeamAvatar name={t.name} logoUrl={t.logo_url} size={20} />
                    <span className="text-[10px] font-black text-gray-400">{j + 1}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordered.map((home, i) => (
              <tr key={home.id}>
                {/* Row header (sticky) */}
                <th className="sticky left-0 z-10 bg-white pr-2 text-left">
                  <div className="flex items-center gap-1.5 min-w-[120px] max-w-[170px]">
                    <span className="w-4 text-center text-[10px] font-black text-gray-400 shrink-0">{i + 1}</span>
                    <TeamAvatar name={home.name} logoUrl={home.logo_url} size={20} />
                    <span className="text-xs font-bold text-gray-800 truncate">{home.name}</span>
                  </div>
                </th>

                {ordered.map(away => {
                  if (home.id === away.id) {
                    return (
                      <td key={away.id} className="w-11 h-9">
                        <div className="w-full h-9 rounded-md bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-300 text-xs">·</span>
                        </div>
                      </td>
                    )
                  }
                  const f = byPair.get(`${home.id}|${away.id}`)
                  if (!f) {
                    return (
                      <td key={away.id} className="w-11 h-9">
                        <div className="w-full h-9 rounded-md border border-dashed border-gray-100" />
                      </td>
                    )
                  }
                  const hs = f.home_score!, as = f.away_score!
                  const cls = hs > as
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : hs < as
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  return (
                    <td key={away.id} className="w-11 h-9">
                      <div
                        className={`w-full h-9 rounded-md border flex items-center justify-center text-xs font-black tabular-nums ${cls}`}
                        title={`${home.name} ${hs}–${as} ${away.name}`}
                      >
                        {hs}:{as}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
