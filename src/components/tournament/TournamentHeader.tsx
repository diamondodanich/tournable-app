'use client'

import { Tournament, TournamentMember } from '@/types'
import { ArrowLeft, Settings, Crown } from 'lucide-react'
import Link from 'next/link'
import SharePanel from './SharePanel'
import TeamAvatar from './TeamAvatar'
import { getSportTheme } from '@/lib/sports'
import { tx, type Lang } from '@/lib/i18n'
import { APP_URL } from '@/lib/appUrl'
import TournamentCoverBanner from './TournamentCoverBanner'

interface Props {
  tournament: Tournament
  isOwner?: boolean
  isPro?: boolean
  members?: TournamentMember[]
  lang?: Lang
  /** Where the header gear links to. Defaults to the tournament's own settings page. */
  settingsHref?: string
  /** Override the "back" link (label + href) — used when embedded in a championship. */
  backHref?: string
  backLabel?: string
}

export default function TournamentHeader({ tournament, isOwner = true, isPro = false, members = [], lang = 'ru', settingsHref, backHref, backLabel }: Props) {
  const T = tx[lang]
  const theme = getSportTheme(tournament.sport)
  const publicUrl = `${APP_URL}/t/${tournament.id}`

  const FORMAT_LABEL: Record<string, string> = {
    round_robin:    T.fmtRoundRobin,
    playoff:        T.fmtPlayoff,
    groups_playoff: T.fmtGroupsPlayoff,
    league_playoff: T.fmtLeaguePlayoff,
    swiss:          T.fmtSwiss,
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
        href={backHref ?? '/dashboard'}
        style={{ color: theme.primary }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 mb-3 mt-1 transition-opacity group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        {backLabel ?? T.allTournaments}
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <TeamAvatar name={tournament.name} logoUrl={tournament.logo_url} size={52} />

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-black text-gray-900 leading-tight">{tournament.name}</h1>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tournament.generated ? 'sp-tint' : 'bg-gray-100 text-gray-500'}`}
                style={tournament.generated ? { background: theme.light, color: theme.primaryDark } : undefined}>
                {tournament.generated ? T.statusActive : T.statusSetup}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{formatDesc}</p>
          </div>
        </div>

        {isOwner && (
          <div className="flex flex-col items-stretch sm:items-end gap-1.5">
            {/* Actions row — Share + Settings aligned on one line */}
            <div className="flex items-center gap-2">
              <SharePanel
                tournamentId={tournament.id}
                tournamentName={tournament.name}
                publicUrl={publicUrl}
                members={members}
                isPro={isPro}
                lang={lang}
              />
              <Link
                href={settingsHref ?? `/dashboard/tournament/${tournament.id}/settings`}
                aria-label={T.tabSetup}
                title={T.tabSetup}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <Settings size={15} />
                <span className="hidden sm:inline">{T.tabSetup}</span>
              </Link>
            </div>

            {/* Pro upsell — clean pill under the actions, never crammed between buttons */}
            {!isPro && (
              <a
                href="/pricing"
                className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 hover:bg-amber-100 transition-colors whitespace-nowrap"
              >
                <Crown size={11} /> {T.removeBadgeCta}
              </a>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
