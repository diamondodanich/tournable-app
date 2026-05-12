'use client'

import { Tournament } from '@/types'
import { deleteTournament } from '@/app/actions/tournaments'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import SharePanel from './SharePanel'
import TeamAvatar from './TeamAvatar'

interface Props {
  tournament: Tournament
  isOwner?: boolean
}

export default function TournamentHeader({ tournament, isOwner = true }: Props) {
  const [confirming, setConfirming] = useState(false)
  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/t/${tournament.id}`
    : `/t/${tournament.id}`

  const formatLabel: Record<string, string> = {
    round_robin: `${tournament.num_rounds} ${tournament.num_rounds === 1 ? 'круг' : 'круга'}`,
    playoff: 'Плей-офф',
    group_playoff: 'Группы + плей-офф',
  }

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-start gap-3">
        <TeamAvatar name={tournament.name} logoUrl={tournament.logo_url} size={48} />

        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-1">
            <ArrowLeft size={14} /> Все турниры
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900">{tournament.name}</h1>
            <Badge className={tournament.generated ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}>
              {tournament.generated ? 'Активен' : 'Настройка'}
            </Badge>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">{formatLabel[tournament.format] ?? ''}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <SharePanel
          tournamentId={tournament.id}
          tournamentName={tournament.name}
          publicUrl={publicUrl}
        />

        {isOwner && !confirming && (
          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700 hover:border-red-300" onClick={() => setConfirming(true)}>
            <Trash2 size={14} />
          </Button>
        )}
        {isOwner && confirming && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-600">Удалить турнир?</span>
            <form action={deleteTournament.bind(null, tournament.id)}>
              <Button type="submit" size="sm" variant="destructive">Да, удалить</Button>
            </form>
            <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>Отмена</Button>
          </div>
        )}
      </div>
    </div>
  )
}
