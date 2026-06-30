'use client'

import { Team, Fixture, Tournament } from '@/types'
import StandingsTable from './StandingsTable'
import MatchMatrix from './MatchMatrix'
import ExportButtons from './ExportButtons'
import { BarChart2, Trophy } from 'lucide-react'
import { tx, type Lang } from '@/lib/i18n'

export default function GroupStandingsTab({
  teams,
  fixtures,
  tournament,
  lang = 'ru',
}: {
  teams: Team[]
  fixtures: Fixture[]
  tournament: Tournament
  lang?: Lang
}) {
  const T = tx[lang]

  if (teams.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <BarChart2 className="mx-auto mb-3 text-gray-300" size={40} />
        <p className="font-bold text-gray-600">{T.groupsNotFormed}</p>
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
        <p className="font-bold text-gray-600">{T.groupsNotDistributed}</p>
      </div>
    )
  }

  const teamsAdvancePerGroup = tournament.teams_advance ?? 2
  const slug = tournament.name.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-6">
      {teamsAdvancePerGroup > 0 && (
        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
          <Trophy size={13} className="text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold text-emerald-700">
            Из каждой группы выходят <strong>{teamsAdvancePerGroup}</strong> {teamsAdvancePerGroup === 1 ? 'команда' : teamsAdvancePerGroup <= 4 ? 'команды' : 'команд'}
          </span>
        </div>
      )}
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
                <h3 className="font-black text-gray-900">{T.groupLabel(groupName)}</h3>
                <span className="text-xs text-gray-400 font-medium">
                  {T.teamsCount(groupTeams.length)}
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
                  lang={lang}
                />
              </div>
            </div>

            <div className="mt-3">
              <MatchMatrix
                teams={groupTeams}
                fixtures={groupFixtures}
                pointsWin={tournament.points_win}
                pointsDraw={tournament.points_draw}
                pointsLoss={tournament.points_loss}
                lang={lang}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
