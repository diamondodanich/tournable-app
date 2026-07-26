// Squad list of a championship, shared by the three language URLs.

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getChampionshipPlayerStats } from '@/app/actions/leagues'
import { getEventDefs, getPositionLabel, type Lang } from '@/lib/sports'
import { absUrl, trilingualAlternates, langPrefix, jsonLdGraph, breadcrumbsLd, itemListLd } from '@/lib/seo'
import { playersMeta, NOT_FOUND_TITLE } from '@/lib/entitySeo'

const PT = {
  ru: { title: 'Игроки', players: 'игроков', noSquad: 'Состав не заполнен', noTeams: 'Команды не добавлены', leaders: 'Лидеры за всю историю', player: 'Игрок', seasonsN: (n: number) => `сезонов: ${n}`, crumb: 'Чемпионаты' },
  kz: { title: 'Ойыншылар', players: 'ойыншы', noSquad: 'Құрам толтырылмаған', noTeams: 'Командалар қосылмаған', leaders: 'Барлық тарих көшбасшылары', player: 'Ойыншы', seasonsN: (n: number) => `маусым: ${n}`, crumb: 'Чемпионаттар' },
  en: { title: 'Players', players: 'players', noSquad: 'Squad not filled', noTeams: 'No teams added', leaders: 'All-time leaders', player: 'Player', seasonsN: (n: number) => `seasons: ${n}`, crumb: 'Championships' },
} as const

export async function leaguePlayersMetadata(slug: string, lang: Lang): Promise<Metadata> {
  const supabase = await createClient()
  const { data: l } = await supabase
    .from('leagues').select('name, sport').eq('slug', slug).eq('is_public', true).maybeSingle()
  if (!l) return { title: NOT_FOUND_TITLE[lang].league, robots: { index: false, follow: false } }

  const { title, description } = playersMeta(lang, { name: l.name, sport: l.sport })
  const path = `/leagues/${slug}/players`
  return {
    title, description,
    alternates: trilingualAlternates(path, lang),
    openGraph: { title, description, type: 'website', url: absUrl(`${langPrefix(lang)}${path}`), siteName: 'Tournable' },
  }
}

export default async function LeaguePlayersPage({ slug, lang }: { slug: string; lang: Lang }) {
  const supabase = await createClient()
  const prefix = langPrefix(lang)

  const { data: league } = await supabase.from('leagues').select('id, name, sport').eq('slug', slug).eq('is_public', true).maybeSingle()
  if (!league) notFound()

  const [{ data: teams }, allTimeStats] = await Promise.all([
    supabase
      .from('league_teams')
      .select('id, name, slug, players(*)')
      .eq('league_id', league.id)
      .order('name'),
    getChampionshipPlayerStats(league.id),
  ])

  const tx = PT[lang]

  // Leader columns driven by the championship's discipline (max 2 in this compact list).
  const statDefs = getEventDefs(league.sport).filter(d => d.stat).slice(0, 2)
  const primary = statDefs[0]
  const allTimeLeaders = primary
    ? allTimeStats
        .filter(s => statDefs.some(d => (s.counts[d.type] ?? 0) > 0))
        .sort((a, b) => (b.counts[primary.type] ?? 0) - (a.counts[primary.type] ?? 0))
        .slice(0, 10)
    : []
  const leaderGrid = { gridTemplateColumns: `2rem 1fr ${statDefs.map(() => '3rem').join(' ')}` }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPlayers = ((teams ?? []) as any[]).flatMap(t => (t.players ?? []).map((p: any) => ({
    name: p.name as string,
    path: `${prefix}/leagues/${slug}/players/${p.id}`,
  })))

  const jsonLd = jsonLdGraph(
    allPlayers.length ? itemListLd(allPlayers) : null,
    breadcrumbsLd([
      { name: 'Tournable', path: prefix || '/' },
      { name: tx.crumb, path: `${prefix}/leagues` },
      { name: league.name, path: `${prefix}/leagues/${slug}` },
      { name: tx.title, path: `${prefix}/leagues/${slug}/players` },
    ]),
  )

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <Link href={`${prefix}/leagues/${slug}`} className="text-xs text-white/30 hover:text-white/60 font-medium mb-3 inline-block">
            ← {league.name}
          </Link>
          <h1 className="text-2xl font-black">{tx.title}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* All-time championship leaders — aggregated across every season */}
        {allTimeLeaders.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
              <h2 className="font-black text-white text-sm uppercase tracking-widest">{tx.leaders}</h2>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="grid gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/30 border-b border-white/10" style={leaderGrid}>
                <span>#</span><span>{tx.player}</span>
                {statDefs.map(d => <span key={d.type} className="text-center">{d.label[lang]}</span>)}
              </div>
              {allTimeLeaders.map((s, i) => (
                <div key={`${s.teamName}|${s.player}`} className={`grid gap-2 items-center px-4 py-2.5 ${i > 0 ? 'border-t border-white/5' : ''}`} style={leaderGrid}>
                  <span className={`text-xs font-black ${i === 0 ? 'text-purple-300' : 'text-white/30'}`}>{i + 1}</span>
                  <span className="min-w-0 flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full overflow-hidden bg-purple-900/50 shrink-0 flex items-center justify-center text-[10px] font-black text-purple-300">
                      {s.photo
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={s.photo} alt="" className="w-full h-full object-cover" />
                        : s.player.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="text-sm font-bold text-white/90 truncate block">{s.player}</span>
                      <span className="text-[11px] text-white/30 truncate block">{s.teamName}{s.seasons > 1 ? ` · ${tx.seasonsN(s.seasons)}` : ''}</span>
                    </span>
                  </span>
                  {statDefs.map((d, di) => (
                    <span key={d.type} className={`text-center text-sm tabular-nums ${di === 0 ? 'font-black text-purple-300' : 'text-white/50'}`}>{s.counts[d.type] ?? 0}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {((teams ?? []) as any[]).map((team: any) => (
          <div key={team.id}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-900/50 flex items-center justify-center text-xs font-black text-purple-300 shrink-0">
                {team.name.slice(0, 2).toUpperCase()}
              </div>
              <Link href={`${prefix}/leagues/${slug}/teams/${team.slug}`} className="font-black text-white hover:text-purple-300 transition-colors">
                {team.name}
              </Link>
              <span className="text-xs text-white/30">{team.players?.length ?? 0} {tx.players}</span>
            </div>
            {(team.players ?? []).length > 0 ? (
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(team.players as any[]).sort((a, b) => (a.number ?? 99) - (b.number ?? 99)).map((p: any, i: number) => (
                  <div key={p.id} className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-white/5' : ''}`}>
                    <span className="w-8 h-8 rounded-full overflow-hidden bg-purple-900/50 shrink-0 flex items-center justify-center text-[10px] font-black text-purple-300">
                      {p.photo_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                        : p.name.slice(0, 2).toUpperCase()}
                    </span>
                    {p.number != null && (
                      <span className="w-6 text-right text-xs font-black text-white/30 shrink-0">{p.number}</span>
                    )}
                    {getPositionLabel(league.sport, p.position, lang, true) && (
                      <span className="text-[10px] font-bold text-white/40 bg-white/10 px-1.5 py-0.5 rounded shrink-0">
                        {getPositionLabel(league.sport, p.position, lang, true)}
                      </span>
                    )}
                    <Link href={`${prefix}/leagues/${slug}/players/${p.id}`} className="flex-1 text-sm font-bold text-white/90 hover:text-purple-300 transition-colors">
                      {p.name}
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/30 pl-9">{tx.noSquad}</p>
            )}
          </div>
        ))}

        {(teams ?? []).length === 0 && (
          <p className="text-center py-12 text-white/30">{tx.noTeams}</p>
        )}
      </div>
    </div>
  )
}
