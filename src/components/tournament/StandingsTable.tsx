import { Team, Fixture, StandingRow } from '@/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import TeamAvatar from './TeamAvatar'

export function computeStandings(teams: Team[], fixtures: Fixture[]): StandingRow[] {
  const rows: StandingRow[] = teams.map(t => ({
    teamId: t.id, name: t.name, logoUrl: t.logo_url ?? null,
    GP: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0, form: [],
  }))
  const idx = (id: string) => rows.findIndex(r => r.teamId === id)

  fixtures
    .filter(f => f.played && !f.is_bye)
    .sort((a, b) => a.matchday - b.matchday)
    .forEach(f => {
      const h = idx(f.home_team_id!), a = idx(f.away_team_id!)
      if (h < 0 || a < 0) return
      rows[h].GP++; rows[a].GP++
      rows[h].GF += f.home_score!; rows[h].GA += f.away_score!
      rows[a].GF += f.away_score!; rows[a].GA += f.home_score!
      if (f.home_score! > f.away_score!) {
        rows[h].W++; rows[a].L++; rows[h].Pts += 3
        rows[h].form.push('W'); rows[a].form.push('L')
      } else if (f.home_score! < f.away_score!) {
        rows[a].W++; rows[h].L++; rows[a].Pts += 3
        rows[a].form.push('W'); rows[h].form.push('L')
      } else {
        rows[h].D++; rows[a].D++; rows[h].Pts++; rows[a].Pts++
        rows[h].form.push('D'); rows[a].form.push('D')
      }
    })

  rows.forEach(r => { r.GD = r.GF - r.GA })
  rows.sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF)
  return rows
}

const FORM_COLORS = { W: 'bg-emerald-500', D: 'bg-amber-500', L: 'bg-red-500' }
const FORM_LABELS = { W: 'В', D: 'Н', L: 'П' }

export default function StandingsTable({ teams, fixtures }: { teams: Team[]; fixtures: Fixture[] }) {
  const rows = computeStandings(teams, fixtures)

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-emerald-50">
          <TableHead className="w-10 text-center text-emerald-700">#</TableHead>
          <TableHead className="text-emerald-700">Команда</TableHead>
          <TableHead className="text-center text-emerald-700 w-10">И</TableHead>
          <TableHead className="text-center text-emerald-700 w-10">В</TableHead>
          <TableHead className="text-center text-emerald-700 w-10">Н</TableHead>
          <TableHead className="text-center text-emerald-700 w-10">П</TableHead>
          <TableHead className="text-center text-emerald-700">Форма</TableHead>
          <TableHead className="text-center text-emerald-700 w-12">ЗМ</TableHead>
          <TableHead className="text-center text-emerald-700 w-12">ПМ</TableHead>
          <TableHead className="text-center text-emerald-700 w-12">РМ</TableHead>
          <TableHead className="text-center text-emerald-700 w-12 font-black">О</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={r.teamId} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
            <TableCell className="text-center font-bold text-gray-500">{i + 1}</TableCell>
            <TableCell className="font-bold text-gray-900">
              <div className="flex items-center gap-2">
                <TeamAvatar name={r.name} logoUrl={r.logoUrl} size={22} />
                {r.name}
              </div>
            </TableCell>
            <TableCell className="text-center font-mono text-sm">{r.GP}</TableCell>
            <TableCell className="text-center font-mono text-sm">{r.W}</TableCell>
            <TableCell className="text-center font-mono text-sm">{r.D}</TableCell>
            <TableCell className="text-center font-mono text-sm">{r.L}</TableCell>
            <TableCell className="text-center">
              <div className="flex gap-0.5 justify-center">
                {Array.from({ length: 5 }).map((_, j) => {
                  const res = r.form.slice(-5)[j]
                  return (
                    <span key={j} className={`w-4 h-4 rounded text-white text-[9px] font-black flex items-center justify-center ${res ? FORM_COLORS[res] : 'bg-gray-100'}`}>
                      {res ? FORM_LABELS[res] : '·'}
                    </span>
                  )
                })}
              </div>
            </TableCell>
            <TableCell className="text-center font-mono text-sm">{r.GF}</TableCell>
            <TableCell className="text-center font-mono text-sm">{r.GA}</TableCell>
            <TableCell className={`text-center font-mono text-sm font-bold ${r.GD > 0 ? 'text-emerald-600' : r.GD < 0 ? 'text-red-500' : ''}`}>
              {r.GD > 0 ? `+${r.GD}` : r.GD}
            </TableCell>
            <TableCell className="text-center font-black text-emerald-700 text-base">{r.Pts}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
