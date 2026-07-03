import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getOwnerPlan } from '@/app/actions/billing'
import SetupTab from '@/components/tournament/SetupTab'
import { getSportTheme } from '@/lib/sports'
import { tx, getLang } from '@/lib/i18n'
import type { Team, TournamentMember } from '@/types'

export const dynamic = 'force-dynamic'

export default async function TournamentSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const cookieStore = await cookies()
  const lang = getLang(cookieStore.get('lang')?.value)
  const T = tx[lang]

  const [{ data: { user } }] = await Promise.all([supabase.auth.getUser()])

  const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', id).single()
  if (!tournament) notFound()

  const isOwner = user?.id === tournament.user_id
  if (!isOwner) redirect(`/dashboard/tournament/${id}`)

  const [{ data: teams }, { data: members }] = await Promise.all([
    supabase.from('teams').select('*').eq('tournament_id', id).order('created_at'),
    supabase.from('tournament_members').select('*').eq('tournament_id', id).order('created_at'),
  ])

  const theme = getSportTheme(tournament.sport)

  return (
    <div className="space-y-5" style={{ ['--sp' as string]: theme.primary } as React.CSSProperties}>
      <div>
        <Link
          href={`/dashboard/tournament/${id}`}
          style={{ color: theme.primary }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-opacity group mb-2"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          {tournament.name}
        </Link>
        <h1 className="text-2xl font-black text-gray-900">{T.tabSetup}</h1>
      </div>

      <SetupTab
        tournament={tournament}
        teams={(teams ?? []) as Team[]}
        members={(members ?? []) as TournamentMember[]}
        isOwner={isOwner}
        lang={lang}
      />
    </div>
  )
}
