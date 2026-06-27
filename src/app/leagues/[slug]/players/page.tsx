import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tournable.app'

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

  const { data: teams } = await supabase
    .from('league_teams')
    .select('id, name, slug, players(id, name, number, position)')
    .eq('league_id', league.id)
    .order('name')

  const POSITION_LABELS: Record<string, string> = {
    goalkeeper: 'ВРТ', defender: 'ЗАЩ', midfielder: 'ПЗ', forward: 'НАП', other: '—',
  }

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white">
      <div className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <Link href={`/leagues/${slug}`} className="text-xs text-white/30 hover:text-white/60 font-medium mb-3 inline-block">
            ← {league.name}
          </Link>
          <h1 className="text-2xl font-black">Игроки</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {(teams ?? []).map((team: any) => (
          <div key={team.id}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-900/50 flex items-center justify-center text-xs font-black text-purple-300 shrink-0">
                {team.name.slice(0, 2).toUpperCase()}
              </div>
              <Link href={`/leagues/${slug}/teams/${team.slug}`} className="font-black text-white hover:text-purple-300 transition-colors">
                {team.name}
              </Link>
              <span className="text-xs text-white/30">{team.players?.length ?? 0} игроков</span>
            </div>
            {(team.players ?? []).length > 0 ? (
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                {(team.players as any[]).sort((a, b) => (a.number ?? 99) - (b.number ?? 99)).map((p: any, i: number) => (
                  <div key={p.id} className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-white/5' : ''}`}>
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
              <p className="text-xs text-white/30 pl-9">Состав не заполнен</p>
            )}
          </div>
        ))}

        {(teams ?? []).length === 0 && (
          <p className="text-center py-12 text-white/30">Команды не добавлены</p>
        )}
      </div>
    </div>
  )
}
