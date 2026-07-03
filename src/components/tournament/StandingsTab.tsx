'use client'

import { useState } from 'react'
import { Team, Fixture, Tournament } from '@/types'
import { BarChart2, Trophy, Shirt } from 'lucide-react'
import ExportButtons from './ExportButtons'
import StandingsTable from './StandingsTable'
import MatchMatrix from './MatchMatrix'
import SquadEditor from '@/components/championship/SquadEditor'
import { tx, type Lang } from '@/lib/i18n'

const SQUAD_HINT: Record<Lang, string> = {
  ru: 'Нажмите на название команды, чтобы собрать состав по схеме.',
  kz: 'Құрамды схема бойынша жинау үшін команда атауын басыңыз.',
  en: 'Tap a team name to build its squad by formation.',
}

export default function StandingsTab({
  teams, fixtures, tournamentName = 'Турнир', tournament, lang = 'ru',
  squadEdit, leagueTeamMap,
}: {
  teams: Team[]
  fixtures: Fixture[]
  tournamentName?: string
  tournament?: Tournament
  lang?: Lang
  squadEdit?: { leagueId: string; brand: string }
  leagueTeamMap?: Record<string, string | null>
}) {
  const T = tx[lang]
  const [editorTeamId, setEditorTeamId] = useState<string | null>(null)

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

  const canEditSquads = !!squadEdit
  const editorLeagueTeamId = editorTeamId ? (leagueTeamMap?.[editorTeamId] ?? null) : null
  const editorTeamName = editorTeamId ? (teams.find(t => t.id === editorTeamId)?.name ?? '') : ''

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

      {canEditSquads && (
        <div className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 border" style={{ background: `${squadEdit!.brand}12`, borderColor: `${squadEdit!.brand}33` }}>
          <Shirt size={14} className="shrink-0" style={{ color: squadEdit!.brand }} />
          <span className="text-sm font-semibold" style={{ color: squadEdit!.brand }}>{SQUAD_HINT[lang]}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">{T.standingsTitle}</span>
        <ExportButtons elementId="standings-export" fileName={`${slug}-standings`} lang={lang} />
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
            onTeamClick={canEditSquads ? (id => { if (leagueTeamMap?.[id]) setEditorTeamId(id) }) : undefined}
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

      {squadEdit && editorTeamId && editorLeagueTeamId && (
        <SquadEditor
          leagueId={squadEdit.leagueId}
          leagueTeamId={editorLeagueTeamId}
          teamName={editorTeamName}
          sport={tournament?.sport ?? null}
          brand={squadEdit.brand}
          lang={lang}
          onClose={() => setEditorTeamId(null)}
        />
      )}
    </div>
  )
}
