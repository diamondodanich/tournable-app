'use client'

import { Tournament, TournamentMember } from '@/types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import SharePanel from './SharePanel'
import TeamAvatar from './TeamAvatar'
import { getSportTheme } from '@/lib/sports'
import { tx, type Lang } from '@/lib/i18n'
import TournamentCoverBanner from './TournamentCoverBanner'

interface Props {
  tournament: Tournament
  isOwner?: boolean
  isPro?: boolean
  members?: TournamentMember[]
  lang?: Lang
}

export default function TournamentHeader({ tournament, isOwner = true, isPro = false, members = [], lang = 'ru' }: Props) {
  const T = tx[lang]
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
    <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm">

      {/* Cover banner or sport-coloured accent */}
      {tournament.cover_url
        ? <TournamentCoverBanner coverUrl={tournament.cover_url} className="h-24 sm:h-36 w-full" />
        : <div className="absolute inset-x-0 top-0 h-1" style={{ background: theme.gradient }} />
      }

      <div className="px-5 py-4">

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
          {isOwner && (
            <div className="flex flex-col items-start gap-1">
              <SharePanel
                tournamentId={tournament.id}
                tournamentName={tournament.name}
                publicUrl={publicUrl}
                members={members}
                isPro={isPro}
                lang={lang}
              />
              {!isPro && (
                <a
                  href="/pricing"
                  className="text-[10px] text-gray-400 hover:text-emerald-600 transition-colors leading-none px-0.5 whitespace-nowrap"
                >
                  Убрать бэдж Tournable с публичной страницы → Pro
                </a>
              )}
            </div>
          )}

        </div>
      </div>
      </div>
    </div>
  )
}
