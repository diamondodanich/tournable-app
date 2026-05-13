import { Team, Fixture } from '@/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import TeamAvatar from './TeamAvatar'

export function computeScorers(teams: Team[], fixtures: Fixture[]) {
  const map = new Map<string, { player: string; teamName: string; logoUrl: string | null; goals: number }>()

  fixtures.forEach(f => {
    if (!f.played || f.is_bye) return
    f.match_events?.filter(e => e.type === 'goal').forEach(e => {
      const name = e.player_name.trim()
      if (!name) return
      const key = `${e.team_id}|${name.toLowerCase()}`
      const team = teams.find(t => t.id === e.team_id)
      if (!map.has(key)) map.set(key, { player: name, teamName: team?.name ?? '—', logoUrl: team?.logo_url ?? null, goals: 0 })
      map.get(key)!.goals++
    })
  })

  return [...map.values()].sort((a, b) => b.goals - a.goals || a.player.localeCompare(b.player, 'ru'))
}

export default function ScorersTable({ teams, fixtures }: { teams: Team[]; fixtures: Fixture[] }) {
  const list = computeScorers(teams, fixtures)

  return (
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
            <TableCell>
              <div className="flex items-center gap-2">
                <TeamAvatar name={p.teamName} logoUrl={p.logoUrl} size={20} />
                <span className="text-gray-500 text-sm">{p.teamName}</span>
              </div>
            </TableCell>
            <TableCell className="text-center font-black text-emerald-600 text-lg">{p.goals}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
