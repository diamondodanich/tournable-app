import { Team, Fixture } from '@/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ExportButtons from './ExportButtons'
import ScorersTable, { computeScorers } from './ScorersTable'

export default function ScorersTab({ teams, fixtures }: { teams: Team[]; fixtures: Fixture[] }) {
  const list = computeScorers(teams, fixtures)

  if (list.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center mx-auto mb-3">
          <span className="inline-block w-4 h-4 rounded-full bg-emerald-300" />
        </div>
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
