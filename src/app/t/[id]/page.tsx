import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StandingsTab from '@/components/tournament/StandingsTab'
import GroupStandingsTab from '@/components/tournament/GroupStandingsTab'
import StatsTab from '@/components/tournament/StatsTab'
import PublicFixturesTab from '@/components/tournament/PublicFixturesTab'
import TeamAvatar from '@/components/tournament/TeamAvatar'
import { Trophy, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import { getOwnerPlan } from '@/app/actions/billing'
import type { Lang } from '@/lib/i18n'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function getTournamentByIdOrSlug(supabase: Awaited<ReturnType<typeof createClient>>, idOrSlug: string) {
  if (UUID_RE.test(idOrSlug)) {
    const { data } = await supabase.from('tournaments').select('*').eq('id', idOrSlug).single()
    return data
  }
  const { data } = await supabase.from('tournaments').select('*').eq('slug', idOrSlug).single()
  return data
}

const SPORT_LABELS: Record<string, string> = {
  football: 'Футбол', futsal: 'Мини-футбол', efootball: 'Киберфутбол',
  basketball: 'Баскетбол', streetball: 'Стритбол', ebasketball: 'Кибербаскетбол',
  volleyball: 'Волейбол', beach_volleyball: 'Пляжный волейбол',
  hockey: 'Хоккей', other: 'Другое',
}

// ── Inline public bracket (read-only, no actions) ─────────────────────────────
const ROUND_LABELS: Record<number, string> = {
  1: 'Финал', 2: 'Полуфинал', 4: 'Четвертьфинал', 8: '1/8 финала', 16: '1/16 финала',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PublicMatchCard({ m, teams }: { m: any; teams: any[] }) {
  const homeTeam = teams.find((t: any) => t.id === m.home_team_id)
  const awayTeam = teams.find((t: any) => t.id === m.away_team_id)
  const isReady  = !!(m.home_team_id && m.away_team_id)
  const isDone   = !!m.winner_id
  return (
    <div className={`bg-white border rounded-xl p-3 min-w-[260px] shadow-sm ${
      isDone ? 'border-emerald-200' : isReady ? 'border-gray-200' : 'border-gray-100 opacity-60'
    }`}>
      {isDone && (
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-2">Сыгран</p>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BracketColumns({ teams, matches, labelFor, ascending = false }: { teams: any[]; matches: any[]; labelFor: (ro: number, i: number) => string; ascending?: boolean }) {
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
                .map((m: any) => <PublicMatchCard key={m.id} m={m} teams={teams} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PublicBracket({
  teams, matches,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teams: any[]; matches: any[]
}) {
  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <p className="font-bold text-gray-500">Сетка ещё не сформирована</p>
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
            <h3 className="text-sm font-black text-gray-800">Верхняя сетка</h3>
          </div>
          <BracketColumns teams={teams} matches={wb} labelFor={ro => ROUND_LABELS[ro] ?? `Раунд ${ro}`} />
        </section>
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-5 rounded-full bg-amber-500" />
            <h3 className="text-sm font-black text-gray-800">Нижняя сетка</h3>
          </div>
          <BracketColumns teams={teams} matches={lb} ascending labelFor={ro => `Раунд ${lbVals.indexOf(ro) + 1}`} />
        </section>
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-5 rounded-full bg-emerald-600" />
            <h3 className="text-sm font-black text-gray-800">Гранд-финал</h3>
          </div>
          <BracketColumns teams={teams} matches={gf} labelFor={() => ''} />
        </section>
      </div>
    )
  }

  return <BracketColumns teams={teams} matches={matches} labelFor={ro => ROUND_LABELS[ro] ?? `Раунд ${ro}`} />
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const data = await getTournamentByIdOrSlug(supabase, id)
  if (!data) return { title: 'Tournable' }

  const sportLabel = data.sport ? (SPORT_LABELS[data.sport] ?? data.sport) : null
  const description = sportLabel
    ? `Турнир по ${sportLabel} — таблица, расписание, результаты на Tournable`
    : 'Таблица, расписание и результаты матчей на Tournable'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tournable.app'

  return {
    title: `${data.name} — Tournable`,
    description,
    openGraph: {
      title: data.name,
      description,
      type: 'website',
      url: `${appUrl}/t/${data.slug ?? data.id}`,
      siteName: 'Tournable',
    },
    twitter: { card: 'summary', title: data.name, description },
  }
}

export default async function PublicTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const tournament = await getTournamentByIdOrSlug(supabase, id)
  if (!tournament) notFound()

  const cookieStore = await cookies()
  const langRaw = cookieStore.get('lang')?.value ?? 'ru'
  const lang: Lang = (['ru', 'kz', 'en'] as Lang[]).includes(langRaw as Lang) ? (langRaw as Lang) : 'ru'

  const BADGE_TOOLTIP: Record<string, string> = {
    ru: 'Создайте свой турнир бесплатно',
    kz: 'Өз жарысыңызды тегін жасаңыз',
    en: 'Create your tournament for free',
  }
  const badgeTooltip = BADGE_TOOLTIP[langRaw] ?? BADGE_TOOLTIP.ru

  const [{ data: teams }, { data: fixtures }, { data: playoffMatches }, ownerPlan] = await Promise.all([
    supabase.from('teams').select('*').eq('tournament_id', tournament.id).order('created_at'),
    supabase.from('fixtures').select('*, match_events(*)').eq('tournament_id', tournament.id).order('matchday'),
    supabase.from('playoff_matches').select('*, match_events(*)').eq('tournament_id', tournament.id).order('round_order').order('match_order'),
    getOwnerPlan(tournament.id),
  ])

  const ownerIsPro = ownerPlan === 'pro'

  const fmt = tournament.format ?? 'round_robin'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tournable.app'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allEvents = [
    ...(fixtures ?? []).flatMap((f: any) => f.match_events ?? []),
    ...(playoffMatches ?? []).flatMap((m: any) => m.match_events ?? []),
  ]

  const showGroupStandings = fmt === 'groups_playoff' && (teams ?? []).some((t: any) => t.group_name)
  const groups = showGroupStandings
    ? [...new Set((teams ?? []).map((t: any) => t.group_name).filter(Boolean))].sort()
    : []

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#ecfdf5 0%,#f0fdf4 50%,#ffffff 100%)' }}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={appUrl} className="flex items-center gap-2">
            <Image src="/logo-green.png" alt="Tournable" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="font-black text-lg tracking-tight text-emerald-700" style={{ letterSpacing: '-.03em' }}>TOURNABLE</span>
          </Link>
          <Link href={`${appUrl}?ref=public-header`} title={badgeTooltip}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full transition-colors">
            <Plus size={13} /> Создать
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Tournament identity */}
        <div className="flex items-center gap-4 mb-6">
          <TeamAvatar name={tournament.name} logoUrl={tournament.logo_url} size={56} />
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">{tournament.name}</h1>
          </div>
        </div>

        {/* ── ROUND-ROBIN: standings + fixtures + stats ── */}
        {fmt === 'round_robin' && (
          <Tabs defaultValue="standings">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm mb-6">
              <div className="overflow-x-auto scrollbar-hide px-2 py-2">
                <TabsList className="flex h-auto gap-1 bg-transparent p-0 w-max">
                  {[['standings','Таблица'],['fixtures','Матчи'],['stats','Статистика']].map(([v,l]) => (
                    <TabsTrigger key={v} value={v}
                      className="inline-flex items-center h-9 px-4 rounded-xl text-sm font-bold whitespace-nowrap text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all data-[active]:bg-emerald-600 data-[active]:text-white data-[active]:shadow-md">
                      {l}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>
            <TabsContent value="standings">
              <StandingsTab teams={teams ?? []} fixtures={fixtures ?? []} tournamentName={tournament.name} tournament={tournament} isPro={ownerIsPro} />
            </TabsContent>
            <TabsContent value="fixtures">
              <PublicFixturesTab tournament={tournament} teams={teams ?? []} fixtures={fixtures ?? []} lang={lang} />
            </TabsContent>
            <TabsContent value="stats">
              <StatsTab teams={teams ?? []} events={allEvents} />
            </TabsContent>
          </Tabs>
        )}

        {/* ── LEAGUE+PLAYOFF: standings + fixtures + playoff + stats ── */}
        {fmt === 'league_playoff' && (
          <Tabs defaultValue="standings">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm mb-6">
              <div className="overflow-x-auto scrollbar-hide px-2 py-2">
                <TabsList className="flex h-auto gap-1 bg-transparent p-0 w-max">
                  {[['standings','Таблица'],['fixtures','Матчи'],['playoff','Плей-офф'],['stats','Статистика']].map(([v,l]) => (
                    <TabsTrigger key={v} value={v}
                      className="inline-flex items-center h-9 px-4 rounded-xl text-sm font-bold whitespace-nowrap text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all data-[active]:bg-emerald-600 data-[active]:text-white data-[active]:shadow-md">
                      {l}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>
            <TabsContent value="standings">
              <StandingsTab teams={teams ?? []} fixtures={fixtures ?? []} tournamentName={tournament.name} tournament={tournament} isPro={ownerIsPro} />
            </TabsContent>
            <TabsContent value="fixtures">
              <PublicFixturesTab tournament={tournament} teams={teams ?? []} fixtures={fixtures ?? []} lang={lang} />
            </TabsContent>
            <TabsContent value="playoff">
              <PublicBracket teams={teams ?? []} matches={playoffMatches ?? []} />
            </TabsContent>
            <TabsContent value="stats">
              <StatsTab teams={teams ?? []} events={allEvents} />
            </TabsContent>
          </Tabs>
        )}

        {/* ── GROUPS + PLAYOFF: group stage standings + fixtures + playoff + stats ── */}
        {fmt === 'groups_playoff' && (
          <Tabs defaultValue="groups">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm mb-6">
              <div className="overflow-x-auto scrollbar-hide px-2 py-2">
                <TabsList className="flex h-auto gap-1 bg-transparent p-0 w-max">
                  {[['groups','Группы'],['fixtures','Матчи'],['playoff','Плей-офф'],['stats','Статистика']].map(([v,l]) => (
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
                <GroupStandingsTab teams={teams ?? []} fixtures={fixtures ?? []} tournament={tournament} isPro={ownerIsPro} />
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                  <p className="font-bold text-gray-500">Групповой этап начнётся после старта турнира</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="fixtures">
              <PublicFixturesTab tournament={tournament} teams={teams ?? []} fixtures={fixtures ?? []} lang={lang} />
            </TabsContent>
            <TabsContent value="playoff">
              <PublicBracket teams={teams ?? []} matches={playoffMatches ?? []} />
            </TabsContent>
            <TabsContent value="stats">
              <StatsTab teams={teams ?? []} events={allEvents} />
            </TabsContent>
          </Tabs>
        )}

        {/* ── PLAYOFF / DOUBLE ELIMINATION: full bracket view ── */}
        {(fmt === 'playoff' || fmt === 'double_elim') && (
          <Tabs defaultValue="playoff">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm mb-6">
              <div className="overflow-x-auto scrollbar-hide px-2 py-2">
                <TabsList className="flex h-auto gap-1 bg-transparent p-0 w-max">
                  {[['playoff','Сетка'],['stats','Статистика']].map(([v,l]) => (
                    <TabsTrigger key={v} value={v}
                      className="inline-flex items-center h-9 px-4 rounded-xl text-sm font-bold whitespace-nowrap text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all data-[active]:bg-emerald-600 data-[active]:text-white data-[active]:shadow-md">
                      {l}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>
            <TabsContent value="playoff">
              <PublicBracket teams={teams ?? []} matches={playoffMatches ?? []} />
            </TabsContent>
            <TabsContent value="stats">
              <StatsTab teams={teams ?? []} events={allEvents} />
            </TabsContent>
          </Tabs>
        )}
        {/* CTA for viewers */}
        <div className="mt-10 bg-emerald-600 rounded-2xl p-6 text-center text-white">
          <Trophy size={28} className="mx-auto mb-3 opacity-80" />
          <p className="font-black text-lg mb-1">Организуй свой турнир бесплатно</p>
          <p className="text-sm text-emerald-100 mb-5">Всё включено: расписание, таблица, табло</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-6 py-2.5 rounded-xl shadow-md transition-colors text-sm"
          >
            <Plus size={15} /> Создать турнир
          </Link>
        </div>

        {/* Powered by Tournable badge */}
        {!ownerIsPro && (
          <div className="mt-6 text-center pb-2">
            <a
              href={`${appUrl}?ref=tournament-badge`}
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
