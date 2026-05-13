'use client'

import { useState } from 'react'
import { Tournament, Team, PlayoffMatch } from '@/types'
import { savePlayoffResult, generatePlayoff } from '@/app/actions/playoff'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trophy, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import TeamAvatar from './TeamAvatar'

function teamName(teams: Team[], id: string | null) {
  return teams.find(t => t.id === id)?.name ?? 'TBD'
}

function teamLogo(teams: Team[], id: string | null) {
  return teams.find(t => t.id === id)?.logo_url ?? null
}

const ROUND_LABELS: Record<number, string> = {
  1: 'Финал',
  2: 'Полуфинал',
  4: 'Четвертьфинал',
  8: '1/8 финала',
  16: '1/16 финала',
}

function MatchCard({ match, teams, tournamentId }: { match: PlayoffMatch; teams: Team[]; tournamentId: string }) {
  const [homeScore, setHomeScore] = useState(match.home_score?.toString() ?? '')
  const [awayScore, setAwayScore] = useState(match.away_score?.toString() ?? '')
  const [saving, setSaving] = useState(false)

  const homeName = teamName(teams, match.home_team_id)
  const awayName = teamName(teams, match.away_team_id)
  const homeLogo = teamLogo(teams, match.home_team_id)
  const awayLogo = teamLogo(teams, match.away_team_id)

  const isDone = match.winner_id !== null
  const isReady = match.home_team_id && match.away_team_id

  async function handleSave() {
    const hs = parseInt(homeScore)
    const as_ = parseInt(awayScore)
    if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) { toast.error('Введите корректный счёт'); return }
    if (hs === as_) { toast.error('В плей-офф ничьей быть не может'); return }
    setSaving(true)
    const res = await savePlayoffResult(match.id, tournamentId, hs, as_)
    if (res?.error) toast.error(res.error)
    else toast.success('Результат сохранён')
    setSaving(false)
  }

  return (
    <div className={`bg-white border rounded-xl p-3 shadow-sm min-w-[220px] ${isDone ? 'border-emerald-200' : isReady ? 'border-amber-200' : 'border-gray-100 opacity-60'}`}>
      {[
        { id: match.home_team_id, name: homeName, logo: homeLogo, score: homeScore, setScore: setHomeScore, isWinner: match.winner_id === match.home_team_id },
        { id: match.away_team_id, name: awayName, logo: awayLogo, score: awayScore, setScore: setAwayScore, isWinner: match.winner_id === match.away_team_id },
      ].map((side, i) => (
        <div key={i} className={`flex items-center gap-2 py-1.5 ${i === 0 ? 'border-b border-dashed border-gray-100' : ''}`}>
          <TeamAvatar name={side.name} logoUrl={side.logo} size={22} />
          <span className={`flex-1 text-sm font-semibold truncate ${side.isWinner ? 'text-emerald-700' : 'text-gray-800'}`}>
            {side.name}
            {side.isWinner && <Trophy size={11} className="inline ml-1 text-amber-500" />}
          </span>
          <Input
            type="number" min={0} max={99}
            value={side.score}
            onChange={e => side.setScore(e.target.value)}
            disabled={!isReady}
            className="w-12 h-7 text-center font-mono font-bold text-sm p-1"
          />
        </div>
      ))}
      {isReady && (
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="w-full mt-2 h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
        >
          {saving ? '…' : isDone ? 'Обновить' : 'Сохранить'}
        </Button>
      )}
    </div>
  )
}

export default function PlayoffTab({ tournament, teams, matches }: {
  tournament: Tournament
  teams: Team[]
  matches: PlayoffMatch[]
}) {
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    if (teams.length < 2) { toast.error('Нужно минимум 2 команды'); return }
    setGenerating(true)
    const res = await generatePlayoff(tournament.id)
    if (res?.error) toast.error(res.error)
    else toast.success('Сетка создана!')
    setGenerating(false)
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <p className="text-5xl mb-4">🏆</p>
        <p className="font-bold text-gray-700 text-lg mb-2">Сетка плей-офф</p>
        <p className="text-sm text-gray-400 mb-6">Добавьте команды и сгенерируйте сетку</p>
        <Button onClick={handleGenerate} disabled={generating || teams.length < 2} className="bg-emerald-600 hover:bg-emerald-700">
          {generating ? 'Генерируем…' : 'Создать сетку'}
        </Button>
      </div>
    )
  }

  // Group by round_order, sort descending (largest = first round)
  const rounds = [...new Set(matches.map(m => m.round_order))].sort((a, b) => b - a)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generating}
          className="gap-2 text-xs"
        >
          <RefreshCw size={13} /> {generating ? '…' : 'Пересоздать'}
        </Button>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-8 min-w-max">
          {rounds.map(ro => (
            <div key={ro} className="flex flex-col gap-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 text-center">
                {ROUND_LABELS[ro] ?? `Раунд ${ro}`}
              </p>
              <div className="flex flex-col gap-4 justify-around flex-1">
                {matches.filter(m => m.round_order === ro).sort((a, b) => a.match_order - b.match_order).map(m => (
                  <MatchCard key={m.id} match={m} teams={teams} tournamentId={tournament.id} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
