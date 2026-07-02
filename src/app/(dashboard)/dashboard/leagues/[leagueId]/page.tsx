import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { getUserPlan } from '@/app/actions/billing'
import Link from 'next/link'
import { ChevronLeft, ExternalLink, Globe } from 'lucide-react'
import SeasonsTab from './SeasonsTab'
import TeamsTab from './TeamsTab'
import SquadsTab from './SquadsTab'
import SettingsTab from './SettingsTab'
import type { League, Season, LeagueTeam, Player } from '@/types'

export const dynamic = 'force-dynamic'

type Lang = 'ru' | 'kz' | 'en'

const SPORT_LABELS: Record<Lang, Record<string, string>> = {
  ru: {
    football: 'Футбол', futsal: 'Футзал', efootball: 'Киберфутбол',
    basketball: 'Баскетбол', streetball: 'Стритбол', ebasketball: 'Кибербаскетбол',
    volleyball: 'Волейбол', beach_volleyball: 'Пляжный волейбол',
    hockey: 'Хоккей', other: 'Другое',
  },
  kz: {
    football: 'Футбол', futsal: 'Футзал', efootball: 'Кибер футбол',
    basketball: 'Баскетбол', streetball: 'Стритбол', ebasketball: 'Кибер баскетбол',
    volleyball: 'Волейбол', beach_volleyball: 'Пляжды волейбол',
    hockey: 'Хоккей', other: 'Басқа',
  },
  en: {
    football: 'Football', futsal: 'Futsal', efootball: 'eFootball',
    basketball: 'Basketball', streetball: 'Streetball', ebasketball: 'eBasketball',
    volleyball: 'Volleyball', beach_volleyball: 'Beach volleyball',
    hockey: 'Hockey', other: 'Other',
  },
}

const T = {
  ru: {
    allTournaments: 'Все турниры',
    publicPage: 'Публичная страница',
    tabs: {
      seasons: 'Сезоны',
      teams: 'Команды',
      squads: 'Составы',
      settings: 'Настройки',
    },
  },
  kz: {
    allTournaments: 'Барлық турнирлер',
    publicPage: 'Ашық бет',
    tabs: {
      seasons: 'Маусымдар',
      teams: 'Командалар',
      squads: 'Құрамдар',
      settings: 'Баптаулар',
    },
  },
  en: {
    allTournaments: 'All tournaments',
    publicPage: 'Public page',
    tabs: {
      seasons: 'Seasons',
      teams: 'Teams',
      squads: 'Squads',
      settings: 'Settings',
    },
  },
} as const

function getTabs(lang: Lang) {
  const tx = T[lang]
  return [
    { id: 'seasons',  label: tx.tabs.seasons },
    { id: 'teams',    label: tx.tabs.teams },
    { id: 'squads',   label: tx.tabs.squads },
    { id: 'settings', label: tx.tabs.settings },
  ]
}

export default async function LeagueManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const plan = await getUserPlan()
  if (plan !== 'enterprise') redirect('/dashboard')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const langRaw = cookieStore.get('lang')?.value ?? 'ru'
  const lang: Lang = (['ru', 'kz', 'en'] as Lang[]).includes(langRaw as Lang) ? (langRaw as Lang) : 'ru'
  const tx = T[lang]
  const TABS = getTabs(lang)

  const { leagueId } = await params
  const { tab: activeTab = 'seasons' } = await searchParams

  const [
    { data: leagueRaw },
    { data: seasonsRaw },
    { data: teamsRaw },
  ] = await Promise.all([
    supabase.from('leagues').select('*').eq('id', leagueId).eq('owner_id', user.id).maybeSingle(),
    supabase.from('seasons').select('*').eq('league_id', leagueId).order('created_at', { ascending: false }),
    supabase.from('league_teams').select('*, players(*)').eq('league_id', leagueId).order('name'),
  ])

  if (!leagueRaw) notFound()

  const league = leagueRaw as League
  const seasons = (seasonsRaw ?? []) as Season[]
  const teamsWithPlayers = (teamsRaw ?? []) as (LeagueTeam & { players: Player[] })[]
  const teams = teamsWithPlayers.map(({ players: _p, ...t }) => t) as LeagueTeam[]

  const activeTabId = TABS.some(t => t.id === activeTab) ? activeTab : 'seasons'

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4">
          <ChevronLeft size={14} /> {tx.allTournaments}
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-2xl font-black text-gray-900">{league.name}</h1>
              {league.sport && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  {SPORT_LABELS[lang][league.sport] ?? league.sport}
                </span>
              )}
            </div>
            {league.city && <p className="text-sm text-gray-400">{league.city}</p>}
          </div>
          {league.is_public && (
            <a
              href={`/leagues/${league.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 text-sm text-purple-500 hover:text-purple-700 font-medium transition-colors shrink-0"
            >
              <Globe size={14} />
              {tx.publicPage}
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-100 pb-0">
        {TABS.map(tab => (
          <Link
            key={tab.id}
            href={`?tab=${tab.id}`}
            className={`px-4 py-2.5 text-sm font-bold rounded-t-xl transition-colors -mb-px ${
              activeTabId === tab.id
                ? 'bg-white border border-gray-100 border-b-white text-purple-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
            {tab.id === 'seasons' && seasons.length > 0 && (
              <span className="ml-1.5 text-[10px] font-black bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
                {seasons.length}
              </span>
            )}
            {tab.id === 'teams' && teams.length > 0 && (
              <span className="ml-1.5 text-[10px] font-black bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
                {teams.length}
              </span>
            )}
            {tab.id === 'squads' && teamsWithPlayers.reduce((s, t) => s + t.players.length, 0) > 0 && (
              <span className="ml-1.5 text-[10px] font-black bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
                {teamsWithPlayers.reduce((s, t) => s + t.players.length, 0)}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100">
        {activeTabId === 'seasons' && (
          <SeasonsTab leagueId={leagueId} seasons={seasons} lang={lang} />
        )}
        {activeTabId === 'teams' && (
          <TeamsTab leagueId={leagueId} teams={teams} lang={lang} />
        )}
        {activeTabId === 'squads' && (
          <SquadsTab leagueId={leagueId} teams={teamsWithPlayers} lang={lang} tabsLabel={tx.tabs.teams} />
        )}
        {activeTabId === 'settings' && (
          <SettingsTab league={league} lang={lang} />
        )}
      </div>
    </div>
  )
}
