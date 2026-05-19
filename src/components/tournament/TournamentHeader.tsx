'use client'

import { Tournament } from '@/types'
import { deleteTournament } from '@/app/actions/tournaments'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import SharePanel from './SharePanel'
import TeamAvatar from './TeamAvatar'

interface Props {
  tournament: Tournament
  isOwner?: boolean
}

const FORMAT_LABEL: Record<string, string> = {
  round_robin: 'Круговой турнир',
  playoff: 'Плей-офф',
  group_playoff: 'Группы + плей-офф',
}

export default function TournamentHeader({ tournament, isOwner = true }: Props) {
  const [confirming, setConfirming] = useState(false)
  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/t/${tournament.id}`
    : `/t/${tournament.id}`

  const formatDesc = (() => {
    const base = FORMAT_LABEL[tournament.format] ?? tournament.format
    if (tournament.format === 'round_robin') return `${base} · ${tournament.num_rounds} ${tournament.num_rounds === 1 ? 'круг' : 'круга'}`
    return base
  })()

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <TeamAvatar name={tournament.name} logoUrl={tournament.logo_url} size={52} />

          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 mb-1 transition-colors"
            >
              <ArrowLeft size={12} /> Все турниры
            </Link>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-gray-900 leading-tight">{tournament.name}</h1>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                tournament.generated ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {tournament.generated ? 'Активен' : 'Настройка'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{formatDesc}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SharePanel
            tournamentId={tournament.id}
            tournamentName={tournament.name}
            publicUrl={publicUrl}
          />

          {isOwner && !confirming && (
            <button
              onClick={() => setConfirming(true)}
              className="w-8 h-8 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-500 transition-all"
            >
              <Trash2 size={14} />
            </button>
          )}

          {isOwner && confirming && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-medium">Удалить?</span>
              <form action={deleteTournament.bind(null, tournament.id)}>
                <button
                  type="submit"
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Да
                </button>
              </form>
              <button
                onClick={() => setConfirming(false)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
              >
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
