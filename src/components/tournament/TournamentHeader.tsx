'use client'

import { Tournament, TournamentMember } from '@/types'
import { deleteTournament } from '@/app/actions/tournaments'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import SharePanel from './SharePanel'
import TeamAvatar from './TeamAvatar'
import { getSportTheme } from '@/lib/sports'
import { tx, type Lang } from '@/lib/i18n'

interface Props {
  tournament: Tournament
  isOwner?: boolean
  members?: TournamentMember[]
  lang?: Lang
}

export default function TournamentHeader({ tournament, isOwner = true, members = [], lang = 'ru' }: Props) {
  const T = tx[lang]
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const theme = getSportTheme(tournament.sport)
  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/t/${tournament.id}`
    : `/t/${tournament.id}`

  const FORMAT_LABEL: Record<string, string> = {
    round_robin:    T.fmtRoundRobin,
    playoff:        T.fmtPlayoff,
    groups_playoff: T.fmtGroupsPlayoff,
    league_playoff: T.fmtLeaguePlayoff,
  }

  const formatDesc = (() => {
    const base = FORMAT_LABEL[tournament.format] ?? tournament.format
    if (tournament.format === 'round_robin') {
      return `${base} · ${T.roundSuffix(tournament.num_rounds)}`
    }
    if (tournament.format === 'groups_playoff' && tournament.groups_count) {
      return `${base} · ${T.groupsSuffix(tournament.groups_count)}`
    }
    if (tournament.format === 'league_playoff' && tournament.teams_advance) {
      return `${base} · ${T.teamsAdvanceSuffix(tournament.teams_advance)}`
    }
    return base
  })()

  return (
    <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm px-5 py-4">

      {/* Sport-coloured top accent */}
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: theme.gradient }} />

      {/* Back link — prominent */}
      <Link
        href="/dashboard"
        style={{ color: theme.primary }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 mb-3 mt-1 transition-opacity group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        {T.allTournaments}
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <TeamAvatar name={tournament.name} logoUrl={tournament.logo_url} size={52} />

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-black text-gray-900 leading-tight">{tournament.name}</h1>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={tournament.generated
                  ? { background: theme.light, color: theme.primaryDark }
                  : { background: '#f3f4f6', color: '#6b7280' }}>
                {tournament.generated ? T.statusActive : T.statusSetup}
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
            members={members}
          />

          {isOwner && !confirming && (
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 text-xs font-bold transition-all"
            >
              <Trash2 size={13} /> {T.btnDelete}
            </button>
          )}

          {isOwner && confirming && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <span className="text-xs text-red-600 font-semibold">{T.deleteTournamentQ}</span>
              <form action={deleteTournament.bind(null, tournament.id)} onSubmit={() => setDeleting(true)}>
                <button
                  type="submit"
                  disabled={deleting}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                >
                  {deleting ? '…' : T.yes}
                </button>
              </form>
              <button
                onClick={() => setConfirming(false)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-white text-gray-600 transition-colors"
              >
                {T.cancel}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
