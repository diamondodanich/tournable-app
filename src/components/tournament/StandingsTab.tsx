import { Team, Fixture, Tournament } from '@/types'
import { BarChart2 } from 'lucide-react'
import ExportButtons from './ExportButtons'
import StandingsTable from './StandingsTable'
import { tx, type Lang } from '@/lib/i18n'

export default function StandingsTab({
  teams, fixtures, tournamentName = 'Турнир', tournament, lang = 'ru',
}: {
  teams: Team[]
  fixtures: Fixture[]
  tournamentName?: string
  tournament?: Tournament
  lang?: Lang
}) {
  const T = tx[lang]

  if (teams.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <BarChart2 className="mx-auto mb-3 text-gray-300" size={40} />
        <p className="font-bold text-gray-600">{T.standingsEmpty}</p>
      </div>
    )
  }

  const slug = tournamentName.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">{T.standingsTitle}</span>
        <ExportButtons elementId="standings-export" fileName={`${slug}-standings`} />
      </div>
      {tournament && (tournament.points_win !== 3 || tournament.points_draw !== 1 || tournament.points_loss !== 0) && (
        <p className="text-xs text-gray-400">
          {T.pointsInfo(tournament.points_win ?? 3, tournament.points_draw ?? 1, tournament.points_loss ?? 0)}
        </p>
      )}
      <div className="overflow-x-auto">
        <div id="standings-export" className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <StandingsTable
            teams={teams}
            fixtures={fixtures}
            pointsWin={tournament?.points_win}
            pointsDraw={tournament?.points_draw}
            pointsLoss={tournament?.points_loss}
            playoffZone={
              tournament?.format === 'league_playoff' && tournament.teams_advance
                ? tournament.teams_advance
                : undefined
            }
            lang={lang}
          />
        </div>
      </div>
    </div>
  )
}
