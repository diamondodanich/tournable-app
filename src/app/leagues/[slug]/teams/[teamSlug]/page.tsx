import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: 'ВРТ', defender: 'ЗАЩ', midfielder: 'ПЗ', forward: 'НАП', other: '—',
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; teamSlug: string }> }): Promise<Metadata> {
  const supabase = await createClient()
  const { slug, teamSlug } = await params
  const { data: t } = await supabase
    .from('league_teams')
    .select('name, leagues!inner(slug)')
    .eq('slug', teamSlug)
    .eq('leagues.slug', slug)
    .maybeSingle()
  return { title: t ? `${t.name} — профиль команды` : 'Команда не найдена' }
}

export default async function TeamProfilePage({ params }: { params: Promise<{ slug: string; teamSlug: string }> }) {
  const supabase = await createClient()
  const { slug, teamSlug } = await params

  const { data: teamRaw } = await supabase
    .from('league_teams')
    .select('*, leagues!inner(id, name, slug, sport), players(*)')
    .eq('slug', teamSlug)
    .eq('leagues.slug', slug)
    .maybeSingle()

  if (!teamRaw) notFound()

  const team = teamRaw as any
  const league = team.leagues
  const players = (team.players ?? []) as any[]

  // Fetch season history
  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, name, status, tournament_id')
    .eq('league_id', league.id)
    .order('created_at', { ascending: false })

  // For each season with a tournament, find this team's record by name match
  type SeasonRecord = { seasonName: string; position: number | null; GP: number; W: number; D: number; L: number; Pts: number }
  const history: SeasonRecord[] = []

  for (const season of seasons ?? []) {
    if (!season.tournament_id) continue

    const [{ data: tourn }, { data: teamsData }, { data: fixturesData }] = await Promise.all([
      supabase.from('tournaments').select('points_win,points_draw,points_loss').eq('id', season.tournament_id).maybeSingle(),
      supabase.from('teams').select('id,name').eq('tournament_id', season.tournament_id),
      supabase.from('fixtures').select('home_team_id,away_team_id,home_score,away_score,played,is_bye').eq('tournament_id', season.tournament_id).eq('played', true).eq('is_bye', false),
    ])

    const matchingTeam = (teamsData ?? []).find((t: any) => t.name.toLowerCase() === team.name.toLowerCase())
    if (!matchingTeam) continue

    const pw = tourn?.points_win ?? 3, pd = tourn?.points_draw ?? 1, pl = tourn?.points_loss ?? 0
    const map = new Map<string, { GP: number; W: number; D: number; L: number; GF: number; GA: number; Pts: number }>()
    for (const t of teamsData ?? []) map.set(t.id, { GP: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 })
    for (const f of fixturesData ?? []) {
      if (f.home_score == null || f.away_score == null) continue
      const home = map.get(f.home_team_id); const away = map.get(f.away_team_id)
      const hs = f.home_score, as = f.away_score
      if (home) { home.GP++; home.GF += hs; home.GA += as; if (hs > as) { home.W++; home.Pts += pw } else if (hs === as) { home.D++; home.Pts += pd } else { home.L++; home.Pts += pl } }
      if (away) { away.GP++; away.GF += as; away.GA += hs; if (as > hs) { away.W++; away.Pts += pw } else if (as === hs) { away.D++; away.Pts += pd } else { away.L++; away.Pts += pl } }
    }

    const sorted = [...map.entries()].sort(([, a], [, b]) => b.Pts - a.Pts)
    const position = sorted.findIndex(([id]) => id === matchingTeam.id) + 1
    const stats = map.get(matchingTeam.id)!
    history.push({ seasonName: season.name, position: position || null, ...stats })
  }

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white">
      <div className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Link href={`/leagues/${slug}`} className="text-xs text-white/30 hover:text-white/60 font-medium mb-4 inline-block">
            ← {league.name}
          </Link>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-2xl font-black text-purple-300 shrink-0">
              {team.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black">{team.name}</h1>
              {team.city && <p className="text-sm text-white/40 mt-1">{team.city}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Roster */}
        <div>
          <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Состав ({players.length})</p>
          {players.length === 0 ? (
            <p className="text-sm text-white/30">Состав не заполнен</p>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {players.sort((a: any, b: any) => (a.number ?? 99) - (b.number ?? 99)).map((p: any, i: number) => (
                <Link key={p.id} href={`/leagues/${slug}/players/${p.id}`}>
                  <div className={`flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors ${i > 0 ? 'border-t border-white/5' : ''}`}>
                    {p.number != null && <span className="w-5 text-right text-xs font-black text-white/30 shrink-0">{p.number}</span>}
                    <span className="text-[10px] font-bold text-white/40 bg-white/10 px-1.5 py-0.5 rounded shrink-0">
                      {POSITION_LABELS[p.position ?? 'other']}
                    </span>
                    <span className="flex-1 text-sm font-bold text-white/90">{p.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        <div>
          <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">История сезонов</p>
          {history.length === 0 ? (
            <p className="text-sm text-white/30">Нет данных</p>
          ) : (
            <div className="space-y-2">
              {history.map(record => (
                <div key={record.seasonName} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-sm text-white">{record.seasonName}</p>
                    {record.position && (
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        record.position === 1 ? 'bg-yellow-900/60 text-yellow-400' : 'bg-white/10 text-white/50'
                      }`}>
                        #{record.position}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/40">
                    <span>{record.GP} игр</span>
                    <span className="text-emerald-400">{record.W}В</span>
                    <span>{record.D}Н</span>
                    <span className="text-red-400">{record.L}П</span>
                    <span className="ml-auto font-black text-white">{record.Pts} очков</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
