/* eslint-disable @typescript-eslint/no-explicit-any --
   Fixtures, playoff matches and teams come back from Supabase untyped (nested
   match_events, per-format columns); typing them here would duplicate the DB
   schema. The file-level exemption replaces a dozen per-line ones. */
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StandingsTab from '@/components/tournament/StandingsTab'
import GroupStandingsTab from '@/components/tournament/GroupStandingsTab'
import StatsTab from '@/components/tournament/StatsTab'
import PublicFixturesTab from '@/components/tournament/PublicFixturesTab'
import LeaderboardTab from '@/components/tournament/LeaderboardTab'
import TeamAvatar from '@/components/tournament/TeamAvatar'
import { Trophy, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import { getOwnerPlan } from '@/app/actions/billing'
import { getLeaderboardEntries } from '@/app/actions/leaderboard'
import { tx, type Lang } from '@/lib/i18n'
import { getSubtype, type Format } from '@/lib/sports'
import { FORMAT_LABELS } from '@/lib/formats'
import { sportDisplayName } from '@/lib/sportSeo'
import { tournamentMeta, NOT_FOUND_TITLE } from '@/lib/entitySeo'
import { absUrl, trilingualAlternates, langPrefix, jsonLdGraph, breadcrumbsLd, sportsEventSeriesLd } from '@/lib/seo'

// Strings that only exist on this public page (the shared tournament dictionary
// in lib/i18n covers the dashboard-facing labels).
const PT: Record<Lang, {
  played: string; noBracket: string; create: string; badgeTooltip: string
  groupsPending: string; ctaTitle: string; ctaSub: string; ctaButton: string
  crumbTournaments: string; teamsCount: (n: number) => string
  ldDescription: (sport: string | null) => string | null
}> = {
  ru: {
    played: 'Сыгран', noBracket: 'Сетка ещё не сформирована', create: 'Создать',
    badgeTooltip: 'Создайте свой турнир бесплатно',
    groupsPending: 'Групповой этап начнётся после старта турнира',
    ctaTitle: 'Организуй свой турнир бесплатно',
    ctaSub: 'Всё включено: расписание, таблица, табло',
    ctaButton: 'Создать турнир',
    crumbTournaments: 'Турниры',
    teamsCount: n => `${n} команд`,
    ldDescription: sport => sport
      ? `Турнир по ${sport.toLowerCase()}: таблица, расписание и результаты матчей.`
      : 'Турнир: таблица, расписание и результаты матчей.',
  },
  kz: {
    played: 'Ойналды', noBracket: 'Тор әзірге құрылмаған', create: 'Құру',
    badgeTooltip: 'Өз жарысыңызды тегін жасаңыз',
    groupsPending: 'Топтық кезең турнир басталғаннан кейін басталады',
    ctaTitle: 'Өз турнирін тегін ұйымдастыр',
    ctaSub: 'Барлығы қосылған: кесте, турнир кестесі, табло',
    ctaButton: 'Турнир құру',
    crumbTournaments: 'Турнирлер',
    teamsCount: n => `${n} команда`,
    ldDescription: sport => sport
      ? `${sport} бойынша турнир: кесте, матчтар кестесі және нәтижелер.`
      : 'Турнир: кесте, матчтар кестесі және нәтижелер.',
  },
  en: {
    played: 'Played', noBracket: 'The bracket has not been drawn yet', create: 'Create',
    badgeTooltip: 'Create your tournament for free',
    groupsPending: 'The group stage starts once the tournament begins',
    ctaTitle: 'Run your own tournament for free',
    ctaSub: 'Everything included: fixtures, table, scoreboard',
    ctaButton: 'Create a tournament',
    crumbTournaments: 'Tournaments',
    teamsCount: n => `${n} teams`,
    ldDescription: sport => sport
      ? `A ${sport.toLowerCase()} tournament: table, fixtures and results.`
      : 'A tournament: table, fixtures and results.',
  },
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function getTournamentByIdOrSlug(supabase: Awaited<ReturnType<typeof createClient>>, idOrSlug: string) {
  if (UUID_RE.test(idOrSlug)) {
    const { data } = await supabase.from('tournaments').select('*').eq('id', idOrSlug).single()
    return data
  }
  const { data } = await supabase.from('tournaments').select('*').eq('slug', idOrSlug).single()
  return data
}

// ── Inline public bracket (read-only, no actions) ─────────────────────────────
// Round names come from the shared dictionary so the bracket reads in the
// language of the URL, not in Russian only.
function roundLabel(ro: number, lang: Lang): string {
  const T = tx[lang]
  if (ro === 1) return T.roundFinal
  if (ro === 2) return T.roundSemi
  if (ro === 4) return T.roundQuarter
  if (ro === 8) return T.roundR16
  if (ro === 16) return T.roundR32
  return T.roundN(ro)
}

function PublicMatchCard({ m, teams, lang }: { m: any; teams: any[]; lang: Lang }) {
  const homeTeam = teams.find((t: any) => t.id === m.home_team_id)
  const awayTeam = teams.find((t: any) => t.id === m.away_team_id)
  const isReady  = !!(m.home_team_id && m.away_team_id)
  const isDone   = !!m.winner_id
  return (
    <div className={`bg-white border rounded-xl p-3 min-w-[260px] shadow-sm ${
      isDone ? 'border-emerald-200' : isReady ? 'border-gray-200' : 'border-gray-100 opacity-60'
    }`}>
      {isDone && (
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-2">{PT[lang].played}</p>
      )}
      {/* Home */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {homeTeam
            ? <>
                <div className={`w-2 h-2 rounded-full shrink-0 ${m.winner_id === m.home_team_id ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                <span className={`text-sm font-bold truncate ${m.winner_id === m.home_team_id ? 'text-emerald-700' : 'text-gray-900'}`}>
                  {homeTeam.name}
                  {m.winner_id === m.home_team_id && <Trophy size={10} className="inline ml-1 text-amber-500" />}
                </span>
              </>
            : <span className="text-sm text-gray-400 italic">TBD</span>
          }
        </div>
        <span className="font-black text-lg font-mono tabular-nums shrink-0">
          {m.home_score != null ? m.home_score : '–'}
        </span>
      </div>
      {/* Away */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {awayTeam
            ? <>
                <div className={`w-2 h-2 rounded-full shrink-0 ${m.winner_id === m.away_team_id ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                <span className={`text-sm font-bold truncate ${m.winner_id === m.away_team_id ? 'text-emerald-700' : 'text-gray-900'}`}>
                  {awayTeam.name}
                  {m.winner_id === m.away_team_id && <Trophy size={10} className="inline ml-1 text-amber-500" />}
                </span>
              </>
            : <span className="text-sm text-gray-400 italic">TBD</span>
          }
        </div>
        <span className="font-black text-lg font-mono tabular-nums shrink-0">
          {m.away_score != null ? m.away_score : '–'}
        </span>
      </div>
    </div>
  )
}

function BracketColumns({ teams, matches, labelFor, lang, ascending = false }: { teams: any[]; matches: any[]; labelFor: (ro: number, i: number) => string; lang: Lang; ascending?: boolean }) {
  const rounds = [...new Set(matches.map((m: any) => m.round_order as number))]
  // Winners/single-elim rounds count down (final last); losers rounds count up.
  rounds.sort((a, b) => ascending ? a - b : b - a)
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max">
        {rounds.map((ro, i) => (
          <div key={ro} className="flex flex-col gap-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 text-center">{labelFor(ro, i)}</p>
            <div className="flex flex-col gap-4 justify-around flex-1">
              {matches
                .filter((m: any) => m.round_order === ro)
                .sort((a: any, b: any) => a.match_order - b.match_order)
                .map((m: any) => <PublicMatchCard key={m.id} m={m} teams={teams} lang={lang} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PublicBracket({
  teams, matches, lang,
}: {
  teams: any[]; matches: any[]; lang: Lang
}) {
  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <p className="font-bold text-gray-500">{PT[lang].noBracket}</p>
      </div>
    )
  }

  // Double elimination: three stacked brackets (Winners / Losers / Grand final)
  const isDE = matches.some((m: any) => m.bracket === 'LB' || m.bracket === 'GF')
  if (isDE) {
    const wb = matches.filter((m: any) => m.bracket === 'WB')
    const lb = matches.filter((m: any) => m.bracket === 'LB')
    const gf = matches.filter((m: any) => m.bracket === 'GF')
    // Losers rounds are ordered ascending — build a value→index map for sequential labels.
    const lbVals = [...new Set(lb.map((m: any) => m.round_order as number))].sort((a, b) => a - b)
    return (
      <div className="space-y-6">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-black text-gray-800">{tx[lang].deWinners}</h3>
          </div>
          <BracketColumns lang={lang} teams={teams} matches={wb} labelFor={ro => roundLabel(ro, lang)} />
        </section>
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-5 rounded-full bg-amber-500" />
            <h3 className="text-sm font-black text-gray-800">{tx[lang].deLosers}</h3>
          </div>
          <BracketColumns lang={lang} teams={teams} matches={lb} ascending labelFor={ro => tx[lang].roundN(lbVals.indexOf(ro) + 1)} />
        </section>
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-5 rounded-full bg-emerald-600" />
            <h3 className="text-sm font-black text-gray-800">{tx[lang].deGrandFinal}</h3>
          </div>
          <BracketColumns lang={lang} teams={teams} matches={gf} labelFor={() => ''} />
        </section>
      </div>
    )
  }

  return <BracketColumns lang={lang} teams={teams} matches={matches} labelFor={ro => roundLabel(ro, lang)} />
}

export async function tournamentMetadata(idOrSlug: string, lang: Lang): Promise<Metadata> {
  const supabase = await createClient()
  const data = await getTournamentByIdOrSlug(supabase, idOrSlug)
  if (!data) return { title: NOT_FOUND_TITLE[lang].tournament, robots: { index: false, follow: false } }

  const { count: teamsCount } = await supabase
    .from('teams').select('id', { count: 'exact', head: true }).eq('tournament_id', data.id)

  const { title, description } = tournamentMeta(lang, {
    name: data.name,
    sport: data.sport,
    formatLabel: FORMAT_LABELS[(data.format ?? 'round_robin') as Format]?.[lang] ?? null,
    teams: teamsCount ?? null,
  })
  const path = `/t/${data.slug ?? data.id}`

  return {
    title,
    description,
    alternates: trilingualAlternates(path, lang),
    // Private tournaments stay reachable by link but must never enter the index.
    robots: data.is_public === false ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: data.name,
      description,
      type: 'website',
      url: absUrl(`${langPrefix(lang)}${path}`),
      siteName: 'Tournable',
      // Image comes from opengraph-image.tsx in this segment — setting it here
      // would override that generated card with a small square logo.
    },
    twitter: { card: 'summary_large_image', title: data.name, description },
  }
}

export default async function PublicTournamentPage({
  idOrSlug, lang,
}: { idOrSlug: string; lang: Lang }) {
  const supabase = await createClient()
  const prefix = langPrefix(lang)
  const T = PT[lang]

  const tournament = await getTournamentByIdOrSlug(supabase, idOrSlug)
  if (!tournament) notFound()

  const badgeTooltip = T.badgeTooltip

  const [{ data: teams }, { data: fixtures }, { data: playoffMatches }, ownerPlan] = await Promise.all([
    supabase.from('teams').select('*').eq('tournament_id', tournament.id).order('created_at'),
    supabase.from('fixtures').select('*, match_events(*)').eq('tournament_id', tournament.id).order('matchday'),
    supabase.from('playoff_matches').select('*, match_events(*)').eq('tournament_id', tournament.id).order('round_order').order('match_order'),
    getOwnerPlan(tournament.id),
  ])

  const ownerIsPro = ownerPlan === 'pro'

  // Leaderboard tournaments have no fixtures at all; their content is the ranking.
  const leaderboardEntries = (tournament.format ?? 'round_robin') === 'leaderboard'
    ? await getLeaderboardEntries(tournament.id)
    : []

  const fmt = tournament.format ?? 'round_robin'

  const allEvents = [
    ...(fixtures ?? []).flatMap((f: any) => f.match_events ?? []),
    ...(playoffMatches ?? []).flatMap((m: any) => m.match_events ?? []),
  ]

  const showGroupStandings = fmt === 'groups_playoff' && (teams ?? []).some((t: any) => t.group_name)

  // ── Structured data: the tournament as a SportsEvent with its teams as
  // competitors and played matches as sub-events. Only public tournaments emit it —
  // a noindex page has nothing to gain and private squads should not leak.
  const path = `${prefix}/t/${tournament.slug ?? tournament.id}`
  const sportName = sportDisplayName(tournament.sport, lang)
    ?? (tournament.sport ? getSubtype(tournament.sport)?.label[lang] ?? tournament.sport : null)
  const teamName = (tid: string | null) => (teams ?? []).find((t: any) => t.id === tid)?.name ?? null
  const playedFixtures = (fixtures ?? []).filter((f: any) => f.played && !f.is_bye)
  // played_at where the match is finished, scheduled_at for what is still ahead.
  const scheduledDates = (fixtures ?? [])
    .map((f: any) => f.played_at ?? f.scheduled_at)
    .filter(Boolean)
    .sort() as string[]

  const jsonLd = tournament.is_public === false ? null : jsonLdGraph(
    sportsEventSeriesLd({
      name: tournament.name,
      path,
      sport: sportName,
      startDate: scheduledDates[0] ?? tournament.created_at ?? null,
      endDate: scheduledDates[scheduledDates.length - 1] ?? null,
      description: T.ldDescription(sportName),
      logoUrl: tournament.logo_url ?? null,
      competitors: (teams ?? []).map((t: any) => ({ name: t.name })),
      subEvents: playedFixtures.slice(0, 50).map((f: any) => ({
        name: `${teamName(f.home_team_id) ?? '—'} ${f.home_score}:${f.away_score} ${teamName(f.away_team_id) ?? '—'}`,
        startDate: f.played_at ?? f.scheduled_at ?? null,
      })),
    }),
    breadcrumbsLd([
      { name: 'Tournable', path: prefix || '/' },
      { name: T.crumbTournaments, path: `${prefix}/tournaments` },
      { name: tournament.name, path },
    ]),
  )

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#ecfdf5 0%,#f0fdf4 50%,#ffffff 100%)' }}>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={prefix || '/'} className="flex items-center gap-2">
            <Image src="/logo-green.png" alt="Tournable" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="font-black text-lg tracking-tight text-emerald-700" style={{ letterSpacing: '-.03em' }}>TOURNABLE</span>
          </Link>
          <Link href={`${prefix || '/'}?ref=public-header`} title={badgeTooltip}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full transition-colors">
            <Plus size={13} /> {T.create}
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Tournament identity */}
        <div className="flex items-center gap-4 mb-6">
          <TeamAvatar name={tournament.name} logoUrl={tournament.logo_url} size={56} />
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">{tournament.name}</h1>
            <p className="mt-1 text-sm font-semibold text-gray-500">
              {[sportName, FORMAT_LABELS[fmt as Format]?.[lang], (teams ?? []).length ? T.teamsCount((teams ?? []).length) : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        {/* ── ROUND-ROBIN and SWISS: standings + fixtures + stats ──
             Swiss shares this layout (a points table plus fixtures, no bracket);
             before it was in neither branch, so a Swiss tournament's public page
             rendered a header and nothing else. */}
        {(fmt === 'round_robin' || fmt === 'swiss') && (
          <Tabs defaultValue="standings">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm mb-6">
              <div className="overflow-x-auto scrollbar-hide px-2 py-2">
                <TabsList className="flex h-auto gap-1 bg-transparent p-0 w-max">
                  {([['standings', tx[lang].tabStandings], ['fixtures', tx[lang].tabFixtures], ['stats', tx[lang].tabStats]] as [string, string][]).map(([v,l]) => (
                    <TabsTrigger key={v} value={v}
                      className="inline-flex items-center h-9 px-4 rounded-xl text-sm font-bold whitespace-nowrap text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all data-[active]:bg-emerald-600 data-[active]:text-white data-[active]:shadow-md">
                      {l}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>
            <TabsContent value="standings">
              <StandingsTab teams={teams ?? []} fixtures={fixtures ?? []} tournamentName={tournament.name} tournament={tournament} isPro={ownerIsPro} lang={lang} />
            </TabsContent>
            <TabsContent value="fixtures">
              <PublicFixturesTab tournament={tournament} teams={teams ?? []} fixtures={fixtures ?? []} lang={lang} />
            </TabsContent>
            <TabsContent value="stats">
              <StatsTab teams={teams ?? []} events={allEvents} lang={lang} sport={tournament.sport ?? undefined} />
            </TabsContent>
          </Tabs>
        )}

        {/* ── LEAGUE+PLAYOFF: standings + fixtures + playoff + stats ── */}
        {fmt === 'league_playoff' && (
          <Tabs defaultValue="standings">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm mb-6">
              <div className="overflow-x-auto scrollbar-hide px-2 py-2">
                <TabsList className="flex h-auto gap-1 bg-transparent p-0 w-max">
                  {([['standings', tx[lang].tabStandings], ['fixtures', tx[lang].tabFixtures], ['playoff', tx[lang].tabBracket], ['stats', tx[lang].tabStats]] as [string, string][]).map(([v,l]) => (
                    <TabsTrigger key={v} value={v}
                      className="inline-flex items-center h-9 px-4 rounded-xl text-sm font-bold whitespace-nowrap text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all data-[active]:bg-emerald-600 data-[active]:text-white data-[active]:shadow-md">
                      {l}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>
            <TabsContent value="standings">
              <StandingsTab teams={teams ?? []} fixtures={fixtures ?? []} tournamentName={tournament.name} tournament={tournament} isPro={ownerIsPro} lang={lang} />
            </TabsContent>
            <TabsContent value="fixtures">
              <PublicFixturesTab tournament={tournament} teams={teams ?? []} fixtures={fixtures ?? []} lang={lang} />
            </TabsContent>
            <TabsContent value="playoff">
              <PublicBracket teams={teams ?? []} matches={playoffMatches ?? []} lang={lang} />
            </TabsContent>
            <TabsContent value="stats">
              <StatsTab teams={teams ?? []} events={allEvents} lang={lang} sport={tournament.sport ?? undefined} />
            </TabsContent>
          </Tabs>
        )}

        {/* ── GROUPS + PLAYOFF: group stage standings + fixtures + playoff + stats ── */}
        {fmt === 'groups_playoff' && (
          <Tabs defaultValue="groups">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm mb-6">
              <div className="overflow-x-auto scrollbar-hide px-2 py-2">
                <TabsList className="flex h-auto gap-1 bg-transparent p-0 w-max">
                  {([['groups', tx[lang].tabGroups], ['fixtures', tx[lang].tabFixtures], ['playoff', tx[lang].tabBracket], ['stats', tx[lang].tabStats]] as [string, string][]).map(([v,l]) => (
                    <TabsTrigger key={v} value={v}
                      className="inline-flex items-center h-9 px-4 rounded-xl text-sm font-bold whitespace-nowrap text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all data-[active]:bg-emerald-600 data-[active]:text-white data-[active]:shadow-md">
                      {l}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>
            <TabsContent value="groups">
              {showGroupStandings ? (
                <GroupStandingsTab teams={teams ?? []} fixtures={fixtures ?? []} tournament={tournament} isPro={ownerIsPro} lang={lang} />
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                  <p className="font-bold text-gray-500">{T.groupsPending}</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="fixtures">
              <PublicFixturesTab tournament={tournament} teams={teams ?? []} fixtures={fixtures ?? []} lang={lang} />
            </TabsContent>
            <TabsContent value="playoff">
              <PublicBracket teams={teams ?? []} matches={playoffMatches ?? []} lang={lang} />
            </TabsContent>
            <TabsContent value="stats">
              <StatsTab teams={teams ?? []} events={allEvents} lang={lang} sport={tournament.sport ?? undefined} />
            </TabsContent>
          </Tabs>
        )}

        {/* ── PLAYOFF / DOUBLE ELIMINATION: full bracket view ── */}
        {(fmt === 'playoff' || fmt === 'double_elim') && (
          <Tabs defaultValue="playoff">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm mb-6">
              <div className="overflow-x-auto scrollbar-hide px-2 py-2">
                <TabsList className="flex h-auto gap-1 bg-transparent p-0 w-max">
                  {([['playoff', tx[lang].tabBracket], ['stats', tx[lang].tabStats]] as [string, string][]).map(([v,l]) => (
                    <TabsTrigger key={v} value={v}
                      className="inline-flex items-center h-9 px-4 rounded-xl text-sm font-bold whitespace-nowrap text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all data-[active]:bg-emerald-600 data-[active]:text-white data-[active]:shadow-md">
                      {l}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>
            <TabsContent value="playoff">
              <PublicBracket teams={teams ?? []} matches={playoffMatches ?? []} lang={lang} />
            </TabsContent>
            <TabsContent value="stats">
              <StatsTab teams={teams ?? []} events={allEvents} lang={lang} sport={tournament.sport ?? undefined} />
            </TabsContent>
          </Tabs>
        )}

        {/* ── LEADERBOARD: points ranking, no fixtures and no bracket ── */}
        {fmt === 'leaderboard' && (
          <LeaderboardTab
            tournamentId={tournament.id}
            teams={teams ?? []}
            entries={leaderboardEntries}
            lang={lang}
          />
        )}

        {/* CTA for viewers */}
        <div className="mt-10 bg-emerald-600 rounded-2xl p-6 text-center text-white">
          <Trophy size={28} className="mx-auto mb-3 opacity-80" />
          <p className="font-black text-lg mb-1">{T.ctaTitle}</p>
          <p className="text-sm text-emerald-100 mb-5">{T.ctaSub}</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-6 py-2.5 rounded-xl shadow-md transition-colors text-sm"
          >
            <Plus size={15} /> {T.ctaButton}
          </Link>
        </div>

        {/* Powered by Tournable badge */}
        {!ownerIsPro && (
          <div className="mt-6 text-center pb-2">
            <a
              href={`${absUrl(prefix || '/')}?ref=tournament-badge`}
              target="_blank"
              rel="noopener noreferrer"
              title={badgeTooltip}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium"
            >
              <span className="w-4 h-4 rounded bg-emerald-600 inline-flex items-center justify-center shrink-0">
                <Trophy size={9} className="text-white" />
              </span>
              Powered by Tournable
            </a>
          </div>
        )}
      </main>
    </div>
  )
}
