'use client'

import { useRouter } from 'next/navigation'
import { Team, Fixture, Tournament } from '@/types'
import { BarChart2, Trophy, ArrowRight } from 'lucide-react'
import ExportButtons from './ExportButtons'
import StandingsTable from './StandingsTable'
import MatchMatrix from './MatchMatrix'
import { tx, type Lang } from '@/lib/i18n'

const TEAM_HINT: Record<Lang, string> = {
  ru: 'Нажмите на команду — откроется её страница: состав, результаты и календарь.',
  kz: 'Командаға басыңыз — оның беті ашылады: құрам, нәтижелер және күнтізбе.',
  en: 'Tap a team to open its page: squad, results and calendar.',
}

export default function StandingsTab({
  teams, fixtures, tournamentName = 'Турнир', tournament, lang = 'ru',
  teamHrefs, teamLinkBrand, isPro = false,
}: {
  teams: Team[]
  fixtures: Fixture[]
  tournamentName?: string
  tournament?: Tournament
  lang?: Lang
  teamHrefs?: Record<string, string>
  teamLinkBrand?: string
  isPro?: boolean
}) {
  const T = tx[lang]
  const router = useRouter()

  if (teams.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <BarChart2 className="mx-auto mb-3 text-gray-300" size={40} />
        <p className="font-bold text-gray-600">{T.standingsEmpty}</p>
      </div>
    )
  }

  const slug = tournamentName.toLowerCase().replace(/\s+/g, '-')

  const leagueAdvance = tournament?.format === 'league_playoff' && tournament.teams_advance
    ? tournament.teams_advance
    : null

  const hasLinks = !!teamHrefs && Object.keys(teamHrefs).length > 0
  const brand = teamLinkBrand ?? '#7c3aed'

  return (
    <div className="space-y-3">
      {leagueAdvance && (
        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
          <Trophy size={13} className="text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold text-emerald-700">
            Топ <strong>{leagueAdvance}</strong> {leagueAdvance === 1 ? 'команда выходит' : leagueAdvance <= 4 ? 'команды выходят' : 'команд выходят'} в плей-офф
          </span>
        </div>
      )}

      {hasLinks && (
        <div className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 border" style={{ background: `${brand}12`, borderColor: `${brand}33` }}>
          <ArrowRight size={14} className="shrink-0" style={{ color: brand }} />
          <span className="text-sm font-semibold" style={{ color: brand }}>{TEAM_HINT[lang]}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">{T.standingsTitle}</span>
        <ExportButtons elementId="standings-export" fileName={`${slug}-standings`} lang={lang} isPro={isPro} />
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
            byeWin={tournament?.format === 'swiss'}
            onTeamClick={hasLinks ? (id => { const href = teamHrefs?.[id]; if (href) router.push(href) }) : undefined}
            lang={lang}
          />
        </div>
      </div>

      <MatchMatrix
        teams={teams}
        fixtures={fixtures}
        pointsWin={tournament?.points_win}
        pointsDraw={tournament?.points_draw}
        pointsLoss={tournament?.points_loss}
        lang={lang}
      />
    </div>
  )
}
