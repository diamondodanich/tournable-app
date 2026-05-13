'use client'

import { useState } from 'react'
import { Tournament, Team } from '@/types'
import { addTeam, removeTeam, generateSchedule } from '@/app/actions/tournaments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Zap, Users } from 'lucide-react'
import { toast } from 'sonner'
import TeamLogoUpload from './TeamLogoUpload'

export default function SetupTab({ tournament, teams }: { tournament: Tournament; teams: Team[] }) {
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  async function handleAddTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!teamName.trim()) return
    if (teams.some(t => t.name.toLowerCase() === teamName.trim().toLowerCase())) {
      toast.error('Такая команда уже есть')
      return
    }
    setLoading(true)
    const result = await addTeam(tournament.id, teamName)
    if (result?.error) toast.error(result.error)
    else setTeamName('')
    setLoading(false)
  }

  async function handleRemoveTeam(teamId: string) {
    await removeTeam(teamId, tournament.id)
  }

  async function handleGenerate() {
    if (teams.length < 2) { toast.error('Нужно минимум 2 команды'); return }
    setGenerating(true)
    const result = await generateSchedule(tournament.id)
    if (result?.error) toast.error(result.error)
    else toast.success('Расписание создано!')
    setGenerating(false)
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users size={16} /> Команды ({teams.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddTeam} className="flex gap-2">
            <Input
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="Название команды…"
              maxLength={30}
            />
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 shrink-0" disabled={loading}>
              + Добавить
            </Button>
          </form>

          {teams.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Добавьте минимум 2 команды для генерации расписания
            </div>
          ) : (
            <div className="space-y-2">
              {teams.map(team => (
                <div key={team.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                  <TeamLogoUpload
                    teamId={team.id}
                    teamName={team.name}
                    tournamentId={tournament.id}
                    logoUrl={team.logo_url}
                  />
                  <span className="flex-1 font-medium text-sm text-gray-800">{team.name}</span>
                  <button onClick={() => handleRemoveTeam(team.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {tournament.format === 'round_robin' && (
        <Button
          onClick={handleGenerate}
          disabled={teams.length < 2 || generating}
          className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          size="lg"
        >
          <Zap size={16} />
          {generating ? 'Генерируем…' : 'Сгенерировать расписание'}
        </Button>
      )}
    </div>
  )
}
