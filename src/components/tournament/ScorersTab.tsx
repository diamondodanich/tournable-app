import { Team, Fixture } from '@/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Target } from 'lucide-react'

export default function ScorersTab({ teams, fixtures }: { teams: Team[]; fixtures: Fixture[] }) {
  const map = new Map<string, { player: string; teamName: string; goals: number }>()

  fixtures.forEach(f => {
    if (!f.played || f.is_bye) return
    f.scorers?.forEach(s => {
      const name = s.player_name.trim()
      if (!name) return
      const key = `${s.team_id}|${name.toLowerCase()}`
      const teamName = teams.find(t => t.id === s.team_id)?.name ?? '—'
      if (!map.has(key)) map.set(key, { player: name, teamName, goals: 0 })
      map.get(key)!.goals++
    })
  })

  const list = [...map.values()].sort((a, b) => b.goals - a.goals || a.player.localeCompare(b.player, 'ru'))

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
    <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-amber-50">
            <TableHead className="w-16 text-center text-amber-700">#</TableHead>
            <TableHead className="text-amber-700">Игрок</TableHead>
            <TableHead className="text-amber-700">Команда</TableHead>
            <TableHead className="text-center text-amber-700 w-16">Голы</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((p, i) => (
            <TableRow key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
              <TableCell className="text-center font-bold text-gray-500">{i + 1}</TableCell>
              <TableCell className="font-bold text-gray-900">{p.player}</TableCell>
              <TableCell className="text-gray-500">{p.teamName}</TableCell>
              <TableCell className="text-center font-black text-emerald-600 text-lg">{p.goals}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
