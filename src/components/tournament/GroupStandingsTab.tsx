'use client'

import { Team, Fixture, Tournament } from '@/types'
import StandingsTable from './StandingsTable'
import ExportButtons from './ExportButtons'
import { BarChart2 } from 'lucide-react'

export default function GroupStandingsTab({
  teams,
  fixtures,
  tournament,
}: {
  teams: Team[]
  fixtures: Fixture[]
  tournament: Tournament
}) {
  if (teams.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <BarChart2 className="mx-auto mb-3 text-gray-300" size={40} />
        <p className="font-bold text-gray-600">Группы ещё не сформированы</p>
      </div>
    )
  }

  const groupNames = [
    ...new Set(
      teams.map(t => t.group_name).filter((g): g is string => !!g)
    ),
  ].sort()

  if (groupNames.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <BarChart2 className="mx-auto mb-3 text-gray-300" size={40} />
        <p className="font-bold text-gray-600">Группы пока не распределены</p>
      </div>
    )
  }

  const teamsAdvancePerGroup = tournament.teams_advance ?? 2
  const slug = tournament.name.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-6">
      {groupNames.map(groupName => {
        const groupTeams = teams.filter(t => t.group_name === groupName)
        const groupTeamIds = new Set(groupTeams.map(t => t.id))

        // Fixtures where BOTH teams belong to this group (group-stage matches only)
        const groupFixtures = fixtures.filter(
          f =>
            !f.is_bye &&
            f.home_team_id &&
            f.away_team_id &&
            groupTeamIds.has(f.home_team_id) &&
            groupTeamIds.has(f.away_team_id),
        )

        const exportId = `group-${groupName.toLowerCase()}-standings`

        return (
          <div key={groupName}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-emerald-700">{groupName}</span>
                </div>
                <h3 className="font-black text-gray-900">Группа {groupName}</h3>
                <span className="text-xs text-gray-400 font-medium">
                  · {groupTeams.length} команд
                </span>
              </div>
              <ExportButtons elementId={exportId} fileName={`${slug}-group-${groupName.toLowerCase()}`} />
            </div>

            <div className="overflow-x-auto">
              <div id={exportId} className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <StandingsTable
                  teams={groupTeams}
                  fixtures={groupFixtures}
                  pointsWin={tournament.points_win}
                  pointsDraw={tournament.points_draw}
                  pointsLoss={tournament.points_loss}
                  playoffZone={teamsAdvancePerGroup}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
