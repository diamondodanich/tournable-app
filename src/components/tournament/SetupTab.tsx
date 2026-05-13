'use client'

import { useState } from 'react'
import { Tournament, Team } from '@/types'
import { addTeam, removeTeam, generateSchedule, renameTournament } from '@/app/actions/tournaments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Zap, Users, Settings2, Check, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import TeamLogoUpload from './TeamLogoUpload'
import TournamentLogoUpload from './TournamentLogoUpload'

const FORMAT_LABEL: Record<string, string> = {
  round_robin: 'Круговой',
  playoff: 'Плей-офф',
  group_playoff: 'Группы + плей-офф',
}

export default function SetupTab({ tournament, teams }: { tournament: Tournament; teams: Team[] }) {
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Tournament name edit state
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(tournament.name)
  const [savingName, setSavingName] = useState(false)

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

  async function handleSaveName() {
    if (!nameValue.trim() || nameValue.trim() === tournament.name) { setEditingName(false); return }
    setSavingName(true)
    const result = await renameTournament(tournament.id, nameValue)
    if (result?.error) toast.error(result.error)
    else { toast.success('Название обновлено'); setEditingName(false) }
    setSavingName(false)
  }

  return (
    <div className="space-y-4 max-w-2xl">

      {/* Tournament settings card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 size={16} /> Настройки турнира
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {/* Logo */}
            <TournamentLogoUpload
              tournamentId={tournament.id}
              tournamentName={tournament.name}
              logoUrl={tournament.logo_url}
              size={64}
            />

            {/* Name + format */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Editable name */}
              <div>
                <p className="text-xs text-gray-400 mb-1">Название</p>
                {editingName ? (
                  <div className="flex gap-2">
                    <Input
                      value={nameValue}
                      onChange={e => setNameValue(e.target.value)}
                      maxLength={40}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                    />
                    <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 px-2" onClick={handleSaveName} disabled={savingName}>
                      <Check size={14} />
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => { setEditingName(false); setNameValue(tournament.name) }}>
                      <X size={14} />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingName(true)}
                    className="flex items-center gap-2 group text-left"
                  >
                    <span className="font-bold text-gray-900 text-base">{tournament.name}</span>
                    <Pencil size={13} className="text-gray-300 group-hover:text-emerald-600 transition-colors" />
                  </button>
                )}
              </div>

              {/* Format + rounds */}
              <div className="flex gap-4 text-sm text-gray-500">
                <span><span className="font-medium text-gray-700">Формат:</span> {FORMAT_LABEL[tournament.format] ?? tournament.format}</span>
                {tournament.format === 'round_robin' && (
                  <span><span className="font-medium text-gray-700">Кругов:</span> {tournament.num_rounds}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teams card */}
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
          {generating ? 'Генерируем…' : tournament.generated ? 'Пересоздать расписание' : 'Сгенерировать расписание'}
        </Button>
      )}
    </div>
  )
}
