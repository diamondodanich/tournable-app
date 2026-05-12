import { Team, Fixture } from '@/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ExportButtons from './ExportButtons'
import ScorersTable, { computeScorers } from './ScorersTable'

export default function ScorersTab({ teams, fixtures }: { teams: Team[]; fixtures: Fixture[] }) {
  const list = computeScorers(teams, fixtures)

  if (list.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <p className="text-4xl mb-3">⚽</p>
        <p className="font-bold text-gray-600 mb-1">Голов пока нет</p>
        <p className="text-sm text-gray-400">Указывайте авторов голов при вводе результатов</p>
      </div>
    )
  }

  return (
    <div id="scorers-export" className="bg-white rounded-2xl border border-gray-200 overflow-x-auto shadow-sm">
      <div className="flex justify-end p-2">
        <ExportButtons elementId="scorers-export" fileName="scorers" />
      </div>
      <ScorersTable teams={teams} fixtures={fixtures} />
    </div>
  )
}
