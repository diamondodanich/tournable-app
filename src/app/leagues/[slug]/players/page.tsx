import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getChampionshipPlayerStats } from '@/app/actions/leagues'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tournable.app'

type Lang = 'ru' | 'kz' | 'en'
async function getLang(): Promise<Lang> {
  const v = (await cookies()).get('lang')?.value
  return v === 'kz' || v === 'en' ? v : 'ru'
}
const PT = {
  ru: { title: 'Игроки', players: 'игроков', noSquad: 'Состав не заполнен', noTeams: 'Команды не добавлены', leaders: 'Лидеры за всю историю', player: 'Игрок', goals: 'Голы', assists: 'Ассисты', seasonsN: (n: number) => `сезонов: ${n}`, pos: { goalkeeper: 'ВРТ', defender: 'ЗАЩ', midfielder: 'ПЗ', forward: 'НАП', other: '—' } },
  kz: { title: 'Ойыншылар', players: 'ойыншы', noSquad: 'Құрам толтырылмаған', noTeams: 'Командалар қосылмаған', leaders: 'Барлық тарих көшбасшылары', player: 'Ойыншы', goals: 'Голдар', assists: 'Ассисттер', seasonsN: (n: number) => `маусым: ${n}`, pos: { goalkeeper: 'ҚҚ', defender: 'ҚОРҒ', midfielder: 'ЖШ', forward: 'ШАБ', other: '—' } },
  en: { title: 'Players', players: 'players', noSquad: 'Squad not filled', noTeams: 'No teams added', leaders: 'All-time leaders', player: 'Player', goals: 'Goals', assists: 'Assists', seasonsN: (n: number) => `seasons: ${n}`, pos: { goalkeeper: 'GK', defender: 'DEF', midfielder: 'MID', forward: 'FWD', other: '—' } },
} as const

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const supabase = await createClient()
  const { slug } = await params
  const { data: l } = await supabase.from('leagues').select('name').eq('slug', slug).eq('is_public', true).maybeSingle()
  if (!l) return { title: 'Лига не найдена' }
  return { title: `Игроки — ${l.name}`, description: `Состав всех команд лиги ${l.name}.` }
}

export default async function LeaguePlayersPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient()
  const { slug } = await params

  const { data: league } = await supabase.from('leagues').select('id, name').eq('slug', slug).eq('is_public', true).maybeSingle()
  if (!league) notFound()

  const [{ data: teams }, allTimeStats] = await Promise.all([
    supabase
      .from('league_teams')
      .select('id, name, slug, players(*)')
      .eq('league_id', league.id)
      .order('name'),
    getChampionshipPlayerStats(league.id),
  ])
  const allTimeLeaders = allTimeStats.filter(s => s.goals > 0 || s.assists > 0).slice(0, 10)

  const tx = PT[await getLang()]
  const POSITION_LABELS: Record<string, string> = tx.pos

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white">
      <div className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <Link href={`/leagues/${slug}`} className="text-xs text-white/30 hover:text-white/60 font-medium mb-3 inline-block">
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
              <div className="grid grid-cols-[2rem_1fr_3rem_3rem] gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/30 border-b border-white/10">
                <span>#</span><span>{tx.player}</span><span className="text-center">{tx.goals}</span><span className="text-center">{tx.assists}</span>
              </div>
              {allTimeLeaders.map((s, i) => (
                <div key={`${s.teamName}|${s.player}`} className={`grid grid-cols-[2rem_1fr_3rem_3rem] gap-2 items-center px-4 py-2.5 ${i > 0 ? 'border-t border-white/5' : ''}`}>
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
                  <span className="text-center text-sm font-black text-purple-300 tabular-nums">{s.goals}</span>
                  <span className="text-center text-sm text-white/50 tabular-nums">{s.assists}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(teams ?? []).map((team: any) => (
          <div key={team.id}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-900/50 flex items-center justify-center text-xs font-black text-purple-300 shrink-0">
                {team.name.slice(0, 2).toUpperCase()}
              </div>
              <Link href={`/leagues/${slug}/teams/${team.slug}`} className="font-black text-white hover:text-purple-300 transition-colors">
                {team.name}
              </Link>
              <span className="text-xs text-white/30">{team.players?.length ?? 0} {tx.players}</span>
            </div>
            {(team.players ?? []).length > 0 ? (
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
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
                    <span className="text-[10px] font-bold text-white/40 bg-white/10 px-1.5 py-0.5 rounded shrink-0">
                      {POSITION_LABELS[p.position ?? 'other']}
                    </span>
                    <Link href={`/leagues/${slug}/players/${p.id}`} className="flex-1 text-sm font-bold text-white/90 hover:text-purple-300 transition-colors">
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
