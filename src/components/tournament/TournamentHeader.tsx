'use client'

import { Tournament } from '@/types'
import { deleteTournament } from '@/app/actions/tournaments'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function TournamentHeader({ tournament }: { tournament: Tournament }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-2">
          <ArrowLeft size={14} /> Все турниры
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-gray-900">{tournament.name}</h1>
          <Badge className={tournament.generated ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}>
            {tournament.generated ? 'Активен' : 'Настройка'}
          </Badge>
        </div>
        <p className="text-sm text-gray-400 mt-1">{tournament.num_rounds} {tournament.num_rounds === 1 ? 'круг' : 'круга'}</p>
      </div>

      <div className="flex items-center gap-2">
        {!confirming ? (
          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700 hover:border-red-300" onClick={() => setConfirming(true)}>
            <Trash2 size={14} />
          </Button>
        ) : (
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
