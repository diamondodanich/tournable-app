import { Team, Fixture } from '@/types'
import { Target } from 'lucide-react'
import ExportButtons from './ExportButtons'
import ScorersTable, { computeScorers } from './ScorersTable'

export default function ScorersTab({ teams, fixtures, tournamentName = 'Турнир' }: { teams: Team[]; fixtures: Fixture[]; tournamentName?: string }) {
  const list = computeScorers(teams, fixtures)
  const slug = tournamentName.toLowerCase().replace(/\s+/g, '-')

  if (list.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <Target className="mx-auto mb-3 text-gray-300" size={40} />
        <p className="font-bold text-gray-600 mb-1">Голов пока нет</p>
        <p className="text-sm text-gray-400">Указывайте авторов голов при вводе результатов</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">Бомбардиры</span>
        <ExportButtons elementId="scorers-export" fileName={`${slug}-scorers`} />
      </div>
      <div className="overflow-x-auto">
        <div id="scorers-export" className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <ScorersTable teams={teams} fixtures={fixtures} />
        </div>
      </div>
    </div>
  )
}
